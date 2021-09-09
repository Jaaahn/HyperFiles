<template>
    <Header :tabs="tabs" :currentTabInfo="currentTabInfo" @reload="reloadFiles()" />

    <hy-main id="ftp" maxWidth="2000px">
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

import _ from "lodash";

export default {
    name: "FTP",
    data() {
        return {
            currentTabInfo: null,
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
    methods: {
        async getRemoteFiles() {
            try {
                console.log("Fetching remote files for:", this.currentTabInfo, this.paths.remote);
                this.loadingFiles.remote = true;
                let dirPath = this.paths.remote;

                // Check if path exits
                if ((await this.currentClient.exists(dirPath)) != "d") {
                    this.paths.remoteIsInvalid = true;
                    this.loadingFiles.remote = false;
                    return;
                }

                // Get files
                let files = await this.currentClient.list(dirPath);

                // Include file path in file info
                let formatedFiles = files.map((file) => {
                    return {
                        ...file,
                        path: pathModule.join(dirPath, file.name),
                    };
                });

                this.remoteFiles = _.sortBy(formatedFiles, ["name"]);

                this.paths.remoteIsInvalid = false;
            } catch (error) {
                console.error(error);
                this.paths.remoteIsInvalid = true;
            }

            this.loadingFiles.remote = false;
        },
        async getLocalFiles() {
            try {
                console.log("Fetching local files for:", this.currentTabInfo, this.paths.local);
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
                let formatedFiles = fileNames.map((fileName) => {
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

                this.localFiles = _.sortBy(formatedFiles, ["name"]);

                this.paths.localIsInvalid = false;
            } catch (error) {
                console.error(error);
                this.paths.localIsInvalid = true;
            }

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
        reloadFiles() {
            this.getRemoteFiles();
            this.getLocalFiles();
        },
    },
    async created() {
        // Get tab info
        this.currentTabInfo = this.tabs.find((tab) => tab.id == this.$route.params.profileId);
        console.log("Current tab info", this.currentTabInfo);

        // Initialize default paths
        this.paths.remote = this.currentTabInfo.remote.path;
        this.paths.local = this.currentTabInfo.local.path;

        try {
            // Connect to host
            this.currentClient = new sftpClient();

            let remoteConnectConfig = {
                host: this.currentTabInfo.remote.host,
                username: this.currentTabInfo.remote.username,
                port: this.currentTabInfo.remote.port,
                privateKey: null,
                password: this.currentTabInfo.remote.password,
            };

            // Use private key if path is present
            if (this.currentTabInfo.remote.privateKeyPath != "") {
                remoteConnectConfig.privateKey = fs.readFileSync(this.currentTabInfo.remote.privateKeyPath);
            }

            await this.currentClient.connect(remoteConnectConfig);
        } catch (error) {
            console.error(error);
            alert("Failed to connect to remote");
            return;
        }

        // List files
        this.getRemoteFiles();
        this.getLocalFiles();
    },
    components: {
        Header,
        FilesSplitView,
    },
};
</script>

<style lang="scss" scoped>
#ftp {
    width: min(2000px, 100%) !important;
    margin: 0;
    padding: 10px;
    height: calc(100vh - 60px);
    top: 60px;
    display: flex;
    flex-direction: column;
    position: relative;
}
</style>