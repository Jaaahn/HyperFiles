<template>
    <div class="filesSplitView">
        <div id="left" class="splitView">
            <div class="header">
                <h3>Local</h3>

                <hy-flex-container :allowBreak="false">
                    <hy-button @click="openParentFolder('local')" :extend="false" :disabled="paths.local == '/'" type="transparent">
                        <i class="icon-chevron-down"></i>
                    </hy-button>

                    <input :value="paths.local" @keyup="updatePaths($event, 'local')" />

                    <hy-button @click="selectLocalPath()" :extend="false" type="transparent">
                        <i class="icon-target"></i>
                    </hy-button>

                    <hy-popover v-model="openDirectoryShown" :hover="true">
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

                    <hy-button @click="hideDotFiles.local = !hideDotFiles.local" :extend="false" type="transparent">
                        <i class="icon-eye-slash" v-if="hideDotFiles.local == true" title="Switch to displaying all files"></i>
                        <i class="icon-eye" v-if="hideDotFiles.local == false" title="Switch to hiding Dotfiles"></i>
                    </hy-button>
                    <hy-button @click="openNewDirDialogue('local')" :extend="false" type="transparent">
                        <i class="icon-folder-plus"></i>
                    </hy-button>
                </hy-flex-container>
            </div>

            <div class="files">
                <FileItem class="file" v-for="file in filteredFiles.local" :file="file" :client="client" :paths="paths" type="local" :watchingFile="watchedFiles.includes(file.path)" :key="file" @fetchRemote="$emit('fetchRemote')" @fetchLocal="$emit('fetchLocal')" @watchFile="watchFileStartStop($event, file)" @dblclick.native="openFolder(file, 'local')" />
            </div>

            <div class="viewInfo" v-if="loadingFiles.local">
                <hy-loader />
            </div>
            <div class="viewInfo" v-else-if="paths.localIsInvalid">
                <h3>Invalid Path</h3>
            </div>
            <div class="viewInfo" v-else-if="filteredFiles.local.length == 0">
                <h3>Empty Directory</h3>
                <p v-if="localFiles.length != 0">There are hidden Dotfiles</p>
            </div>
        </div>

        <div id="right" class="splitView">
            <div class="header">
                <h3>Remote</h3>

                <hy-flex-container :allowBreak="false">
                    <hy-button @click="openParentFolder('remote')" :extend="false" :disabled="paths.remote == '/'" type="transparent">
                        <i class="icon-chevron-down"></i>
                    </hy-button>

                    <input :value="paths.remote" @keyup="updatePaths($event, 'remote')" />

                    <hy-button @click="hideDotFiles.remote = !hideDotFiles.remote" :extend="false" type="transparent">
                        <i class="icon-eye-slash" v-if="hideDotFiles.remote == true" title="Switch to displaying all files"></i>
                        <i class="icon-eye" v-if="hideDotFiles.remote == false" title="Switch to hiding Dotfiles"></i>
                    </hy-button>
                    <hy-button @click="openNewDirDialogue('remote')" :extend="false" type="transparent">
                        <i class="icon-folder-plus"></i>
                    </hy-button>
                </hy-flex-container>
            </div>

            <div class="files">
                <FileItem class="file" v-for="file in filteredFiles.remote" :file="file" :client="client" :paths="paths" type="remote" :watchingFile="watchedFiles.includes(file.path)" :key="file" @fetchRemote="$emit('fetchRemote')" @fetchLocal="$emit('fetchLocal')" @watchFile="watchFileStartStop($event, file)" @dblclick.native="openFolder(file, 'remote')" />
            </div>

            <div class="viewInfo" v-if="loadingFiles.remote">
                <hy-loader />
            </div>
            <div class="viewInfo" v-else-if="paths.remoteIsInvalid">
                <h3>Invalid Path</h3>
            </div>
            <div class="viewInfo" v-else-if="filteredFiles.remote.length == 0">
                <h3>Empty Directory</h3>
                <p v-if="remoteFiles.length != 0">There are hidden Dotfiles</p>
            </div>
        </div>
    </div>

    <Modal :open="newDir.open" @close="newDir.open = false">
        <h2>New directory in {{ newDir.type }}</h2>
        <hy-input v-model="newDir.name" placeholder="Name of new directory" />
        <hy-button @click="createNewDir()" :disabled="newDir.name == ''" :loading="newDir.loading" type="primary"> <i class="icon-plus"></i> </hy-button>
    </Modal>
</template>

<script>
import FileItem from "./FileItem.vue";
import Modal from "./Modal.vue";

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
    name: "FilesSplitView",
    emits: ["fetchRemote", "fetchLocal", "updatePaths"],
    props: {
        remoteFiles: Array,
        localFiles: Array,
        client: Object,
        profileInfo: Object,
        paths: Object,
        loadingFiles: Object,
    },
    data() {
        return {
            hideDotFiles: {
                local: true,
                remote: false,
            },
            newDir: {
                open: false,
                name: "",
                type: "",
                loading: false,
            },
            watchedFiles: [],
            fileWatcher: null,
            openDirectoryShown: false,
            settings,
        };
    },
    computed: {
        filteredFiles() {
            return {
                local: this.filterFiles(this.localFiles, this.hideDotFiles.local),
                remote: this.filterFiles(this.remoteFiles, this.hideDotFiles.remote),
            };
        },
    },
    methods: {
        async createNewDir() {
            this.newDir.loading = true;
            let newDirPath = pathModule.join(this.paths[this.newDir.type], this.newDir.name);

            try {
                if (this.newDir.type == "remote") {
                    await this.client.mkdir(newDirPath);
                    this.$emit("fetchRemote");
                } else {
                    await fsp.mkdir(newDirPath);
                    this.$emit("fetchLocal");
                }

                this.newDir.name = "";
                this.newDir.type = "";
                this.newDir.open = false;
            } catch (error) {
                console.error(error);
                alert("Error while creating directory");
            }

            this.newDir.loading = false;
        },
        openNewDirDialogue(type) {
            this.newDir.type = type;
            this.newDir.name = "";
            this.newDir.open = true;
        },
        updatePaths(event, type) {
            if (event.code != "Enter") return;

            this.$emit("updatePaths", event.target.value, type);

            this.closeFileWatcher();
        },
        openParentFolder(type) {
            let newPath = pathModule.join(this.paths[type], "..");
            this.$emit("updatePaths", newPath, type);
            this.closeFileWatcher();
        },
        openFolder(file, type) {
            if (file.type != "d") return;
            this.$emit("updatePaths", file.path, type);

            this.closeFileWatcher();
        },
        async selectLocalPath() {
            let info = await dialog.showOpenDialog({
                properties: ["openDirectory"],
                defaultPath: this.paths.local,
            });

            let path = info.filePaths[0];

            if (path == undefined) return;

            this.$emit("updatePaths", path, "local");
            this.closeFileWatcher();
        },
        filterFiles(files, filterDotFilesOut) {
            return files.filter((file) => {
                if (filterDotFilesOut == false) return true;
                return file.name[0] != "."; // Return true if filename doesn't start with "."
            });
        },
        watchFileStartStop(value, file) {
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
            this.fileWatcher = chokidar.watch(path);

            let uploadFile = async (path) => {
                console.log(path, this.paths.local);
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
            if (this.fileWatcher == null) return;

            console.log("closing file watcher");

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
            try {
                await shell.openPath(this.paths.local);
            } catch (error) {
                console.error(error);
                alert("Error while opening current folder");
            }
        },
        async openCurrentDirectoryInEditor() {
            let editor = this.settings.editorPath;
            let folder = this.paths.local;

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
.filesSplitView {
    display: flex;
    gap: var(--flex-gap);
    height: 100%;

    .splitView {
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
}
</style>
