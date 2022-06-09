<template>
    <div class="fileList">
        <div class="header">
            <h3>{{ _.capitalize(type) }}</h3>

            <hy-flex-container :allowBreak="false">
                <!-- Step back the folder structure -->
                <hy-button @click="openParentFolder()" :extend="false" :disabled="paths[type] == '/'" type="transparent">
                    <i class="icon-chevron-down"></i>
                </hy-button>

                <!-- Path -->
                <input :value="paths[type]" @keyup="updatePaths($event)" @focus="expandPathInput = true" @blur="expandPathInput = false" />

                <!-- Actions -->
                <hy-flex-container id="actions" v-if="expandPathInput == false" :wrap="false" :allowBreak="false">
                    <!-- Select path via finder -->
                    <hy-button v-if="type == 'local'" @click="selectPathWithFinder()" :extend="false" type="transparent">
                        <i class="icon-target"></i>
                    </hy-button>

                    <!-- Integrations / Open folder in... -->
                    <hy-popover v-if="type == 'local'" v-model="openDirectoryShown">
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

                            <hy-button @click="openCurrentDirectoryInEditor()" v-if="settings.editorPath != ''">
                                <i class="icon-arrow-up-right-from-square"></i>
                                Open in editor
                            </hy-button>
                        </template>
                    </hy-popover>

                    <!-- Search -->
                    <hy-popover v-model="search.dialogShown">
                        <template #element>
                            <hy-button @click="search.dialogShown = !search.dialogShown" :extend="false" type="transparent">
                                <i class="icon-search" title="Search files"></i>
                            </hy-button>
                        </template>
                        <template #popover>
                            <hy-flex-container>
                                <hy-input v-model="search.term" placeholder="Enter search term"></hy-input>
                                <hy-button
                                    @click="
                                        search.term = '';
                                        search.dialogShown = false;
                                    "
                                >
                                    <i class="icon-cross"></i>
                                </hy-button>
                            </hy-flex-container>
                        </template>
                    </hy-popover>

                    <!-- Show / hide Dotfiles -->
                    <hy-button @click="hideDotFiles = !hideDotFiles" :extend="false" type="transparent">
                        <i class="icon-eye-slash" v-if="hideDotFiles == true" title="Switch to displaying all files"></i>
                        <i class="icon-eye" v-if="hideDotFiles == false" title="Switch to hiding Dotfiles"></i>
                    </hy-button>

                    <!-- New directory -->
                    <hy-popover v-model="newDir.open">
                        <template #element>
                            <hy-button @click="this.newDir.open = !this.newDir.open" :extend="false" type="transparent">
                                <i class="icon-folder-plus"></i>
                            </hy-button>
                        </template>
                        <template #popover>
                            <h4>New directory in {{ type }}</h4>
                            <hy-input v-model="newDir.name" placeholder="Name of new directory" />
                            <hy-button @click="createNewDir()" :disabled="newDir.name == ''" :loading="newDir.loading" type="primary"> <i class="icon-plus"></i> </hy-button>
                        </template>
                    </hy-popover>
                </hy-flex-container>
            </hy-flex-container>
        </div>

        <div id="searchNotice" v-if="search.term.trim() != ''" @click="search.term = ''">
            <p>Searching for "{{ search.term.trim() }}"</p>
            <p><i class="icon-cross"></i></p>
        </div>

        <div class="files">
            <FileItem class="file" v-for="file in sortedFiles" :file="file" :client="client" :paths="paths" :type="type" :watchingFile="watchedFiles.includes(file.path)" :key="file" @fetchLocal="$emit('fetchLocal')" @fetchRemote="$emit('fetchRemote')" @watchFile="watchFileStartStop($event, file)" @dblclick.native="openFolder(file)" />
        </div>

        <div class="viewInfo" v-if="loadingFiles[type]">
            <hy-loader />
        </div>
        <div class="viewInfo" v-else-if="isPathInvalid">
            <h3>Invalid Path</h3>
        </div>
        <div class="viewInfo" v-else-if="filteredFiles.length == 0">
            <h3 v-if="this.search.term.trim() != ''">No search results</h3>
            <h3 v-else>Empty directory</h3>

            <p v-if="searchedFiles.length != 0">There are hidden Dotfiles</p>
        </div>
    </div>
</template>

<script>
import FileItem from "./FileItem.vue";

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
            search: {
                dialogShown: false,
                term: "",
            },
            expandPathInput: false,
            settings,
            _,
        };
    },
    computed: {
        // files -> searchedFiles -> filteredFiles -> sortedFiles => Will be displayed to the user
        sortedFiles() {
            let files = _.cloneDeep(this.filteredFiles);

            files.sort((a, b) => {
                let dataA;
                let dataB;

                if (this.settings.filters.sortBy == "filename") {
                    dataA = a.name.toLowerCase();
                    dataB = b.name.toLowerCase();
                } else if (this.settings.filters.sortBy == "size") {
                    dataA = a.size;
                    dataB = b.size;
                } else if (this.settings.filters.sortBy == "lastModified") {
                    dataA = a.modifyTime;
                    dataB = b.modifyTime;
                }

                let multiplier = this.settings.filters.sortDirection == "ascending" ? 1 : -1;

                if (dataA < dataB) return -1 * multiplier;
                if (dataA > dataB) return 1 * multiplier;
                return 0; // Equal
            });

            if (this.settings.filters.separateDirs) {
                files.sort((a, b) => {
                    if (a.type == "d" && b.type != "d") return -1;
                    if (a.type != "d" && b.type == "d") return 1;
                    return 0;
                });
            }

            return files;
        },
        filteredFiles() {
            // Check if file is a dotfile
            return this.searchedFiles.filter((file) => {
                if (this.hideDotFiles == false) return true; // Allow all files
                return file.name[0] != ".";
            });
        },
        searchedFiles() {
            return this.files.filter((file) => {
                // No search applied => Allow every item
                if (this.search.term.trim() == "") return true;

                // Check if filename includes search term => if yes, allow it
                return file.name.trim().toLowerCase().includes(this.search.term.trim().toLowerCase());
            });
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

        & > .hyper-flexcontainer {
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
                transition: var(--element-transition);
                transition-property: background-color;

                &:hover,
                &:active,
                &:focus {
                    background-color: var(--button-light-blue-hover);
                }
            }

            #actions {
                flex: 0;
            }

            .hyper-button :deep(button),
            .hyper-input :deep(input) {
                padding: 10px;
            }

            .hyper-popover {
                flex: 0;
            }
        }
    }

    #searchNotice {
        display: flex;
        justify-content: space-between;
        cursor: pointer;
        background-color: var(--color-gray-3);
        border-radius: var(--element-border-radius);
        padding: 10px;
        margin: 10px 0;

        p {
            color: gray;
            margin: 0;
            font-size: 16px;
            transition: var(--element-transition);
            transition-property: color;

            &:last-of-type:hover {
                color: var(--accent-color);
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
