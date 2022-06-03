import { createWebHashHistory, createRouter } from "vue-router";
import FTP from "./views/FTP.vue";
import Home from "./views/Home.vue";
import Settings from "./views/Settings.vue";

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
    ],
});

export default router;
