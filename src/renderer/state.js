import { useLocalStorage } from "@vueuse/core";
import generateId from "./utils/generateId.js";

export const tabs = useLocalStorage("sftp-config-tabs", [
    {
        id: generateId(),
        name: "Dokku Test",
        remote: {
            host: "116.203.239.183",
            port: "22",
            username: "root",
            privateKeyPath: "/Users/janbahlinger/.ssh/id_rsa",
            path: "/root",
        },
        local: {
            path: "/Users/janbahlinger/desktop",
        },
    },
]);
