<template>
    <div id="editProfile">
        <h1>Edit profile "{{ profileData.name }}"</h1>

        <p class="label">Name of profile</p>
        <hy-input v-model="profileData.name" placeholder="Name of profile" />

        <h2>Local</h2>
        <p class="label">Local starting path</p>
        <hy-flex-container>
            <hy-input v-model="profileData.local.path" placeholder="Local starting path" />
            <hy-button @click="selectLocalPath()" :extend="false"> <i class="icon-target"></i> </hy-button>
        </hy-flex-container>

        <h2>Remote</h2>
        <p class="label">Remote starting path</p>
        <hy-input v-model="profileData.remote.path" placeholder="Remote starting path" />

        <p class="label">Remote host</p>
        <hy-input v-model="profileData.remote.host" placeholder="Remote host name" />

        <p class="label">Remote port</p>
        <hy-input v-model="profileData.remote.port" placeholder="Remote port" />

        <p class="label">Remote username</p>
        <hy-input v-model="profileData.remote.username" placeholder="Remote username" />

        <p class="label">Remote private key path</p>
        <hy-flex-container>
            <hy-input v-model="profileData.remote.privateKeyPath" placeholder="Remote private key path" />
            <hy-button @click="selectPrivateKeyPath()" :extend="false"> <i class="icon-target"></i> </hy-button>
        </hy-flex-container>

        <p class="label">Or: password for remote</p>
        <hy-input v-model="profileData.remote.password" placeholder="Remote password" />
    </div>
</template>

<script>
let pathModule = require("path");
const { dialog } = require("@electron/remote");

export default {
    name: "EditProfile",
    props: {
        profileData: Object,
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
    },
};
</script>

<style lang="scss" scoped>
#editProfile {
}
</style>
