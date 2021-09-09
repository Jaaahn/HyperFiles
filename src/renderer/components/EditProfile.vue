<template>
    <div id="editProfile">
        <h1>Edit profile "{{ profileData.name }}"</h1>

        <p class="label">Name of profile</p>
        <hy-input v-model="profileData.name" placeholder="Name of profile" />

        <h2>Local</h2>
        <p class="label">Local starting path</p>
        <hy-input v-model="profileData.local.path" placeholder="Local starting path" />

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
        <hy-input v-model="profileData.remote.privateKeyPath" placeholder="Remote private key path" />

        <p class="label">Or: password for remote</p>
        <hy-input v-model="profileData.remote.password" placeholder="Remote password" />
    </div>
</template>

<script>
export default {
    name: "EditProfile",
    props: {
        profileData: Object,
    },
};
</script>

<style lang="scss" scoped>
#editProfile {
}
</style>
