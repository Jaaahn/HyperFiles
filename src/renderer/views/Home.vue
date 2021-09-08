<template>
    <Header v-model="selectedTab" :tabs="tabs" />

    <hy-main id="home" maxWidth="2000px">
        <FilesSplitView v-if="currentTabInfo" :remoteFiles="remoteFiles" :localFiles="localFiles" :client="currentClient" :tabInfo="currentTabInfo" :paths="paths" :loadingFiles="loadingFiles" @fetchRemote="getRemoteFiles()" @fetchLocal="getLocalFiles()" @updatePaths="updatePaths" />
    </hy-main>
</template>

<script>
let remote = require("@electron/remote");
let sftpClient = require("ssh2-sftp-client");
let fs = require("fs");
let fsp = require("fs/promises");
let pathModule = require("path");

import { tabs } from "../state.js";

import Header from "../components/Header.vue";
import FilesSplitView from "../components/FilesSplitView.vue";

export default {
    name: "Home",
    data() {
        return {
            selectedTab: "",
            currentClient: null,
            remoteFiles: [],
            localFiles: [],
            paths: {
                local: "",
                localIsInvalid: false,
                remote: "",
                remoteIsInvalid: false,
            },
            loadingFiles: {
                local: true,
                remote: true,
            },
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

                // Initialize default paths
                this.paths.remote = this.currentTabInfo.remote.path;
                this.paths.local = this.currentTabInfo.local.path;

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
            this.loadingFiles.remote = true;
            let dirPath = this.paths.remote;

            // Check if path exits
            if ((await this.currentClient.exists(dirPath)) != "d") {
                this.paths.remoteIsInvalid = true;
                this.loadingFiles.remote = false;
                return;
            }

            let files = await this.currentClient.list(dirPath);

            this.remoteFiles = files.map((file) => {
                return {
                    ...file,
                    path: pathModule.join(dirPath, file.name),
                };
            });

            this.paths.remoteIsInvalid = false;
            this.loadingFiles.remote = false;
        },
        async getLocalFiles() {
            console.log("Fetching local files for:", this.currentTabInfo);
            this.loadingFiles.local = true;
            let dirPath = this.paths.local;

            // Check if path exits
            let stats = fs.statSync(dirPath, { throwIfNoEntry: false });
            if (stats == undefined || stats.isDirectory() == false) {
                this.paths.localIsInvalid = true;
                this.loadingFiles.local = false;
                return;
            }

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

            this.paths.localIsInvalid = false;
            this.loadingFiles.local = false;
        },
        updatePaths(newPath, type) {
            this.paths[type] = pathModule.join(newPath.trim());

            if (type == "remote") {
                this.getRemoteFiles();
            } else {
                this.getLocalFiles();
            }
        },
    },
    components: {
        Header,
        FilesSplitView,
    },
};
</script>

<style lang="scss" scoped>
#home {
    width: min(2000px, 100%) !important;
    margin: 0;
    padding: 10px;
    height: calc(100vh - 80px);
    top: 80px;
    display: flex;
    flex-direction: column;
    position: relative;
}
</style>
