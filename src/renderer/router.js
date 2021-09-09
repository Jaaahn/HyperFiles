import { createWebHashHistory, createRouter } from "vue-router";
import Home from "./views/Home.vue";
import Profiles from "./views/Profiles.vue";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/",
            name: "Home",
            component: Home,
        },
        {
            path: "/profiles",
            name: "Profiles",
            component: Profiles,
        },
    ],
});

export default router;
