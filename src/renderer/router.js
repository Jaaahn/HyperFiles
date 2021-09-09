import { createWebHashHistory, createRouter } from "vue-router";
import FTP from "./views/FTP.vue";
import Profiles from "./views/Profiles.vue";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/ftp/:profileId",
            name: "FTP",
            component: FTP,
        },
        {
            path: "/",
            name: "Profiles",
            component: Profiles,
        },
    ],
});

export default router;
