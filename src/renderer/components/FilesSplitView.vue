<template>
    <div class="filesSplitView">
        <FileList type="local" :files="localFiles" :paths="paths" :profileInfo="profileInfo" :client="client" :loadingFiles="loadingFiles" @fetchLocal="$emit('fetchLocal')" @fetchRemote="$emit('fetchRemote')" @updatePaths="updatePaths" />

        <FileList type="remote" :files="remoteFiles" :paths="paths" :profileInfo="profileInfo" :client="client" :loadingFiles="loadingFiles" @fetchLocal="$emit('fetchLocal')" @fetchRemote="$emit('fetchRemote')" @updatePaths="updatePaths" />
    </div>
</template>

<script>
import FileList from "./FileList.vue";

export default {
    name: "FilesSplitView",
    emits: ["fetchRemote", "fetchLocal", "updatePaths"],
    props: {
        remoteFiles: Array,
        localFiles: Array,
        client: Object,
        profileInfo: Object,
        paths: Object,
        loadingFiles: Object,
    },
    data() {
        return {};
    },
    methods: {
        updatePaths(newPath, type) {
            this.$emit("updatePaths", newPath, type);
        },
    },

    components: {
        FileList,
    },
};
</script>

<style lang="scss" scoped>
.filesSplitView {
    display: flex;
    gap: var(--flex-gap);
    height: 100%;
}
</style>
