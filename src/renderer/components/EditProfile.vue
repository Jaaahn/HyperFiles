<template>
    <div id="editProfile">
        <h1>Edit profile "{{ profileData.name }}"</h1>

        <hy-sub-section title="Profile name">
            <hy-input v-model="profileData.name" placeholder="Profile name" />
        </hy-sub-section>

        <h2>Local</h2>

        <hy-sub-section title="Local starting path">
            <hy-flex-container>
                <hy-input v-model="profileData.local.path" placeholder="Local starting path" />
                <hy-button @click="selectLocalPath()" :extend="false"> <i class="icon-target"></i> </hy-button>
            </hy-flex-container>
        </hy-sub-section>

        <h2>Remote</h2>

        <hy-sub-section title="Path system">
            <hy-select v-model="profileData.remote.pathSystem">
                <option value="posix">POSIX</option>
                <option value="win32">Windows</option>
            </hy-select>
        </hy-sub-section>

        <hy-sub-section title="Starting path">
            <hy-input v-model="profileData.remote.path" placeholder="Starting path" />
        </hy-sub-section>

        <hy-sub-section title="Hostname">
            <hy-input v-model="profileData.remote.host" placeholder="Hostname" />
        </hy-sub-section>

        <hy-sub-section title="Port">
            <hy-input v-model="profileData.remote.port" placeholder="Port" />
        </hy-sub-section>

        <hy-sub-section title="Username">
            <hy-input v-model="profileData.remote.username" placeholder="Username" />
        </hy-sub-section>

        <hy-sub-section title="Path to ssh private key" pre="Leave this empty, if you use passphrase authentication instead.">
            <hy-flex-container>
                <hy-input v-model="profileData.remote.privateKeyPath" placeholder="Path to private key (on local system)" />
                <hy-button @click="selectPrivateKeyPath()" :extend="false"> <i class="icon-target"></i> </hy-button>
            </hy-flex-container>
        </hy-sub-section>

        <hy-sub-section title="Passphrase" pre="Your password will be stored encrypted in your system's keychain.">
            <hy-input v-model="remotePassword" @blur.native="updateRemotePassword()" placeholder="Remote password" type="password" id="remotePassword" />
        </hy-sub-section>
    </div>
</template>

<script>
let pathModule = require("path");
let { dialog } = require("@electron/remote");
let keytar = require("keytar");

import getAccountInfoString from "../utils/getAccountInfoString.js";

export default {
    name: "EditProfile",
    props: {
        profileData: Object,
    },
    data() {
        return {
            remotePassword: "",
        };
    },
    methods: {
        async selectLocalPath() {
            let result = await dialog.showOpenDialog({
                defaultPath: this.profileData.local.path,
                properties: ["openDirectory"],
            });

            let path = result.filePaths[0];

            if (path) {
                this.profileData.local.path = path;
            }
        },
        async selectPrivateKeyPath() {
            let result = await dialog.showOpenDialog({
                defaultPath: pathModule.join(require("os").homedir(), ".ssh"),
                properties: ["openFile"],
            });

            let path = result.filePaths[0];

            if (path) {
                this.profileData.remote.privateKeyPath = path;
            }
        },
        async updateRemotePassword() {
            if (this.remotePassword == "") await keytar.deletePassword("de.janbahlinger.sftp-client", getAccountInfoString(this.profileData));
            else {
                await keytar.setPassword("de.janbahlinger.sftp-client", getAccountInfoString(this.profileData), this.remotePassword);
            }
        },
    },
    async created() {
        this.remotePassword = (await keytar.getPassword("de.janbahlinger.sftp-client", getAccountInfoString(this.profileData))) ?? "";
    },
};
</script>

<style lang="scss" scoped>
#editProfile {
    #remotePassword {
        margin-bottom: 0;
    }

    p.small {
        margin-top: 5px;
        color: gray;
        font-size: 18px;
    }
}
</style>
