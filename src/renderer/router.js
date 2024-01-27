import { createWebHashHistory, createRouter } from "vue-router";
import FTP from "./views/FTP.vue";
import Home from "./views/Home.vue";
import Settings from "./views/Settings.vue";
import Licenses from "./views/Licenses.vue";

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
            path: "/licenses",
            name: "Licenses",
            component: Licenses,
        },
    ],
});

export default router;
