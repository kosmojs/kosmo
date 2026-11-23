import DefaultTheme from "vitepress/theme";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";

import "@fontsource-variable/baloo-2";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/space-grotesk";

import "virtual:group-icons.css";
import "./index.css";

import LinkButton from "./components/LinkButton.vue";
import Layout from "./Layout.vue";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("LinkButton", LinkButton);
    enhanceAppWithTabs(app);
  },
};
