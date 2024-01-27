import vue from "@vitejs/plugin-vue";
import * as path from "path";
import license from "rollup-plugin-license";

/**
 * @type {import('vite').UserConfig}
 */
export default {
    server: {
        port: 3000,
    },
    plugins: [
        vue(),
        license({
            sourcemap: true,
            thirdParty: {
                includePrivate: true,
                output: {
                    file: path.join(__dirname, "vue-dist", "open-source-licenses.txt"),
                    encoding: "utf-8",
                },
            },
        }),
    ],
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
