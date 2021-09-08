import vue from "@vitejs/plugin-vue";

/**
 * @type {import('vite').UserConfig}
 */
export default {
    plugins: [vue()],
    base: "",
    root: "./src/",
    build: {
        outDir: "../vue-dist/",
    },
    optimizeDeps: {
        exclude: ["fs", "fs/promises", "path"],
    },
};
