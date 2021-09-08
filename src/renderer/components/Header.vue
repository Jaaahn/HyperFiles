<template>
    <div id="header">
        <hy-select :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
            <option value="">Please choose</option>

            <option v-for="tab in tabs" :value="tab.id" :key="tab.id">{{ tab.name }}</option>
        </hy-select>

        <h3 v-if="currentTabInfo">Connected to {{ currentTabInfo.name }}</h3>
    </div>
</template>

<script>
export default {
    name: "Header",
    props: {
        modelValue: String,
        tabs: Array,
        currentTabInfo: null,
    },
    data() {
        return {};
    },
};
</script>

<style lang="scss" scoped>
#header {
    height: 80px;
    width: 100vw;
    z-index: 100;
    position: fixed;
    background-color: var(--section-bg-color);
    box-shadow: var(--element-shadow);
}
</style>
