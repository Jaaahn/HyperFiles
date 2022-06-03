<template>
    <Header title="HyperFiles">
        <hy-button @click="$router.push('/settings')"> <i class="icon-settings"></i> Settings </hy-button>
    </Header>

    <hy-main id="home" maxWidth="1200px">
        <h2>Your Profiles</h2>

        <div v-if="sortedProfiles.length > 0" id="profiles">
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
        </div>

        <div v-else id="noProfiles">
            <p>No profiles available. Create one or <router-link to="/settings">import profiles</router-link>.</p>
        </div>

        <hy-button @click="createNewProfile()" id="newBtn" type="primary">Create new profile <i class="icon-plus"></i> </hy-button>
    </hy-main>

    <Modal :open="editing.open" @close="editing.open = false">
        <edit-profile v-if="editing.profile" :profileData="editing.profile" />
    </Modal>
</template>

<script>
import EditProfile from "../components/EditProfile.vue";
import Modal from "../components/Modal.vue";
import Header from "../components/Header.vue";

import { profiles, settings } from "../state.js";
import generateId from "../utils/generateId.js";
import getAccountInfoString from "../utils/getAccountInfoString.js";

import _ from "lodash";

let fsp = require("fs/promises");
let { dialog } = require("@electron/remote");
let keytar = require("keytar");

export default {
    name: "Home",
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
    },
    components: {
        EditProfile,
        Modal,
        Header,
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
#home {
    margin-top: 120px;

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

    #noProfiles {
        color: gray;
        padding-top: 50px;
        padding-bottom: 50px;

        p {
            text-align: center;
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
