<template>
    <hy-main id="home">
        <hy-select v-model="selectedTab">
            <option value="">Please choose</option>

            <option v-for="tab in tabs" :value="tab.id" :key="tab.id">{{ tab.name }}</option>
        </hy-select>

        <hy-section v-if="currentTabInfo">
            <h3>{{ currentTabInfo.name }}</h3>
            <p>Remote Path: {{ currentTabInfo.remote?.path }}</p>
            <p>Local Path: {{ currentTabInfo.local?.path }}</p>

            <FilesSplitView :remoteFiles="remoteFiles" :localFiles="localFiles" :client="currentClient" :tabInfo="currentTabInfo" @fetchRemote="getRemoteFiles()" @fetchLocal="getLocalFiles()" />
        </hy-section>
    </hy-main>
</template>

<script>
let remote = require("@electron/remote");
let sftpClient = require("ssh2-sftp-client");
let fs = require("fs");
let fsp = require("fs/promises");
let pathModule = require("path");

import { tabs } from "../state.js";

import FilesSplitView from "../components/FilesSplitView.vue";

export default {
    name: "Home",
    data() {
        return {
            selectedTab: "",
            currentClient: null,
            remoteFiles: [],
            localFiles: [],
            tabs,
        };
    },
    computed: {
        currentTabInfo() {
            let tab = this.tabs.find((tab) => tab.id == this.selectedTab);
            console.log("Current tab info", tab);
            return tab;
        },
    },
    watch: {
        currentTabInfo: {
            async handler() {
                // Close previous connect
                if (this.currentClient) {
                    await this.currentClient.end();
                }

                // Connect to new host
                this.currentClient = new sftpClient();

                await this.currentClient.connect({
                    host: this.currentTabInfo.remote.host,
                    username: this.currentTabInfo.remote.username,
                    port: this.currentTabInfo.remote.port,
                    privateKey: fs.readFileSync(this.currentTabInfo.remote.privateKeyPath),
                });

                // List files
                this.getRemoteFiles();
                this.getLocalFiles();
            },
            deep: true,
        },
    },
    methods: {
        async getRemoteFiles() {
            console.log("Fetching remote files for:", this.currentTabInfo);
            let dirPath = this.currentTabInfo.remote.path;

            let files = await this.currentClient.list(dirPath);

            this.remoteFiles = files.map((file) => {
                return {
                    ...file,
                    path: pathModule.join(dirPath, file.name),
                };
            });
        },
        async getLocalFiles() {
            console.log("Fetching local files for:", this.currentTabInfo);
            let dirPath = this.currentTabInfo.local.path;

            let fileNames = await fsp.readdir(dirPath);

            // Format local files to adapt remote file syntax
            this.localFiles = fileNames.map((fileName) => {
                let stats = fs.statSync(pathModule.join(dirPath, fileName));

                let type;
                if (stats.isFile()) {
                    type = "-";
                } else if (stats.isDirectory()) {
                    type = "d";
                } else if (stats.isSymbolicLink()) {
                    type = "l";
                }

                return {
                    name: fileName,
                    size: stats.size,
                    modifyTime: stats.mtimeMs,
                    accessTime: stats.atimeMs,
                    type,
                    path: pathModule.join(dirPath, fileName),
                };
            });
        },
    },
    components: {
        FilesSplitView,
    },
};
</script>

<style lang="scss" scoped>
#home {
}
</style>
