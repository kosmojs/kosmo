import DefaultTheme from "vitepress/theme";
import "@catppuccin/vitepress/theme/mocha/lavender.css";
import "virtual:group-icons.css";

import CodeSamples from "./components/CodeSamples.vue";
import LinkButton from "./components/LinkButton.vue";
import "./index.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("LinkButton", LinkButton);
    app.component("CodeSamples", CodeSamples);
  },
};
