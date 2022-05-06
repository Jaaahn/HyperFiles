<template>
    <div class="fileList">
        <div class="header">
            <h3>{{ _.capitalize(type) }}</h3>

            <hy-flex-container :allowBreak="false">
                <hy-button @click="openParentFolder()" :extend="false" :disabled="paths[type] == '/'" type="transparent">
                    <i class="icon-chevron-down"></i>
                </hy-button>

                <input :value="paths[type]" @keyup="updatePaths($event)" />

                <hy-button v-if="type == 'local'" @click="selectPathWithFinder()" :extend="false" type="transparent">
                    <i class="icon-target"></i>
                </hy-button>

                <hy-popover v-if="type == 'local'" v-model="openDirectoryShown" :hover="true">
                    <template #element>
                        <hy-button @click="openDirectoryShown = !openDirectoryShown" :extend="false" type="transparent">
                            <i class="icon-arrow-up-right-from-square" title="Open current directory"></i>
                        </hy-button>
                    </template>
                    <template #popover>
                        <hy-button @click="openCurrentDirectoryInFinder()">
                            <i class="icon-arrow-up-right-from-square"></i>
                            Open in file explorer
                        </hy-button>

                        <hy-button @click="openCurrentDirectoryInEditor()">
                            <i class="icon-arrow-up-right-from-square"></i>
                            Open in editor
                        </hy-button>
                    </template>
                </hy-popover>

                <hy-button @click="hideDotFiles = !hideDotFiles" :extend="false" type="transparent">
                    <i class="icon-eye-slash" v-if="hideDotFiles == true" title="Switch to displaying all files"></i>
                    <i class="icon-eye" v-if="hideDotFiles == false" title="Switch to hiding Dotfiles"></i>
                </hy-button>

                <hy-button @click="openNewDirDialogue()" :extend="false" type="transparent">
                    <i class="icon-folder-plus"></i>
                </hy-button>
            </hy-flex-container>
        </div>

        <div class="files">
            <FileItem class="file" v-for="file in filteredFiles" :file="file" :client="client" :paths="paths" :type="type" :watchingFile="watchedFiles.includes(file.path)" :key="file" @fetchLocal="$emit('fetchLocal')" @fetchRemote="$emit('fetchRemote')" @watchFile="watchFileStartStop($event, file)" @dblclick.native="openFolder(file)" />
        </div>

        <div class="viewInfo" v-if="loadingFiles[type]">
            <hy-loader />
        </div>
        <div class="viewInfo" v-else-if="isPathInvalid">
            <h3>Invalid Path</h3>
        </div>
        <div class="viewInfo" v-else-if="filteredFiles.length == 0">
            <h3>Empty Directory</h3>
            <p v-if="files.length != 0">There are hidden Dotfiles</p>
        </div>
    </div>

    <Modal :open="newDir.open" @close="newDir.open = false">
        <h2>New directory in {{ type }}</h2>
        <hy-input v-model="newDir.name" placeholder="Name of new directory" />
        <hy-button @click="createNewDir()" :disabled="newDir.name == ''" :loading="newDir.loading" type="primary"> <i class="icon-plus"></i> </hy-button>
    </Modal>
</template>

<script>
import FileItem from "./FileItem.vue";
import Modal from "./Modal.vue";

import _ from "lodash";

import { settings } from "../state.js";

let fsp = require("fs/promises");
let pathModule = require("path");
let shell = require("electron").shell;
let chokidar = require("chokidar");
const { dialog } = require("@electron/remote");
const { spawn } = require("child_process");

import PQueue from "p-queue";
const autoUploadQueue = new PQueue({ concurrency: 1 });

export default {
    name: "FileList",
    emits: ["fetchLocal", "fetchRemote", "updatePaths"],
    props: {
        type: String,
        files: Array,
        paths: Object,
        profileInfo: Object,
        client: Object,
        loadingFiles: Object,
    },
    data() {
        return {
            hideDotFiles: this.type == "local" ? true : false,
            newDir: {
                open: false,
                name: "",
                loading: false,
            },
            watchedFiles: [],
            fileWatcher: null,
            openDirectoryShown: false,
            settings,
            _,
        };
    },
    computed: {
        filteredFiles() {
            return this.filterFiles(this.files, this.hideDotFiles);
        },
        isPathInvalid() {
            if (this.type == "local") return this.paths.localIsInvalid;
            else return this.paths.remoteIsInvalid;
        },
    },
    methods: {
        async createNewDir() {
            this.newDir.loading = true;
            let newDirPath = pathModule.join(this.paths[this.type], this.newDir.name);

            try {
                if (this.type == "remote") {
                    await this.client.mkdir(newDirPath);
                } else {
                    await fsp.mkdir(newDirPath);
                }

                if (this.type == "local") this.$emit("fetchLocal");
                else this.$emit("fetchRemote");

                this.newDir.name = "";
                this.newDir.open = false;
            } catch (error) {
                console.error(error);
                alert("Error while creating directory");
            }

            this.newDir.loading = false;
        },
        openNewDirDialogue() {
            this.newDir.name = "";
            this.newDir.open = true;
        },
        updatePaths(event) {
            if (event.code != "Enter") return;

            this.$emit("updatePaths", event.target.value, this.type);
            this.closeFileWatcher();
        },
        openParentFolder() {
            let newPath = pathModule.join(this.paths[this.type], "..");
            this.$emit("updatePaths", newPath, this.type);
            this.closeFileWatcher();
        },
        openFolder(file) {
            if (file.type != "d") return;

            this.$emit("updatePaths", file.path, this.type);
            this.closeFileWatcher();
        },
        async selectPathWithFinder() {
            if (this.type != "local") return;

            let info = await dialog.showOpenDialog({
                properties: ["openDirectory"],
                defaultPath: this.paths[this.type],
            });

            let path = info.filePaths[0];

            if (path == undefined) return;

            this.$emit("updatePaths", path, this.type);
            this.closeFileWatcher();
        },
        filterFiles(files, filterDotFilesOut) {
            return files.filter((file) => {
                if (filterDotFilesOut == false) return true;
                return file.name[0] != "."; // Return true if filename doesn't start with "."
            });
        },
        watchFileStartStop(value, file) {
            if (this.type != "local") return;

            if (value) {
                this.watchedFiles.push(file.path);

                if (this.fileWatcher == null) this.initFileWatcher(file.path);
                else this.fileWatcher.add(file.path);
            } else {
                let index = this.watchedFiles.indexOf(file.path);
                this.watchedFiles.splice(index, 1);

                this.fileWatcher.unwatch(file.path);
            }
        },
        initFileWatcher(path) {
            if (this.type != "local") return;

            this.fileWatcher = chokidar.watch(path);

            let uploadFile = async (path) => {
                let relativeLocalPath = pathModule.relative(this.paths.local, path);
                let remoteFilePath = pathModule.join(this.paths.remote, relativeLocalPath);

                let fileStats = await fsp.lstat(path);

                console.log("Auto-Uploading", path);

                try {
                    if (fileStats.isDirectory()) await this.client.uploadDir(path, remoteFilePath);
                    if (fileStats.isFile()) await this.client.fastPut(path, remoteFilePath);

                    this.$emit("fetchRemote");
                } catch (error) {
                    console.error(error);
                    alert("Error while Auto-Uploading");
                }
            };

            let addToQueue = (path) => {
                autoUploadQueue.add(() => uploadFile(path));
            };

            this.fileWatcher.on("add", addToQueue);
            this.fileWatcher.on("addDir", addToQueue);
            this.fileWatcher.on("change", addToQueue);

            this.fileWatcher.on("error", (error) => {
                console.error(error);
                alert("File-Watcher for Auto-Upload threw an error");
            });
        },
        async closeFileWatcher() {
            if (this.fileWatcher == null || this.type != "local") return;

            try {
                await this.fileWatcher.close();
                this.fileWatcher = null;
                this.watchedFiles.length = 0;
            } catch (error) {
                console.error(error);
                alert("Stopping File-Watcher for Auto-Upload failed");
            }
        },
        async openCurrentDirectoryInFinder() {
            if (this.type != "local") return;

            try {
                await shell.openPath(this.paths[this.type]);
            } catch (error) {
                console.error(error);
                alert("Error while opening current folder");
            }
        },
        async openCurrentDirectoryInEditor() {
            if (this.type != "local") return;

            let editor = this.settings.editorPath;
            let folder = this.paths[this.type];

            // Check if path exists
            try {
                await fsp.access(editor);
            } catch (error) {
                alert("Invalid path to editor");
                return;
            }

            // Spawn editor
            let options = {
                detached: true,
            };

            let child;

            if (process.platform == "darwin") {
                child = spawn("open", ["-a", editor, folder], options);
            } else {
                child = spawn(editor, [folder], options);
            }

            child.on("error", (error) => {
                console.error("Spawning editor error", error);
                alert("Error opening editor.");
            });
        },
    },
    created() {
        this.$router.beforeEach(() => {
            this.closeFileWatcher();
        });
    },
    components: {
        FileItem,
        Modal,
    },
};
</script>

<style lang="scss" scoped>
.fileList {
    flex: 1;
    background-color: var(--section-bg-color);
    border-radius: var(--section-border-radius);
    padding: var(--element-padding);
    position: relative;
    max-width: calc((100% - 10px) / 2);

    // So that .files expands exactly to the height of this view
    display: flex;
    flex-direction: column;

    .header {
        box-shadow: 0px 10px 10px -10px var(--element-shadow-color);

        h3 {
            margin: 0;
            flex: 0;
        }

        .icon-chevron-down::before {
            transform: rotate(90deg);
        }

        .hyper-flexcontainer {
            margin: 0;
            margin-bottom: 5px;

            input {
                border: none;
                background-color: var(--color-gray-3);
                border-radius: var(--element-border-radius);
                padding: 15px;
                flex: 2;
                color: gray;
                font-size: 15px;
                font-family: monospace;
                min-width: 0px;
            }

            .hyper-button :deep(button) {
                padding: 10px;
            }

            .hyper-popover {
                flex: 0;
            }
        }
    }

    .files {
        overflow-y: scroll;
        display: flex;
        flex-direction: column;
        gap: var(--flex-gap);
        height: auto;
        padding-top: 10px;
    }

    .viewInfo {
        position: absolute;
        top: calc(50% + 40px); // Header height
        left: 50%;
        transform: translate(-50%, -50%);
        padding: var(--section-padding);
        background-color: var(--color-gray-3);
        border-radius: var(--section-border-radius);

        h3,
        p {
            text-align: center;
            margin: 0;
            padding: 0;
        }
    }
}
</style>
