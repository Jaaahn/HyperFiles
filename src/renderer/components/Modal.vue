<template>
    <teleport to="#modals">
        <div class="modal" ref="modal" @click="$emit('close')" :class="{ open }">
            <div id="visual" @click.stop="" :style="'background:' + background">
                <div id="header">
                    <button @click="$emit('close')"><i class="icon-cross"></i></button>
                </div>
                <div id="content">
                    <slot />
                </div>
            </div>
        </div>
    </teleport>
</template>

<script>
export default {
    name: "Modal",
    emits: ["close"],
    data() {
        return {};
    },
    watch: {
        async open(val) {
            if (val == true) {
                this.$refs.modal.style.opacity = 1;
            } else {
                await new Promise((resolve) => setTimeout(() => resolve(), 200));
                this.$refs.modal.style.opacity = 0;
            }
        },
    },
    props: {
        open: Boolean,
        background: {
            type: String,
            optional: true,
        },
    },
};
</script>

<style lang="scss" scoped>
.modal {
    height: 100vh;
    width: 100vw;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 200;
    pointer-events: none;
    opacity: 0;
    background: transparent;

    &,
    #visual {
        transition-duration: 0.2s;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-property: background, transform;
    }

    &.open {
        pointer-events: initial;
        background: var(--modal-cover-color);
        cursor: zoom-out;

        #visual {
            transform: translateY(0%);
        }
    }

    #visual {
        cursor: default;
        padding: 20px;
        border-radius: 20px 20px 0 0;
        background-color: var(--modal-bg-color);
        position: fixed;
        bottom: 0;
        width: 100%;
        max-height: 70vh;
        overflow-y: auto;
        transform: translateY(100%);

        #header {
            height: 40px;
            display: flex;
            justify-content: flex-end;

            button {
                height: 40px;
                width: 40px;
                padding: 0;
                margin: 0;
                border-radius: 100%;
                border: none;
                font-size: 20px;
                color: var(--font-color);
                background-color: var(--body-bg-color);
                cursor: pointer;
            }
        }

        #content {
            margin: 40px 0 0 0;
            padding-bottom: env(safe-area-inset-bottom);

            .fullHeight {
                height: 70vh;
                overflow: auto;
            }
        }
    }
}

@media only screen and (min-width: 800px) {
    .modal {
        &.open #visual {
            transform: translate(-50%, 50%);
            bottom: 50%;
            opacity: 1;
            box-shadow: 0px 0px 15px 3px var(--modal-shadow-color);
        }

        #visual {
            border-radius: 20px;
            left: 50%;
            bottom: 30%;
            width: 50%;
            opacity: 0;
            max-width: 800px;
            transform: translate(-50%, 100%);
            transition-duration: 0.3s;
            transition-property: background, transform, bottom, opacity;
        }
    }
}

@media only screen and (max-width: 799px) {
    .modal #visual {
        min-height: 40vh;
    }
}

@media only screen and (prefers-color-scheme: light) {
    .modal {
        --modal-bg-color: var(--section-bg-color);
        --modal-cover-color: rgba(66, 66, 66, 0.432);
        --modal-shadow-color: rgba(153, 153, 153, 0.388);
    }
}

@media (prefers-color-scheme: dark) {
    .modal {
        --modal-bg-color: var(--section-bg-color);
        --modal-cover-color: rgba(14, 14, 14, 0.616);
        --modal-shadow-color: rgba(19, 19, 19, 0.388);
    }
}
</style>
