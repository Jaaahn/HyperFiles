<template>
    <div id="editProfile">
        <h1>Edit profile "{{ profileData.name }}"</h1>

        <p class="label">Name of profile</p>
        <hy-input v-model="profileData.name" placeholder="Name of profile" />

        <h2>Local</h2>
        <p class="label">Starting path</p>
        <hy-flex-container>
            <hy-input v-model="profileData.local.path" placeholder="Local starting path" />
            <hy-button @click="selectLocalPath()" :extend="false"> <i class="icon-target"></i> </hy-button>
        </hy-flex-container>

        <h2>Remote</h2>
        <p class="label">Starting path</p>
        <hy-input v-model="profileData.remote.path" placeholder="Starting path" />

        <p class="label">Hostname</p>
        <hy-input v-model="profileData.remote.host" placeholder="Hostname" />

        <p class="label">Port</p>
        <hy-input v-model="profileData.remote.port" placeholder="Port" />

        <p class="label">Username</p>
        <hy-input v-model="profileData.remote.username" placeholder="Username" />

        <p class="label">Path to private key</p>
        <hy-flex-container>
            <hy-input v-model="profileData.remote.privateKeyPath" placeholder="Path to private key (on your local system)" />
            <hy-button @click="selectPrivateKeyPath()" :extend="false"> <i class="icon-target"></i> </hy-button>
        </hy-flex-container>

        <p class="label">Passphrase</p>
        <hy-input v-model="remotePassword" @blur.native="updateRemotePassword()" placeholder="Remote password" type="password" id="remotePassword" />
        <p class="small">Your password will be stored encrypted in your system's keychain.</p>
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

            this.profileData.local.path = result.filePaths[0];
        },
        async selectPrivateKeyPath() {
            let result = await dialog.showOpenDialog({
                defaultPath: pathModule.join(require("os").homedir(), ".ssh"),
                properties: ["openFile"],
            });

            this.profileData.remote.privateKeyPath = result.filePaths[0];
        },
        async updateRemotePassword() {
            if (this.remotePassword == "") await keytar.deletePassword("de.janbahlinger.sftp-client", getAccountInfoString(this.profileData));
            else {
                await keytar.setPassword("de.janbahlinger.sftp-client", getAccountInfoString(this.profileData), this.remotePassword);
            }
        },
    },
    async created() {
        this.remotePassword = await keytar.getPassword("de.janbahlinger.sftp-client", getAccountInfoString(this.profileData));
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
