<template>
    <div class="fileItem" :class="{ renamingActive: renaming.active, isFolder: file.type == 'd' }">
        <div class="icons">
            <i class="icon-file" v-if="file.type == '-'" title="This item is a file"></i>
            <i class="icon-folder" v-if="file.type == 'd'" title="This item is directory. Double click to open"></i>
            <i class="icon-forward" v-if="file.type == 'l'" title="This item is a link"></i>
        </div>

        <div class="info">
            <p class="name" v-if="!renaming.active" :title="file.name">{{ file.name }}</p>
            <hy-input v-model="renaming.newVal" v-else />

            <p class="details"><i class="icon-clock"></i> {{ new Date(file.modifyTime).toLocaleString() }}</p>
        </div>

        <div v-if="renaming.active == false" class="actions">
            <hy-button v-if="type == 'local'" @click="upload()" :loading="loading.transfer" type="transparent"><i class="icon-upload"></i></hy-button>
            <hy-button v-if="type == 'remote'" @click="download()" :loading="loading.transfer" type="transparent"><i class="icon-download"></i></hy-button>

            <hy-button @click="deleteObject()" :loading="loading.delete" type="transparent"><i class="icon-trash"></i></hy-button>

            <hy-button @click="renaming.active = true" type="transparent"><i class="icon-pen"></i></hy-button>
        </div>
        <div v-else class="actions">
            <hy-button @click="rename()" :loading="loading.rename" type="transparent"><i class="icon-check"></i></hy-button>
            <hy-button @click="resetRename()" type="transparent"><i class="icon-cross"></i></hy-button>
        </div>
    </div>
</template>

<script>
let fsp = require("fs/promises");
let pathModule = require("path");

export default {
    name: "FileItem",
    emits: ["fetchRemote", "fetchLocal"],
    props: {
        type: String,
        file: Object,
        client: Object,
        paths: Object,
    },
    data() {
        return {
            renaming: {
                active: false,
                newVal: this.file.name,
            },
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
    },
    methods: {
        async upload() {
            this.loading.transfer = true;

            // Remote path must include a valid filename
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
            if (!confirm(`Shure to delete '${this.file.name}' from ${this.type}?`)) return;
            this.loading.delete = true;

            try {
                if (this.type == "remote") {
                    if (this.isFile) await this.client.delete(this.file.path);
                    else if (this.isDir) await this.client.rmdir(this.file.path, true);

                    this.$emit("fetchRemote");
                } else {
                    await fsp.rm(this.file.path, {
                        recursive: true,
                    });
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

    &:hover,
    &.renamingActive {
        background-color: var(--color-gray-3);

        .actions .hyper-button {
            opacity: 1;
        }
    }

    &.isFolder {
        cursor: pointer;
    }

    .icons i {
        font-size: 25px;
        padding-left: 10px;

        &.icon-file {
            color: var(--accent-color);
        }

        &.icon-folder {
            color: var(--color-pink);
        }

        &.icon-forward {
            color: var(--color-yellow);
        }
    }

    .info {
        flex: 1;
        max-width: 67%;
        margin-right: auto;

        .name {
            margin: 0;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }

        .hyper-input {
            margin: 5px 0;

            &:deep(input) {
                padding: 5px;
            }
        }

        .details {
            margin: 0;
            font-size: 15px;
            color: gray;
        }
    }

    .actions {
        display: flex;
        gap: 5px;

        .hyper-button {
            opacity: 0;
            margin: 0;

            &:deep(button) {
                padding: 10px;
            }
        }
    }
}
</style>
