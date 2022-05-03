import vue from "@vitejs/plugin-vue";

/**
 * @type {import('vite').UserConfig}
 */
export default {
    plugins: [vue()],
    base: "",
    root: "./src/",
    publicDir: "./renderer/public/",
    build: {
        outDir: "../vue-dist/",
        target: "node16",
    },
    optimizeDeps: {
        exclude: ["fs", "fs/promises", "path", "keytar", "crypto", "fsevents.node", "sshcrypto.node", "chokidar", "ssh2", "ssh2_sftp_client"],
    },
};
