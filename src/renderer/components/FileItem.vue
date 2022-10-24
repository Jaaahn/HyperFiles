<template>
    <div class="fileItem" :class="{ renamingActive: renaming.active, moreOptionsActive: moreOptions, isFolder: file.type == 'd', hovering }" @mouseover="hovering = true" @mouseleave="hovering = false">
        <div class="icons">
            <div id="loader" v-if="isLoadingAnyAction">
                <hy-loader :class="fileType" :width="25" :height="25" :line="3"></hy-loader>
            </div>

            <i class="icon-file" v-else-if="file.type == '-'" title="This item is a file"></i>
            <i class="icon-folder" v-else-if="file.type == 'd'" title="This item is directory. Double click to open"></i>
            <i class="icon-link" v-else-if="file.type == 'l'" title="This item is a link"></i>
        </div>

        <div class="info">
            <p class="name" :title="file.name">{{ file.name }}</p>

            <p class="details">
                <span><i class="icon-clock"></i> {{ timeDisplay }}</span>
                <span><i class="icon-weight"></i> {{ sizeDisplay }}</span>
            </p>
        </div>

        <div v-if="watchingFile" id="watchingFileIndicator"></div>

        <div class="actions" v-if="hovering || renaming.active || moreOptions">
            <hy-button v-if="type == 'local'" @click="upload()" :loading="loading.transfer" type="transparent" title="Upload file (override any remote files with same name)"><i class="icon-upload"></i></hy-button>
            <hy-button v-if="type == 'remote'" @click="download()" :loading="loading.transfer" type="transparent" title="Download file (override any local files with same name)"><i class="icon-download"></i></hy-button>

            <hy-button @click="deleteObject()" :loading="loading.delete" type="transparent" title="Delete file"><i class="icon-trash"></i></hy-button>

            <hy-popover v-model="renaming.active">
                <template #element>
                    <hy-button @click="renaming.active = !renaming.active" type="transparent" title="Open rename dialogue"><i class="icon-pen"></i></hy-button>
                </template>

                <template #popover>
                    <h3>Rename file</h3>

                    <hy-input v-model="renaming.newVal" placeholder="file name" />

                    <hy-flex-container>
                        <hy-button @click="rename()" :disabled="renaming.newVal == '' || renaming.newVal == file.name" :loading="loading.rename" type="primary" title="Save changes" class="undoTextLeft"><i class="icon-check"></i></hy-button>
                        <hy-button @click="resetRename()" title="Cancel and discard changes" class="undoTextLeft"><i class="icon-cross" style="color: var(--color-pink)"></i></hy-button>
                    </hy-flex-container>
                </template>
            </hy-popover>

            <hy-popover v-model="moreOptions" minWidth="310px" v-if="type == 'local'">
                <template #element>
                    <hy-button @click="moreOptions = !moreOptions" type="transparent" title="View more options"><i class="icon-ellipsis-circle"></i></hy-button>
                </template>

                <template #popover>
                    <h3>More options</h3>

                    <hy-button @click="openFile()"><i class="icon-arrow-up-right-from-square"></i> Open in default app</hy-button>

                    <hy-button @click="$emit('watchFile', true)" v-if="watchingFile == false"><i class="icon-history"></i> Upload on change</hy-button>
                    <hy-button @click="$emit('watchFile', false)" v-else><i class="icon-history"></i> Stop upload on change</hy-button>

                    <hy-button @click="uploadFolderContent()" v-if="isDir == true"><i class="icon-upload"></i> Upload content</hy-button>
                </template>
            </hy-popover>
        </div>
    </div>
</template>

<script>
let fsp = require("fs/promises");
let shell = require("electron").shell;
let pathModule = require("path");
import { timeDifferenceString } from "@jaaahn/shared-utils";
import filesize from "filesize";

export default {
    name: "FileItem",
    emits: ["fetchRemote", "fetchLocal", "watchFile"],
    props: {
        type: String,
        file: Object,
        client: Object,
        paths: Object,
        watchingFile: Boolean,
    },
    data() {
        return {
            hovering: false,
            renaming: {
                active: false,
                newVal: this.file.name,
            },
            moreOptions: false,
            loading: {
                transfer: false,
                delete: false,
                rename: false,
            },
        };
    },
    watch: {
        file: {
            handler() {
                this.renaming.newVal = this.file.name;
            },
            deep: true,
        },
    },
    computed: {
        isDir() {
            return this.file.type == "d";
        },
        isFile() {
            return this.file.type == "-";
        },
        isLink() {
            return this.file.type == "l";
        },
        fileType() {
            if (this.isDir) return "folder";
            if (this.isFile) return "file";
            if (this.isLink) return "link";
        },
        timeDisplay() {
            return timeDifferenceString(new Date(this.file.modifyTime));
        },
        sizeDisplay() {
            return filesize(this.file.size, { standard: "jedec", round: 1 });
        },
        isLoadingAnyAction() {
            if (this.loading.transfer) return true;
            if (this.loading.delete) return true;
            if (this.loading.rename) return true;
            return false;
        },
    },
    methods: {
        // Filter regex (only matches non-Dotfiles): /^(?!\.).*/gm
        async upload() {
            this.loading.transfer = true;

            // Remote path must include a valid filename (like the folder name if uploading an entire directory)
            // If I want to upload a "test" directory, file path must be "/my/current/path/test/"
            let remoteFilePath = pathModule.join(this.paths.remote, this.file.name);

            try {
                if (this.isFile) await this.client.fastPut(this.file.path, remoteFilePath);
                else if (this.isDir) await this.client.uploadDir(this.file.path, remoteFilePath);

                this.$emit("fetchRemote");
            } catch (error) {
                console.error(error);
                alert("Error while uploading");
            }

            this.loading.transfer = false;
        },
        async uploadFolderContent() {
            if (this.isDir == false) return;

            this.loading.transfer = true;

            // Will put the content of the local directory to the selected path
            // We on purpose omit the local directories name, so that sftp will put the contents just in the selected remote path
            let remoteFilePath = pathModule.join(this.paths.remote);

            try {
                await this.client.uploadDir(this.file.path, remoteFilePath);

                this.$emit("fetchRemote");
            } catch (error) {
                console.error(error);
                alert("Error while uploading");
            }

            this.loading.transfer = false;
        },
        async download() {
            this.loading.transfer = true;

            // Local path must include a valid filename
            let localFilePath = pathModule.join(this.paths.local, this.file.name);

            try {
                if (this.isFile) await this.client.fastGet(this.file.path, localFilePath);
                else if (this.isDir) await this.client.downloadDir(this.file.path, localFilePath);
                this.$emit("fetchLocal");
            } catch (error) {
                console.error(error);
                alert("Error while downloading");
            }

            this.loading.transfer = false;
        },
        async deleteObject() {
            if (!confirm(this.type == "remote" ? `Shure to delete "${this.file.name}" from remote? This action is irreversible!` : `Shure to move local file "${this.file.name}" to trash?`)) return;
            this.loading.delete = true;

            try {
                if (this.type == "remote") {
                    if (this.isFile) await this.client.delete(this.file.path);
                    else if (this.isDir) await this.client.rmdir(this.file.path, true);

                    this.$emit("fetchRemote");
                } else {
                    await shell.trashItem(this.file.path);
                    this.$emit("fetchLocal");
                }
            } catch (error) {
                console.error(error);
                alert("Error while deleting file");
            }

            this.loading.delete = false;
        },
        async rename() {
            this.loading.rename = true;

            let newFilePath = pathModule.join(pathModule.dirname(this.file.path), this.renaming.newVal);

            try {
                if (this.type == "remote") {
                    await this.client.rename(this.file.path, newFilePath);
                    this.$emit("fetchRemote");
                } else {
                    await fsp.rename(this.file.path, newFilePath);
                    this.$emit("fetchLocal");
                }
            } catch (error) {
                console.error(error);
                alert("Error while deleting file");
            }

            this.loading.rename = false;
        },
        async openFile() {
            if (this.type != "local") return;

            try {
                await shell.openPath(this.file.path);
            } catch (error) {
                console.error(error);
                alert("Error while opening file");
            }
        },
        resetRename() {
            this.renaming.active = false;
            this.renaming.newVal = this.file.name;
        },
    },
};
</script>

<style lang="scss" scoped>
.fileItem {
    padding: 5px;
    border-radius: var(--element-border-radius);
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    min-height: 57px;

    &.hovering,
    &.renamingActive,
    &.moreOptionsActive {
        background-color: var(--color-gray-3);
    }

    &.isFolder {
        cursor: pointer;
    }

    .icons {
        #loader {
            padding-left: 10px;

            .hyper-loader {
                &.file {
                    border-top-color: var(--accent-color) !important;
                }

                &.folder {
                    border-top-color: var(--color-pink) !important;
                }

                /* &.link {
                    border-top-color: var(--color-yellow) !important;
                } */
            }
        }

        i {
            font-size: 25px;
            padding-left: 10px;
            min-width: max-content;

            &.icon-file {
                color: var(--accent-color);
            }

            &.icon-folder {
                color: var(--color-pink);
            }

            /* &.icon-link {
                color: var(--color-yellow);
            } */
        }
    }

    .info {
        flex: 1;
        margin-right: auto;
        min-width: 0px;

        .name {
            margin: 0;

            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            width: 100%;
        }

        .details {
            margin: 0;
            width: 100%;
            color: gray;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;

            span {
                font-size: 15px;
                margin-right: 15px;
            }
        }
    }

    #watchingFileIndicator {
        width: 10px;
        height: 10px;
        background-color: var(--color-pink);
        border-radius: 100px;
        animation: watchingFileIndicator 1s linear infinite alternate;
    }

    .actions {
        display: flex;
        overflow-x: hidden;
        gap: 5px;

        & > .hyper-button,
        .hyper-popover {
            margin: 0;

            &:deep(button),
            &:deep(input) {
                padding: 10px;
            }
        }

        // Popover is buggy if clicked on other file
        .hyper-popover :deep(#menu) {
            transition: none;
        }
    }
}
</style>

<style lang="scss">
@keyframes watchingFileIndicator {
    from {
        opacity: 1;
        transform: scale(1.2);
    }

    to {
        opacity: 0.5;
        transform: scale(1);
    }
}
</style>
