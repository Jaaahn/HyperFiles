import { useLocalStorage } from "@vueuse/core";

export const profiles = useLocalStorage("sftp-config-tabs", []);

let defaultSettings = {
    editorPath: "",
    filters: {
        sortBy: "filename",
        sortDirection: "descending",
        separateDirs: false,
    },
};

export const settings = useLocalStorage("sftp-settings", defaultSettings);

// MIGRATE - Add filters property
if (settings.value.filters == undefined) {
    settings.value.filters = {
        sortBy: "filename",
        sortDirection: "descending",
        separateDirs: false,
    };
}
