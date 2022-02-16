// This file is the main file for Vue, the rendering process.

import { createApp } from "vue";
import App from "./App.vue";

import "./index.scss";

const app = createApp(App);

import HyperUI from "@jaaahn/hyper-ui";
app.use(HyperUI);
import "@jaaahn/hyper-ui/styles";

import router from "./router.js";
app.use(router);

app.mount("#app");
