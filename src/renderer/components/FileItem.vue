<template>
    <div class="fileItem" :class="{ renamingActive: renaming.active }">
        <div class="icons">
            <i class="icon-file" v-if="file.type == '-'"></i>
            <i class="icon-folder" v-if="file.type == 'd'"></i>
            <i class="icon-forward" v-if="file.type == 'l'"></i>
        </div>

        <div class="info">
            <p class="name" v-if="!renaming.active">{{ file.name }}</p>
            <hy-input v-model="renaming.newVal" v-else />

            <p class="details"><i class="icon-clock"></i> {{ new Date(file.modifyTime).toLocaleString() }}</p>
        </div>

        <div v-if="renaming.active == false" class="actions">
            <hy-button v-if="type == 'local'" @click="upload()" type="transparent"><i class="icon-upload"></i></hy-button>
            <hy-button v-if="type == 'remote'" @click="download()" type="transparent"><i class="icon-download"></i></hy-button>

            <hy-button @click="deleteObject()" type="transparent"><i class="icon-trash"></i></hy-button>

            <hy-button @click="renaming.active = true" type="transparent"><i class="icon-pen"></i></hy-button>
        </div>
        <div v-else class="actions">
            <hy-button @click="rename()" type="light-green"><i class="icon-check"></i></hy-button>
            <hy-button @click="resetRename()" type="light-red"><i class="icon-cross"></i></hy-button>
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
        tabInfo: Object,
    },
    data() {
        return {
            renaming: {
                active: false,
                newVal: this.file.name,
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
            // Remote path must include a valid filename
            let remoteFilePath = pathModule.join(this.tabInfo.remote.path, this.file.name);

            try {
                if (this.isFile) await this.client.fastPut(this.file.path, remoteFilePath);
                else if (this.isDir) await this.client.uploadDir(this.file.path, remoteFilePath);

                this.$emit("fetchRemote");
            } catch (error) {
                console.error(error);
                alert("Error while uploading");
            }
        },
        async download() {
            // Local path must include a valid filename
            let localFilePath = pathModule.join(this.tabInfo.local.path, this.file.name);

            try {
                if (this.isFile) await this.client.fastGet(this.file.path, localFilePath);
                else if (this.isDir) await this.client.downloadDir(this.file.path, localFilePath);
                this.$emit("fetchLocal");
            } catch (error) {
                console.error(error);
                alert("Error while downloading");
            }
        },
        async deleteObject() {
            if (!confirm(`Shure to delete '${this.file.name}' from ${this.type}?`)) return;

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
        },
        async rename() {
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

    .icons i {
        font-size: 25px;
        padding-left: 10px;
        color: var(--accent-color);
    }

    .info {
        flex: 1;

        .name {
            margin: 0;
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
