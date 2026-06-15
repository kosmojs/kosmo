import DefaultTheme from "vitepress/theme";

import "@catppuccin/vitepress/theme/mocha/lavender.css";
import "virtual:group-icons.css";

import LinkButton from "./components/LinkButton.vue";
import Layout from "./Layout.vue";
import "./fonts.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("LinkButton", LinkButton);
  },
};
