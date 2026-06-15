import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import "./fonts.css";

// Extends the default VitePress theme: every docs page renders exactly as
// before. Only the home route (frontmatter `landing: true`) swaps in the
// custom landing page - see Layout.vue.
export default {
  extends: DefaultTheme,
  Layout,
};
