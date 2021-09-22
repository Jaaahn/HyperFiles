import { useLocalStorage } from "@vueuse/core";

export const profiles = useLocalStorage("sftp-config-tabs", []);
