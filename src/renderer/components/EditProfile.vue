<template>
    <div id="editProfile">
        <h1 v-if="isNewProfile">Create new profile</h1>
        <h1 v-else>Edit profile {{ internalValue.name }}</h1>

        <p class="label">Name of profile</p>
        <hy-input v-model="internalValue.name" placeholder="Name of profile" />

        <h2>Local</h2>
        <p class="label">Local starting path</p>
        <hy-input v-model="internalValue.local.path" placeholder="Local starting path" />

        <h2>Remote</h2>
        <p class="label">Remote starting path</p>
        <hy-input v-model="internalValue.remote.path" placeholder="Remote starting path" />

        <p class="label">Remote host</p>
        <hy-input v-model="internalValue.remote.host" placeholder="Remote host name" />

        <p class="label">Remote port</p>
        <hy-input v-model="internalValue.remote.port" placeholder="Remote port" />

        <p class="label">Remote username</p>
        <hy-input v-model="internalValue.remote.username" placeholder="Remote username" />

        <p class="label">Remote private key path</p>
        <hy-input v-model="internalValue.remote.privateKeyPath" placeholder="Remote private key path" />

        <p class="label">Or: password for remote</p>
        <hy-input v-model="internalValue.remote.password" placeholder="Remote password" />

        <h2>Save</h2>
        <hy-button @click="submit()" :disabled="!canSubmit" type="primary">Save <i class="icon-save"></i></hy-button>
        <hy-button @click="$emit('delete')">Delete <i class="icon-trash"></i></hy-button>
    </div>
</template>

<script>
export default {
    name: "EditProfile",
    props: {
        isNewProfile: Boolean,
        modelValue: Object,
    },
    data() {
        return {
            internalValue: this.modelValue,
        };
    },
    watch: {
        modelValue: {
            handler() {
                this.internalValue = this.modelValue;
            },
            deep: true,
        },
    },
    computed: {
        canSubmit() {
            if (this.internalValue.name == "") return false;
            if (this.internalValue.local.path == "") return false;
            if (this.internalValue.remote.path == "") return false;
            if (this.internalValue.remote.host == "") return false;
            if (this.internalValue.remote.port == "") return false;
            if (this.internalValue.remote.username == "") return false;

            // TODO: Password auth
            if (this.internalValue.remote.privateKeyPath == "" && this.internalValue.remote.password == "") return false;

            return true;
        },
    },
    methods: {
        submit() {
            this.$emit("update:modelValue", this.internalValue);
        },
    },
};
</script>

<style lang="scss" scoped>
#editProfile {
}
</style>
