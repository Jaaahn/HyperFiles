<template>
    <div id="profiles">
        <div id="selectProfile">
            <h4>Select Profile</h4>
            <hy-button v-for="(tab, i) in tabs" :type="currentTabId == i ? 'primary' : 'secondary'" @click="currentTabId = i" :key="tab.id">{{ tab.name }}</hy-button>

            <hy-button @click="createNewProfile()" style="margin-top: 50px"> <i class="icon-plus"></i> Create new Profile </hy-button>
            <hy-button @click="$router.push('/')">Back to Home </hy-button>
        </div>

        <div id="profileEditor">
            <edit-profile v-model="tabs[currentTabId]" @delete="deleteCurrentProfile()" />
        </div>
    </div>
</template>

<script>
import EditProfile from "../components/EditProfile.vue";
import { tabs } from "../state.js";
import generateId from "../utils/generateId.js";

export default {
    name: "Profiles",
    data() {
        return {
            tabs,
            currentTabId: 0,
        };
    },
    methods: {
        createNewProfile() {
            this.tabs.push({
                id: generateId(),
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

            this.currentTabId = this.tabs.length - 1;
        },
        deleteCurrentProfile() {
            this.tabs.splice(this.currentTabId, 1);
            this.currentTabId = 0;
        },
    },
    components: {
        EditProfile,
    },
};
</script>

<style lang="scss" scoped>
#profiles {
    display: flex;
    gap: 30px;

    #selectProfile {
        max-width: 300px;
        background-color: white;
        padding: 20px;

        h4 {
            margin-top: 0;
        }
    }

    #profileEditor {
        flex: 1;

        #editProfile {
            position: relative;
            left: 50%;
            transform: translateX(-50%);
            max-width: min(95%, 800px);
        }
    }
}
</style>
