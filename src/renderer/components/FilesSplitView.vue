<template>
    <div class="filesSplitView">
        <h3>Remote files</h3>
        <FileItem class="file" v-for="file in remoteFiles" :file="file" :client="client" :tabInfo="tabInfo" type="remote" :key="file" @fetchRemote="$emit('fetchRemote')" @fetchLocal="$emit('fetchLocal')" />

        <h3>Local files</h3>
        <FileItem class="file" v-for="file in localFiles" :file="file" :client="client" :tabInfo="tabInfo" type="local" :key="file" @fetchRemote="$emit('fetchRemote')" @fetchLocal="$emit('fetchLocal')" />
    </div>
</template>

<script>
import FileItem from "./FileItem.vue";

export default {
    name: "FilesSplitView",
    props: {
        remoteFiles: Array,
        localFiles: Array,
        client: Object,
        tabInfo: Object,
    },
    data() {
        return {};
    },
    components: {
        FileItem,
    },
};
</script>

<style lang="scss" scoped>
.filesSplitView {
    display: flex;
    flex-direction: column;
    gap: var(--flex-gap);
}
</style>
