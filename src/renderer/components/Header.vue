<template>
    <div id="header">
        <hy-flex-container>
            <hy-select :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
                <option value="">Please choose</option>

                <option v-for="tab in tabs" :value="tab.id" :key="tab.id">{{ tab.name }}</option>
            </hy-select>

            <hy-button @click="$router.push('/profiles')" :extend="false"> <i class="icon-bars"></i> </hy-button>
        </hy-flex-container>
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
