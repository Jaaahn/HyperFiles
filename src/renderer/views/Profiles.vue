<template>
    <hy-main id="profiles">
        <h1>Launch new connection from favorites</h1>

        <hy-section class="profile" v-for="tab in tabs" @dblclick.native="$router.push(`/ftp/${tab.id}`)" :key="tab.id">
            <hy-flex-container>
                <div class="name">
                    <h3>{{ tab.name }}</h3>
                    <p>{{ tab.remote.host }} at {{ tab.remote.port }}</p>
                </div>

                <hy-button type="transparent" :extend="false" @click="editProfile(tab.id)"> <i class="icon-pen"></i> </hy-button>
                <hy-button type="transparent" :extend="false" @click="deleteProfile(tab.id)"> <i class="icon-trash"></i> </hy-button>
                <hy-button type="secondary" :extend="false" @click="$router.push(`/ftp/${tab.id}`)" id="openBtn"> <i class="icon-chevron-down"></i> </hy-button>
            </hy-flex-container>
        </hy-section>

        <hy-button @click="createNewProfile()" id="newBtn" type="primary">Create new profile <i class="icon-plus"></i> </hy-button>
    </hy-main>

    <Modal :open="editing.open" @close="editing.open = false">
        <edit-profile v-if="editing.profile" :profileData="editing.profile" />
    </Modal>
</template>

<script>
import EditProfile from "../components/EditProfile.vue";
import Modal from "../components/Modal.vue";

import { tabs } from "../state.js";
import generateId from "../utils/generateId.js";

export default {
    name: "Profiles",
    data() {
        return {
            editing: {
                open: false,
                profile: null,
            },
            tabs,
        };
    },
    methods: {
        createNewProfile() {
            let id = generateId();

            this.tabs.push({
                id,
                name: "New profile",
                remote: {
                    path: "/",
                    host: "",
                    port: "22",
                    username: "root",
                    privateKeyPath: "",
                    password: "",
                },
                local: {
                    path: "/",
                },
            });

            this.editProfile(id);
        },
        editProfile(profileId) {
            this.editing.profile = this.tabs.find((tab) => tab.id == profileId);
            this.editing.open = true;
        },
        deleteProfile(profileId) {
            this.editing.profile = false;
            let profile = this.tabs.find((tab) => tab.id == profileId);

            let index = this.tabs.indexOf(profile);
            this.tabs.splice(index, 1);
        },
    },
    components: {
        EditProfile,
        Modal,
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
