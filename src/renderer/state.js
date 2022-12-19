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

// MIGRATE - Add pathSystem and init to posix
profiles.value.forEach((profile) => {
    if (profile.remote.pathSystem == undefined) {
        profile.remote.pathSystem = "posix";
    }
});
