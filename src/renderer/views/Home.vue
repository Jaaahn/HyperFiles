<template>
    <Header title="HyperFiles">
        <hy-button @click="$router.push('/settings')"> <i class="icon-settings"></i> Settings </hy-button>
    </Header>

    <hy-main id="home" maxWidth="1200px">
        <h2>Your Profiles</h2>

        <div v-if="sortedProfiles.length > 0" id="profiles">
            <transition-group tag="section" name="profiles" appear>
                <ProfileItem v-for="profile in sortedProfiles" :profile="profile" @editProfile="editProfile" :key="profile.id" />
            </transition-group>
        </div>

        <div v-else id="noProfiles">
            <p>No profiles available. Create one or <router-link to="/settings">import profiles</router-link>.</p>
        </div>

        <hy-button @click="openNewProfileModal()" id="newBtn" type="primary"> <i class="icon-plus"></i> Create new profile </hy-button>
    </hy-main>

    <hy-modal v-model="editing.open">
        <edit-profile v-if="editing.profile" :profileData="editing.profile" />
    </hy-modal>

    <hy-modal v-model="newProfile.open">
        <edit-profile v-if="newProfile.profile" :profileData="newProfile.profile" />
        <div id="addNewProfileBtnContainer">
            <hy-button @click="addNewProfile()" :disabled="canAddNewProfile == false" type="primary"> <i class="icon-plus"></i> Add new profile</hy-button>
        </div>
    </hy-modal>
</template>

<script>
import EditProfile from "../components/EditProfile.vue";
import Header from "../components/Header.vue";
import ProfileItem from "../components/ProfileItem.vue";

import { profiles, settings } from "../state.js";
import generateId from "../utils/generateId.js";
import getAccountInfoString from "../utils/getAccountInfoString.js";

import _ from "lodash";

let keytar = require("keytar");

export default {
    name: "Home",
    data() {
        return {
            editing: {
                open: false,
                profile: null,
            },
            newProfile: {
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
        canAddNewProfile() {
            let name = this.newProfile.profile?.name;

            if (name != "New profile" && name != "") return true;

            return false;
        },
    },
    methods: {
        openNewProfileModal() {
            let id = generateId();

            this.newProfile.profile = {
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
            };

            this.newProfile.open = true;
        },
        addNewProfile() {
            this.profiles.push(_.cloneDeep(this.newProfile.profile));
            this.newProfile.open = false;
        },
        editProfile(profileId) {
            this.editing.profile = this.profiles.find((profile) => profile.id == profileId);
            this.editing.open = true;
        },
    },
    components: {
        EditProfile,
        ProfileItem,
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

#addNewProfileBtnContainer {
    position: sticky;
    bottom: 0;
    background-color: var(--section-bg-color);
    padding-top: var(--element-padding);
    margin-top: 40px;
    margin-bottom: 0;
    box-shadow: 0 -10px 20px -5px var(--element-shadow-color);

    .hyper-button {
        margin: 0;
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
