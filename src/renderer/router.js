import { createWebHashHistory, createRouter } from "vue-router";
import FTP from "./views/FTP.vue";
import Home from "./views/Home.vue";
import Settings from "./views/Settings.vue";
import Licences from "./views/Licences.vue";

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
            name: "Home",
            component: Home,
        },
        {
            path: "/settings",
            name: "Settings",
            component: Settings,
        },
        {
            path: "/licences",
            name: "Licences",
            component: Licences,
        },
    ],
});

export default router;
