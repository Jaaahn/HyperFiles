<template>
    <hy-main id="profiles">
        <h1>Launch new connection</h1>

        <transition-group tag="section" name="profiles" appear>
            <hy-section class="profile" v-for="profile in sortedProfiles" @dblclick.native="$router.push(`/ftp/${profile.id}`)" :key="profile.id">
                <hy-flex-container>
                    <div class="name">
                        <h3>{{ profile.name }}</h3>
                        <p>{{ profile.remote.host }} at {{ profile.remote.port }}</p>
                    </div>

                    <hy-button type="transparent" :extend="false" @click="editProfile(profile.id)"> <i class="icon-pen"></i> </hy-button>
                    <hy-button type="transparent" :extend="false" @click="deleteProfile(profile.id)"> <i class="icon-trash"></i> </hy-button>
                    <hy-button type="transparent" :extend="false" @click="cloneProfile(profile.id)"> <i class="icon-copy"></i> </hy-button>
                    <hy-button type="secondary" :extend="false" @click="$router.push(`/ftp/${profile.id}`)" id="openBtn"> Connect <i class="icon-chevron-down"></i> </hy-button>
                </hy-flex-container>
            </hy-section>
        </transition-group>

        <hy-button @click="createNewProfile()" id="newBtn" type="primary">Create new profile <i class="icon-plus"></i> </hy-button>

        <h1>Export and Import</h1>
        <hy-flex-container>
            <hy-button @click="exportConfig()" :disabled="profiles.length == 0"><i class="icon-share"></i> Export Config</hy-button>
            <hy-button @click="importConfig()"><i class="icon-import"></i> Import Config</hy-button>
        </hy-flex-container>

        <h1>Settings</h1>
        <hy-sub-section title="Edit app path" pre="Absolute path to your prefered editor">
            <hy-flex-container :allowBreak="false">
                <hy-input v-model="settings.editorPath" v-if="settings.editorPath != undefined" placeholder="Absolute path to your prefered editor"></hy-input>
                <hy-button @click="selectEditorPath()" :extend="false"> <i class="icon-target"></i> </hy-button>
            </hy-flex-container>
        </hy-sub-section>
    </hy-main>

    <Modal :open="editing.open" @close="editing.open = false">
        <edit-profile v-if="editing.profile" :profileData="editing.profile" />
    </Modal>
</template>

<script>
import EditProfile from "../components/EditProfile.vue";
import Modal from "../components/Modal.vue";

import { profiles, settings } from "../state.js";
import generateId from "../utils/generateId.js";
import getAccountInfoString from "../utils/getAccountInfoString.js";

import _ from "lodash";

let fsp = require("fs/promises");
let pathModule = require("path");
let { dialog } = require("@electron/remote");
let keytar = require("keytar");

export default {
    name: "Profiles",
    data() {
        return {
            editing: {
                open: false,
                profile: null,
            },
            profiles,
            settings,
        };
    },
    computed: {
        sortedProfiles() {
            // Sort by name (alphabetically => requires toLoweCase() hack) and by id if names are identical
            return _.sortBy(this.profiles, [(profile) => profile.name.toLowerCase(), "id"], ["asc"]);
        },
    },
    methods: {
        createNewProfile() {
            let id = generateId();

            this.profiles.push({
                id,
                name: "New profile",
                remote: {
                    path: "/",
                    host: "",
                    port: "22",
                    username: "",
                    privateKeyPath: "",
                },
                local: {
                    path: "/",
                },
            });

            this.editProfile(id);
        },
        cloneProfile(profileId) {
            let profile = this.profiles.find((profile) => profile.id == profileId);
            let profileClone = _.cloneDeep(profile);

            profileClone.id = generateId();
            profileClone.name += " clone";

            this.profiles.push(profileClone);
        },
        editProfile(profileId) {
            this.editing.profile = this.profiles.find((profile) => profile.id == profileId);
            this.editing.open = true;
        },
        deleteProfile(profileId) {
            this.editing.profile = false;
            let profile = this.profiles.find((profile) => profile.id == profileId);

            if (!confirm(`Shure to delete "${profile.name}"?`)) return;

            let index = this.profiles.indexOf(profile);
            this.profiles.splice(index, 1);
        },
        exportConfig() {
            let date = new Date().toLocaleString();
            let element = document.createElement("a");

            // Create element
            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(this.profiles, null, "    ")));
            element.setAttribute("download", "SFTP Config " + date + ".json");
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
        EditProfile,
        Modal,
    },
    async created() {
        // Migrate profiles
        for (let i = 0; i < this.profiles.length; i++) {
            let profile = this.profiles[i];

            // Remove unsafe password and store it in the system's keychain
            if (profile.remote.password && profile.remote.password != "") {
                await keytar.setPassword("de.janbahlinger.sftp-client", getAccountInfoString(profile), profile.remote.password);
            }
            delete this.profiles[i].remote.password;
        }
    },
};
</script>

<style lang="scss" scoped>
#profiles {
    .profile {
        cursor: pointer;

        .name {
            h3 {
                margin: 0;
            }

            p {
                margin: 0;
                color: gray;
            }
        }

        #openBtn {
            padding-left: 50px;

            .icon-chevron-down::before {
                transform: rotate(-90deg);
            }
        }
    }

    #newBtn {
        margin-top: 50px;
    }

    .hyper-subsection {
        background-color: var(--section-bg-color);
        padding: var(--section-padding);
    }
}

// Animate
.profiles-leave-to,
.profiles-enter-from {
    opacity: 0;
    transform: scale(0.6);
}

.profiles-leave-active {
    transition: all 0.3s ease-in-out;
    position: absolute;
    width: calc(100% - 50px);
}

.profiles-move {
    transition: all 0.3s ease-in-out;
}
</style>
