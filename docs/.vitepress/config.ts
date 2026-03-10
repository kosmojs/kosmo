import { defineConfig } from "vitepress";
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from "vitepress-plugin-group-icons";
import llmstxt from "vitepress-plugin-llms";

const icons = {
  gear: "\u2699\uFE0F",
};

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
  },

  themeConfig: {
    search: {
      provider: "local",
    },
    nav: [
      {
        text: "📚 Guide",
        link: "/start",
        activeMatch: "^/(?!generators/|plugins/).+",
      },
      {
        text: "🛠️ Generators",
        link: "/generators/intro",
        activeMatch: "^/generators/",
      },
      {
        text: "🔌 Plugins",
        link: "/plugins/intro",
        activeMatch: "^/plugins/",
      },
    ],

    sidebar: {
      "/generators/": [
        {
          text: "Generators",
          collapsed: false,
          items: [
            {
              text: "🏗 Architecture",
              docFooterText: "🏗 Generators Architecture",
              link: "/generators/intro",
            },
            {
              text: `${icons.gear} User Options`,
              link: "/generators/user-options",
            },
            {
              text: "🏭 Factory",
              link: "/generators/factory",
            },
            {
              text: "🔄 Incremental Updates",
              link: "/generators/incremental-updates",
            },
            {
              text: "🗂 Route Entries",
              link: "/generators/route-entries",
            },
            {
              text: "🧭 Path Resolver",
              link: "/generators/path-resolver",
            },
            {
              text: "💡 Best Practices",
              link: "/generators/best-practices",
            },
          ],
        },
      ],
      "/plugins/": [
        {
          text: "Plugins",
          collapsed: false,
          items: [
            {
              text: "🔰 Intro",
              link: "/plugins/intro",
            },
            {
              text: "🔧 Configuration",
              link: "/plugins/configuration",
            },
            {
              text: "🏗 Dev Plugin",
              link: "/plugins/dev-plugin",
            },
            {
              text: "📝 Define Plugin",
              link: "/plugins/define-plugin",
            },
            {
              text: "🔀 Alias Plugin",
              link: "/plugins/alias-plugin",
            },
            {
              text: "💡 Best Practices",
              link: "/plugins/best-practices",
            },
          ],
        },
      ],
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
              link: "/routing/generated-content",
            },
            {
              text: "💡 Best Practices",
              docFooterText: "💡 Routing Best Practices",
              link: "/routing/best-practices",
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
              text: "🧩 Endpoints",
              link: "/api-server/endpoints",
            },
            {
              text: "📋 Request Context",
              link: "/api-server/context",
            },
            {
              text: `${icons.gear} Core Configuration`,
              link: "/api-server/core-configuration",
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
              items: [
                {
                  text: "Koa",
                  link: "/api-server/error-handling/koa",
                },
                {
                  text: "Hono",
                  link: "/api-server/error-handling/hono",
                },
              ],
            },
            {
              text: "💻 Development Workflow",
              link: "/api-server/development-workflow",
            },
            {
              text: "🌐 Building for Production",
              link: "/api-server/building-for-production",
            },
            {
              text: "💡 Best Practices",
              docFooterText: "💡 API Best Practices",
              link: "/api-server/best-practices",
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
              text: "🔧 Utilities",
              link: "/frontend/utilities",
            },
            {
              text: "💡 Best Practices",
              docFooterText: "💡 Frontend - Best Practices",
              link: "/frontend/best-practices",
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
              text: "🎯 TRefine for Refinement",
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
              link: "/validation/performance",
            },
            {
              text: "💡 Best Practices",
              docFooterText: "💡 Validation Best Practices",
              link: "/validation/best-practices",
            },
          ],
        },
        {
          text: "Fetch Client",
          collapsed: false,
          items: [
            {
              text: "🔰 Intro",
              docFooterText: "🔗 Fetch Client",
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
              link: "/fetch/utilities",
            },
            {
              text: "💡 Best Practices",
              docFooterText: "💡 Fetch Best Practices",
              link: "/fetch/best-practices",
            },
          ],
        },
        {
          text: "OpenAPI Generator",
          collapsed: false,
          items: [
            {
              text: "🔰 Intro",
              docFooterText: "🛠 OpenAPI - Install / Setup",
              link: "/openapi/intro",
            },
            {
              text: `${icons.gear} Configuration`,
              link: "/openapi/configuration",
            },
            {
              text: "📋 Generated Spec",
              link: "/openapi/generated-spec",
            },
            {
              text: "💡 Best Practices",
              docFooterText: "💡 OpenAPI Best Practices",
              link: "/openapi/best-practices",
            },
          ],
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
