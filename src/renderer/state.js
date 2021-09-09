import { useLocalStorage } from "@vueuse/core";

export const tabs = useLocalStorage("sftp-config-tabs", []);
