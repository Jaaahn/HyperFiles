<template>
    <div class="header">
        <hy-flex-container :allowBreak="false" ref="flexContainer">
            <hy-button v-if="$route.path != '/'" @click="$router.back()" type="transparent"> <i class="icon-arrow-down rotate90deg"></i> {{ useMinimalBackBtn ? "" : "Back" }} </hy-button>
            <div v-else class="homeIcon">
                <i class="icon-home"></i>
            </div>

            <h3 class="extend-full">{{ title }}</h3>

            <slot />
        </hy-flex-container>
    </div>
</template>

<script>
export default {
    name: "Header",
    props: {
        title: String,
        useMinimalBackBtn: {
            type: Boolean,
            default: true,
        },
        isSftpHeader: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        adaptWidth() {
            if (this.isSftpHeader) {
                this.$refs.flexContainer.$el.style.width = "min(calc(100% - 20px), 2000px)";
            } else {
                this.$refs.flexContainer.$el.style.width = "min(1200px, 95vw)";
            }
        },
    },
    watch: {
        isSftpHeader: "adaptWidth",
    },
    mounted() {
        this.adaptWidth();
    },
};
</script>

<style lang="scss" scoped>
.header {
    top: 0;
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

        .hyper-button :deep(button),
        :slotted(.hyper-button :deep(button)) {
            padding: 10px;
        }

        .homeIcon {
            padding: 10px; // Same as HyperUI Button
        }
    }
}
</style>
