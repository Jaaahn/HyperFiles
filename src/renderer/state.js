import { useLocalStorage } from "@vueuse/core";

export const profiles = useLocalStorage("sftp-config-tabs", []);

let defaultSettings = {
    editorPath: "",
};

export const settings = useLocalStorage("sftp-settings", defaultSettings);
