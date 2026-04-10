import { defineConfig } from "vitepress";
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from "vitepress-plugin-group-icons";
import llmstxt from "vitepress-plugin-llms";

const redirects: Array<[string, string]> = [];

export default defineConfig({
  lang: "en-US",
  title: "KosmoJS",

  lastUpdated: true,

  // Force .html on all URLs
  cleanUrls: false,

  transformPageData(pageData) {
    pageData.frontmatter.head ??= [];

    // mark .html URLs as canonical
    pageData.frontmatter.head.push([
      "link",
      {
        rel: "canonical",
        href: `https://kosmojs.dev/${pageData.relativePath.replace(/\.md$/, ".html")}`,
      },
    ]);

    const redirect = redirects.find(([old]) => old === pageData.relativePath);

    if (redirect) {
      pageData.frontmatter.head.push(
        [
          "meta",
          { "http-equiv": "refresh", content: `0; url=/${redirect[1]}` },
        ],
        ["meta", { name: "robots", content: "noindex" }],
      );
    }
  },

  head: [
    [
      "script",
      {
        defer: "true",
        src: "https://cloud.umami.is/script.js",
        "data-website-id": "e1b463f8-11fa-49ec-a4af-d88f9bef6c05",
      },
    ],
  ],

  sitemap: {
    hostname: "https://kosmojs.dev",
    lastmodDateOnly: true,
  },

  vite: {
    plugins: [llmstxt(), groupIconVitePlugin()],
  },

  markdown: {
    config(md) {
      md.use(groupIconMdPlugin);
    },
    theme: {
      light: "catppuccin-latte",
      dark: "catppuccin-mocha",
    },
  },

  themeConfig: {
    search: {
      provider: "local",
    },
    nav: [
      {
        text: "Guide",
        link: "/start",
        activeMatch: "^/(?!features|routing|api-server|about).+",
      },
      {
        text: "Features",
        link: "/features",
        activeMatch: "^/features(.html)?",
      },
      {
        text: "Routing",
        link: "/routing/intro",
        activeMatch: "^/routing\\/.+",
      },
      {
        text: "API",
        link: "/api-server/intro",
        activeMatch: "^/api-server\\/.+",
      },
      {
        text: "About",
        link: "/about",
        activeMatch: "^/about(.html)?",
      },
    ],

    sidebar: {
      "/": [
        {
          text: "Introduction",
          collapsed: false,
          items: [
            {
              text: "💡 About",
              link: "/about",
            },
            {
              text: "✨ Features",
              link: "/features",
            },
            {
              text: "🚀 Getting Started",
              link: "/start",
            },
          ],
        },
        {
          text: "Routing",
          collapsed: false,
          items: [
            {
              text: "🔰 Intro",
              docFooterText: "🛣 Routing",
              link: "/routing/intro",
            },
            {
              text: "💯 Rationale",
              link: "/routing/rationale",
            },
            {
              text: "🚥 Parameters",
              link: "/routing/params",
            },
            {
              text: "🤖 Generated Content",
              docFooterText: "🤖 Routing - Generated Content",
              link: "/routing/generated-content",
            },
          ],
        },
        {
          text: "API Server",
          collapsed: false,
          items: [
            {
              text: "🔰 Intro",
              docFooterText: "🧩 API Intro",
              link: "/api-server/intro",
            },
            {
              text: "📋 Request Context",
              link: "/api-server/context",
            },
            {
              text: "🛡 Type Safety",
              collapsed: false,
              link: "/api-server/type-safety",
            },
            {
              text: "▶️ Middleware",
              collapsed: false,
              link: "/api-server/middleware",
            },
            {
              text: "🔽 Cascading Middleware",
              collapsed: false,
              link: "/api-server/cascading-middleware",
            },
            {
              text: "🚨 Error Handling",
              collapsed: false,
              link: "/api-server/error-handling",
            },
            {
              text: "💻 Development Workflow",
              link: "/api-server/development-workflow",
            },
            {
              text: "🌐 Building for Production",
              link: "/api-server/building-for-production",
            },
          ],
        },
        {
          text: "Frontend",
          collapsed: false,
          items: [
            {
              text: "🔰 Intro",
              docFooterText: "🎨 Frontend",
              link: "/frontend/intro",
            },
            {
              text: "🏗 Application",
              link: "/frontend/application",
            },
            {
              text: "🛣 Routing",
              link: "/frontend/routing",
            },
            {
              text: "🧭 Link Navigation",
              link: "/frontend/link-navigation",
            },
            {
              text: "📥 Data / Preload",
              link: "/frontend/data-preload",
            },
            {
              text: "⚡ Server-Side Render",
              link: "/frontend/server-side-render",
            },
            {
              text: "🎨 Custom Templates",
              link: "/frontend/custom-templates",
            },
            {
              text: "📄 MDX Content",
              docFooterText: "📄 Frontend - MDX Content",
              link: "/frontend/mdx",
            },
          ],
        },
        {
          text: "Runtype Validation",
          collapsed: false,
          items: [
            {
              text: "🔰 Intro",
              docFooterText: "🛡 Runtype Validation",
              link: "/validation/intro",
            },
            {
              text: "🚥 Validating Params",
              link: "/validation/params",
            },
            {
              text: "📦 Validating Payloads",
              link: "/validation/payload",
            },
            {
              text: "📤 Validating Responses",
              link: "/validation/response",
            },
            {
              text: "🎯 VRefine for Refinement",
              link: "/validation/refine",
            },
            {
              text: "🏁 Skip Validation",
              link: "/validation/skip-validation",
            },
            {
              text: "🚨 Error Handling",
              link: "/validation/error-handling",
            },
            {
              text: "🏷 Naming Conventions",
              link: "/validation/naming-conventions",
            },
            {
              text: "📊 About Performance",
              docFooterText: "📊 Validation - Performance",
              link: "/validation/performance",
            },
          ],
        },
        {
          text: "Fetch Clients",
          collapsed: false,
          items: [
            {
              text: "🔰 Intro",
              docFooterText: "🔗 Fetch Clients",
              link: "/fetch/intro",
            },
            {
              text: "🚀 Quick Start",
              link: "/fetch/start",
            },
            {
              text: "🔌 Integration",
              link: "/fetch/integration",
            },
            {
              text: "🛡 Validation",
              link: "/fetch/validation",
            },
            {
              text: "🚨 Error Handling",
              link: "/fetch/error-handling",
            },
            {
              text: "🛠 Utilities",
              docFooterText: "🛠 Fetch Utilities",
              link: "/fetch/utilities",
            },
          ],
        },
        {
          text: "📋 OpenAPI",
          link: "/openapi",
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/kosmojs/kosmo" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025-PRESENT Slee Woo",
    },
  },
});
