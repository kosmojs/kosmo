import DefaultTheme from "vitepress/theme";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";

import "virtual:group-icons.css";

import LinkButton from "./components/LinkButton.vue";
import Layout from "./Layout.vue";
import "./fonts.css";
import "./index.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("LinkButton", LinkButton);
    enhanceAppWithTabs(app);
  },
};
