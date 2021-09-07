<template>
    <div class="fileItem">
        <i class="icon-file icon" v-if="file.type == '-'"></i>
        <i class="icon-clock icon" v-if="file.type == 'd'"></i>
        <i class="icon-camera icon" v-if="file.type == 'l'"></i>

        <div class="info">
            <p class="name">{{ file.name }}</p>
            <p class="details"><i class="icon-pen"></i> {{ new Date(file.modifyTime).toLocaleString() }}</p>
        </div>

        <hy-button v-if="type == 'local'" @click="upload()" type="transparent"><i class="icon-login"></i></hy-button>
        <hy-button v-if="type == 'remote'" @click="download()" type="transparent"><i class="icon-download"></i></hy-button>

        <hy-button @click="deleteFile()" type="transparent"><i class="icon-trash"></i></hy-button>

        <hy-button @click="renaming = true" type="transparent"><i class="icon-pen"></i></hy-button>
    </div>
</template>

<script>
let fs = require("fs");
let fsp = require("fs/promises");
let pathModule = require("path");

export default {
    name: "FileItem",
    props: {
        type: String,
        file: Object,
        client: Object,
        tabInfo: Object,
    },
    data() {
        return {
            renaming: true,
        };
    },
    methods: {
        async upload() {
            // Remote path must include a valid filename
            let remoteFilePath = pathModule.join(this.tabInfo.remote.path, this.file.name);

            try {
                await this.client.fastPut(this.file.path, remoteFilePath);
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
                await this.client.fastGet(this.file.path, localFilePath);
                this.$emit("fetchLocal");
            } catch (error) {
                console.error(error);
                alert("Error while downloading");
            }
        },
        async deleteFile() {
            if (!confirm(`Shure to delete '${this.file.name}' from ${this.type}?`)) return;

            try {
                if (this.type == "remote") {
                    await this.client.delete(this.file.path);
                    this.$emit("fetchRemote");
                } else {
                    await fsp.rm(this.file.path);
                    this.$emit("fetchLocal");
                }
            } catch (error) {
                console.error(error);
                alert("Error while deleting file");
            }
        },
        async rename() {},
    },
};
</script>

<style lang="scss" scoped>
.fileItem {
    padding: 5px;
    border-radius: var(--element-border-radius);
    display: flex;
    align-items: center;
    gap: 5px;

    &:hover {
        background-color: var(--color-gray-3);

        .hyper-button {
            opacity: 1;
        }
    }

    .icon {
        font-size: 30px;
        padding-right: 15px;
        padding-left: 10px;
        color: var(--accent-color);
    }

    .info {
        flex: 1;

        .name {
            margin: 0;
        }

        .details {
            margin: 0;
            font-size: 15px;
            color: gray;
        }
    }

    .hyper-button {
        opacity: 0;
        margin: 0;
    }
}
</style>
