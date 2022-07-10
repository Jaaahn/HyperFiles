<template>
    <Header title="Settings" />

    <hy-main class="settings" maxWidth="1200px">
        <h2>Profiles</h2>
        <hy-section>
            <hy-flex-container>
                <hy-button @click="exportConfig()" :disabled="profiles.length == 0"><i class="icon-share"></i> Export profiles to file</hy-button>
                <hy-button @click="importConfig()" :type="profiles.length == 0 ? 'primary' : 'secondary'"><i class="icon-import"></i> Import profiles from file</hy-button>
            </hy-flex-container>

            <hy-button @click="clearConfig()" :disabled="profiles.length == 0" class="deleteBtn">Delete all profiles</hy-button>

            <p v-if="profilesTrash.length > 0" @click="restoreProfilesFromTrash()" class="hy-text-accent">Click here to restore deleted profiles</p>
        </hy-section>

        <h2>Integrations</h2>
        <hy-sub-section title="Editor" pre="Absolute path to your prefered editor">
            <hy-flex-container :allowBreak="false">
                <hy-input v-model="settings.editorPath" v-if="settings.editorPath != undefined" placeholder="Absolute path to your prefered editor"></hy-input>
                <hy-button @click="selectEditorPath()" :extend="false"> <i class="icon-target"></i> </hy-button>
            </hy-flex-container>
        </hy-sub-section>

        <h1>About</h1>
        <hy-sub-section>
            <router-link to="/licences">Open-Source Licences</router-link>
        </hy-sub-section>
    </hy-main>
</template>

<script>
import Header from "../components/Header.vue";

import { profiles, settings } from "../state.js";

import generateId from "../utils/generateId.js";

let fsp = require("fs/promises");
let { dialog } = require("@electron/remote");
import _ from "lodash";

export default {
    name: "Settings",
    data() {
        return {
            selectedTab: "profiles",
            profiles,
            settings,
            profilesTrash: [],
        };
    },
    methods: {
        exportConfig() {
            let element = document.createElement("a");

            // Create element
            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(this.profiles, null, "    ")));
            element.setAttribute("download", "HyperFiles-Config.json");
            element.style.display = "none";
            document.body.appendChild(element);

            // Download and remove element
            element.click();
            document.body.removeChild(element);
        },
        async importConfig() {
            try {
                let path = (
                    await dialog.showOpenDialog({
                        defaultPath: require("os").homedir(),
                        title: "This action will NOT override your current profiles",
                        message: "This action will NOT override your current profiles",
                        properties: ["openFile"],
                    })
                ).filePaths[0];

                if (path == "" || !path) return;

                let fileString = await fsp.readFile(path, "utf8");
                let fileObject = JSON.parse(fileString);

                fileObject.forEach((profile) => {
                    profile.id = generateId();
                    this.profiles.push(profile);
                });
            } catch (error) {
                console.error(error);
                alert("Error while reading config");
            }
        },
        clearConfig() {
            if (!confirm("Are you shure to delete ALL profiles?")) return;

            this.profilesTrash = _.cloneDeep(this.profiles);

            this.profiles.length = 0;

            console.log(this.profiles);
            console.log(this.profilesTrash);
        },
        restoreProfilesFromTrash() {
            this.profiles = _.cloneDeep(this.profilesTrash);
            this.profilesTrash.length = 0;
        },
        async selectEditorPath() {
            let result = await dialog.showOpenDialog({
                defaultPath: this.settings.editorPath,
                properties: ["openFile"],
            });

            let path = result.filePaths[0];

            if (path) {
                this.settings.editorPath = path;
            }
        },
    },
    components: {
        Header,
    },
};
</script>

<style lang="scss" scoped>
.settings {
    margin-top: 120px;

    .hyper-subsection {
        background-color: var(--section-bg-color);
        padding: var(--section-padding);
    }

    .deleteBtn :deep(button) {
        color: var(--color-pink);
    }
}
</style>
