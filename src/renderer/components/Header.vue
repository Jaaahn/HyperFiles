<template>
    <div id="header">
        <hy-flex-container>
            <hy-button @click="$router.push('/')" :extend="false" type="transparent"> <i class="icon-chevron-down"></i> </hy-button>

            <h3>Connected to {{ currentTabInfo.name }}</h3>

            <hy-button @click="$emit('reload')" :extend="false" type="transparent">Reload</hy-button>
        </hy-flex-container>
    </div>
</template>

<script>
export default {
    name: "Header",
    props: {
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
    height: 60px;
    width: 100vw;
    z-index: 100;
    position: fixed;
    background-color: var(--section-bg-color);
    box-shadow: var(--element-shadow);

    .hyper-flexcontainer {
        margin: 0;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        position: relative;
        width: min(calc(100% - 20px), 2000px);

        .hyper-button :deep(button) {
            padding: 10px;
        }

        i::before {
            transform: rotate(90deg);
        }
    }
}
</style>
