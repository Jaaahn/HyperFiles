<template>
    <hy-main id="profiles">
        <h1>Launch new connection from favorites</h1>

        <hy-section class="profile" v-for="profile in profiles" @dblclick.native="$router.push(`/ftp/${profile.id}`)" :key="profile.id">
            <hy-flex-container>
                <div class="name">
                    <h3>{{ profile.name }}</h3>
                    <p>{{ profile.remote.host }} at {{ profile.remote.port }}</p>
                </div>

                <hy-button type="transparent" :extend="false" @click="editProfile(profile.id)"> <i class="icon-pen"></i> </hy-button>
                <hy-button type="transparent" :extend="false" @click="deleteProfile(profile.id)"> <i class="icon-trash"></i> </hy-button>
                <hy-button type="transparent" :extend="false" @click="cloneProfile(profile.id)"> <i class="icon-copy"></i> </hy-button>
                <hy-button type="secondary" :extend="false" @click="$router.push(`/ftp/${profile.id}`)" id="openBtn"> <i class="icon-chevron-down"></i> </hy-button>
            </hy-flex-container>
        </hy-section>

        <hy-button @click="createNewProfile()" id="newBtn" type="primary">Create new profile <i class="icon-plus"></i> </hy-button>

        <hy-flex-container>
            <hy-button @click="exportConfig()" :disabled="profiles.length == 0">Export Config</hy-button>
            <hy-button @click="importConfig()">Import Config</hy-button>
        </hy-flex-container>
    </hy-main>

    <Modal :open="editing.open" @close="editing.open = false">
        <edit-profile v-if="editing.profile" :profileData="editing.profile" />
    </Modal>
</template>

<script>
import EditProfile from "../components/EditProfile.vue";
import Modal from "../components/Modal.vue";

import { profiles } from "../state.js";
import generateId from "../utils/generateId.js";
import getAccountInfoString from "../utils/getAccountInfoString.js";

import _ from "lodash";

let fsp = require("fs/promises");
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
        };
    },
    computed: {
        sortedProfiles() {
            return _.sortBy(this.profiles, ["id"]);
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
}
</style>
