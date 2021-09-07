// This file is the main file for Vue, the rendering process.

import { createApp } from "vue";
import App from "./App.vue";

import "./index.scss";

import "../../node_modules/@jaaahn/hyper-ui/dist/index.css";

import HyperUI from "@jaaahn/hyper-ui";
import router from "./router.js";

const app = createApp(App);

app.use(router);
app.use(HyperUI);

app.mount("#app");
