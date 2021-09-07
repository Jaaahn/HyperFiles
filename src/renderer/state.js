import { ref, reactive, watch } from "vue";
import generateId from "./utils/generateId.js";

export const tabs = ref([
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

watch(tabs, (value) => console.log(value));
