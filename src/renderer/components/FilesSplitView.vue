<template>
    <div class="filesSplitView">
        <div id="left" class="splitView">
            <hy-flex-container class="header">
                <h3>Local</h3>
                <p>{{ tabInfo.local.path }}</p>

                <hy-button @click="selectLocalPath()" :extend="false" type="transparent">
                    <i class="icon-target"></i>
                </hy-button>
                <hy-button @click="openNewDirDialogue('local')" :extend="false" type="transparent">
                    <i class="icon-folder-plus"></i>
                </hy-button>
            </hy-flex-container>

            <div class="files">
                <FileItem class="file" v-for="file in localFiles" :file="file" :client="client" :tabInfo="tabInfo" type="local" :key="file" @fetchRemote="$emit('fetchRemote')" @fetchLocal="$emit('fetchLocal')" />
            </div>
        </div>
        <div id="right" class="splitView">
            <hy-flex-container class="header">
                <h3>Remote</h3>
                <p>{{ tabInfo.remote.path }}</p>

                <hy-button @click="openNewDirDialogue('remote')" :extend="false" type="transparent">
                    <i class="icon-folder-plus"></i>
                </hy-button>
            </hy-flex-container>

            <div class="files">
                <FileItem class="file" v-for="file in remoteFiles" :file="file" :client="client" :tabInfo="tabInfo" type="remote" :key="file" @fetchRemote="$emit('fetchRemote')" @fetchLocal="$emit('fetchLocal')" />
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

let fsp = require("fs/promises");
let pathModule = require("path");

export default {
    name: "FilesSplitView",
    emits: ["fetchRemote", "fetchLocal"],
    props: {
        remoteFiles: Array,
        localFiles: Array,
        client: Object,
        tabInfo: Object,
    },
    data() {
        return {
            newDir: {
                open: false,
                name: "",
                type: "",
                loading: false,
            },
        };
    },
    methods: {
        async createNewDir() {
            this.newDir.loading = true;
            let newDirPath = pathModule.join(this.tabInfo[this.newDir.type].path, this.newDir.name);

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
                alert("Error while deleting file");
            }

            this.newDir.loading = false;
        },
        openNewDirDialogue(type) {
            this.newDir.type = type;
            this.newDir.name = "";
            this.newDir.open = true;
        },
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

        // So that .files expands exactly to the height of this view
        display: flex;
        flex-direction: column;
        gap: var(--flex-gap);

        .header {
            margin: 0;

            h3 {
                margin: 0;
                flex: 0;
            }

            p {
                flex: 2;
                color: gray;
                font-size: 15px;
                font-family: monospace;
            }
        }

        .files {
            overflow-y: scroll;
            display: flex;
            flex-direction: column;
            gap: var(--flex-gap);
            height: auto;
        }
    }
}
</style>
