<template>
    <div class="filesSplitView">
        <div id="left" class="splitView">
            <div class="header">
                <h3>Local</h3>
            </div>

            <div class="files">
                <FileItem class="file" v-for="file in localFiles" :file="file" :client="client" :tabInfo="tabInfo" type="local" :key="file" @fetchRemote="$emit('fetchRemote')" @fetchLocal="$emit('fetchLocal')" />
            </div>
        </div>
        <div id="right" class="splitView">
            <div class="header">
                <h3>Remote</h3>
            </div>

            <div class="files">
                <FileItem class="file" v-for="file in remoteFiles" :file="file" :client="client" :tabInfo="tabInfo" type="remote" :key="file" @fetchRemote="$emit('fetchRemote')" @fetchLocal="$emit('fetchLocal')" />
            </div>
        </div>
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
    gap: var(--flex-gap);
    height: 100%;

    .splitView {
        flex: 1;
        background-color: var(--section-bg-color);
        border-radius: var(--section-border-radius);
        padding: var(--element-padding);

        // So that .files expands exactly to the height of this view
        display: flex;
        flex-direction: column;
        gap: var(--flex-gap);

        .header {
            padding-bottom: 10px;

            h3 {
                margin: 0;
            }
        }

        .files {
            overflow-y: scroll;
            display: flex;
            flex-direction: column;
            gap: var(--flex-gap);
            height: auto;
        }
    }
}
</style>
