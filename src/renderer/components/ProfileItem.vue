<template>
    <hy-section class="profileItem">
        <hy-flex-container>
            <div class="name extend-full">
                <h3>{{ profile.name }}</h3>
                <p>{{ profile.remote.host }} at {{ profile.remote.port }}</p>
            </div>

            <hy-popover v-model="options.open">
                <template #element>
                    <hy-button @click="options.open = !options.open" id="optionsBtn" type="transparent" title="Open rename dialogue"> <i class="icon-ellipsis-circle"></i> </hy-button>
                </template>

                <template #popover>
                    <h3>More options</h3>

                    <hy-button @click="editProfile()"> <i class="icon-pen"></i> Edit profile </hy-button>
                    <hy-button @click="cloneProfile()"> <i class="icon-copy"></i> Duplicate profile </hy-button>
                    <hy-button @click="deleteProfile()" id="deleteBtn"> <i class="icon-trash"></i> Delete profile </hy-button>
                </template>
            </hy-popover>

            <hy-button type="secondary" @click="$router.push(`/ftp/${profile.id}`)" id="openBtn"> Connect <i class="icon-chevron-down"></i> </hy-button>
        </hy-flex-container>
    </hy-section>
</template>

<script>
import generateId from "../utils/generateId.js";

import { profiles, settings } from "../state.js";

import _ from "lodash";

export default {
    name: "ProfileItem",
    props: {
        profile: Object,
    },
    data() {
        return {
            options: {
                open: false,
            },
            profiles,
            settings,
        };
    },
    methods: {
        editProfile() {
            this.$emit("editProfile", this.profile.id);
            this.options.open = false; // Hide Popover
        },
        cloneProfile() {
            let profile = this.profiles.find((profile) => profile.id == this.profile.id);
            let profileClone = _.cloneDeep(profile);

            profileClone.id = generateId();
            profileClone.name += " clone";

            this.profiles.push(profileClone);

            this.options.open = false; // Hide Popover of old profile
        },
        deleteProfile() {
            let profile = this.profiles.find((profile) => profile.id == this.profile.id);

            if (!confirm(`Shure to delete "${profile.name}"?`)) return;

            let index = this.profiles.indexOf(profile);
            this.profiles.splice(index, 1);
        },
    },
};
</script>

<style lang="scss" scoped>
.profileItem {
    .hyper-flexcontainer {
        gap: 20px;
    }

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
        .icon-chevron-down::before {
            transform: rotate(-90deg);
        }
    }

    #deleteBtn {
        :deep(button),
        i {
            color: var(--color-pink);
        }
    }
}
</style>
