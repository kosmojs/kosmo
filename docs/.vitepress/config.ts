import { defineConfig } from "vitepress";
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from "vitepress-plugin-group-icons";
import llmstxtPlugin from "vitepress-plugin-llms";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";

const redirects: Array<[string, string]> = [];

export default defineConfig({
  lang: "en-US",
  title: "KosmoJS",

  lastUpdated: true,

  // dark by default; the toggle still switches the whole site, code blocks included
  appearance: "dark",

  // Force .html on all URLs
  cleanUrls: false,

  transformHead({ pageData }) {
    if (pageData.relativePath === "index.md") {
      return [
        [
          "script",
          { type: "application/ld+json" },
          JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "KosmoJS",
            url: "https://kosmojs.dev",
            logo: "https://kosmojs.dev/kosmo-logo.png",
          }),
        ],
      ];
    }
    return [];
  },

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
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        href: "/favicon-96.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico",
        sizes: "48x48",
      },
    ],
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    ],
    ["link", { rel: "manifest", href: "/site.webmanifest" }],
    ["meta", { name: "theme-color", content: "#1e1e2e" }],
    [
      "script",
      {
        defer: "true",
        src: "https://cloud.umami.is/script.js",
        "data-website-id": "e1b463f8-11fa-49ec-a4af-d88f9bef6c05",
      },
    ],
    [
      "script",
      {
        defer: "true",
        src: "https://context7.com/widget.js",
        "data-library": "/llmstxt/kosmojs_dev_llms-full_txt",
      },
    ],
  ],

  sitemap: {
    hostname: "https://kosmojs.dev",
    lastmodDateOnly: true,
  },

  vite: {
    plugins: [llmstxtPlugin() as never, groupIconVitePlugin() as never],
  },

  markdown: {
    config(md) {
      md.use(groupIconMdPlugin);
      md.use(tabsMarkdownPlugin);
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
        text: "About",
        link: "/about",
        activeMatch: "^/about",
      },
      {
        text: "Features",
        link: "/features",
        activeMatch: "^/features",
      },
      {
        text: "Quick Start",
        link: "/start",
        activeMatch: "^/start",
      },
      {
        text: "Tutorial",
        link: "/tutorial",
        activeMatch: "^/tutorial",
      },
      {
        text: "Config",
        link: "/essentials/config",
        activeMatch: "^/essentials/config",
      },
    ],

    sidebar: {
      "/": [
        {
          text: "Essentials",
          collapsed: false,
          items: [
            {
              text: "Project Structure",
              link: "/essentials/project-structure",
            },
            {
              text: "Configuration",
              docFooterText: "kosmo.config.ts",
              link: "/essentials/config",
            },
            {
              text: "CLI",
              link: "/essentials/cli",
            },
            {
              text: "Framework Support",
              docFooterText: "Framework Support Matrix",
              link: "/essentials/frameworks",
            },
            {
              text: "Migration Tips",
              docFooterText: "Migration Tips",
              link: "/essentials/migration-tips",
            },
            {
              text: "Why Codegen",
              docFooterText: "Why Codegen",
              link: "/essentials/codegen",
            },
          ],
        },
        {
          text: "Routing",
          collapsed: false,
          items: [
            {
              text: "Intro",
              docFooterText: "Routing",
              link: "/routing/intro",
            },
            {
              text: "Rationale",
              link: "/routing/rationale",
            },
            {
              text: "Parameters",
              link: "/routing/params",
            },
            {
              text: "Generated Content",
              docFooterText: "Routing - Generated Content",
              link: "/routing/generated-content",
            },
          ],
        },
        {
          text: "Backend",
          collapsed: false,
          items: [
            {
              text: "Intro",
              docFooterText: "API Intro",
              link: "/backend/intro",
            },
            {
              text: "Request Context",
              link: "/backend/context",
            },
            {
              text: "Type Safety",
              collapsed: false,
              link: "/backend/type-safety",
            },
            {
              text: "Middleware",
              collapsed: false,
              link: "/backend/middleware",
            },
            {
              text: "Cascading Middleware",
              collapsed: false,
              link: "/backend/cascading-middleware",
            },
            {
              text: "Error Handling",
              collapsed: false,
              link: "/backend/error-handling",
            },
            {
              text: "Custom Templates",
              link: "/backend/custom-templates",
            },
          ],
        },
        {
          text: "Frontend",
          collapsed: false,
          items: [
            {
              text: "Intro",
              docFooterText: "Frontend",
              link: "/frontend/intro",
            },
            {
              text: "Application",
              link: "/frontend/application",
            },
            {
              text: "Routing",
              link: "/frontend/routing",
            },
            {
              text: "Layouts",
              link: "/frontend/layouts",
            },
            {
              text: "Data / Preload",
              link: "/frontend/data-preload",
            },
            {
              text: "The _/use Hooks",
              docFooterText: "Frontend - _/use Hooks",
              link: "/frontend/hooks",
            },
            {
              text: "Server-Side Render",
              link: "/frontend/server-side-render",
            },
            {
              text: "Static Site Generation",
              link: "/frontend/static-site-generation",
            },
            {
              text: "Error Boundaries",
              link: "/frontend/error-boundaries",
            },
            {
              text: "Error Pages",
              link: "/frontend/error-pages",
            },
            {
              text: "TanStack Query",
              link: "/frontend/tanstack-query",
            },
            {
              text: "Link Navigation",
              link: "/frontend/link-navigation",
            },
            {
              text: "Custom Templates",
              link: "/frontend/custom-templates",
            },
            {
              text: "MDX Content",
              docFooterText: "Frontend - MDX Content",
              link: "/frontend/mdx",
            },
          ],
        },
        {
          text: "Runtype Validation",
          collapsed: false,
          items: [
            {
              text: "Intro",
              docFooterText: "Runtype Validation",
              link: "/validation/intro",
            },
            {
              text: "Params",
              link: "/validation/params",
            },
            {
              text: "Payloads",
              link: "/validation/payload",
            },
            {
              text: "Responses",
              link: "/validation/response",
            },
            {
              text: "VRefine for Refinement",
              link: "/validation/refine",
            },
            {
              text: "Skip Validation",
              link: "/validation/skip-validation",
            },
            {
              text: "Error Handling",
              link: "/validation/error-handling",
            },
            {
              text: "Naming Conventions",
              link: "/validation/naming-conventions",
            },
            {
              text: "Silent Failure Checklist",
              docFooterText: "Validation - Silent Failures",
              link: "/validation/gotchas",
            },
            {
              text: "About Performance",
              docFooterText: "Validation - Performance",
              link: "/validation/performance",
            },
          ],
        },
        {
          text: "Fetch Clients",
          collapsed: false,
          items: [
            {
              text: "Intro",
              docFooterText: "Fetch Clients",
              link: "/fetch/intro",
            },
            {
              text: "Quick Start",
              link: "/fetch/start",
            },
            {
              text: "Integration",
              link: "/fetch/integration",
            },
            {
              text: "Validation",
              link: "/fetch/validation",
            },
            {
              text: "Type Safety",
              link: "/fetch/type-safety",
            },
            {
              text: "Error Handling",
              link: "/fetch/error-handling",
            },
            {
              text: "Utilities",
              docFooterText: "Fetch Utilities",
              link: "/fetch/utilities",
            },
          ],
        },
        {
          text: "Dev / Build / Run",
          collapsed: false,
          items: [
            {
              text: "Development Workflow",
              docFooterText: "Development Workflow",
              link: "/dev-build-run/development-workflow",
            },
            {
              text: "Production Preview",
              link: "/dev-build-run/production-preview",
            },
            {
              text: "Building for Production",
              link: "/dev-build-run/building-for-production",
            },
          ],
        },
        {
          text: "OpenAPI",
          link: "/openapi",
        },
        {
          text: "FAQ / LLMs",
          collapsed: true,
          items: [
            {
              text: "FAQ",
              link: "/faq",
            },
            {
              text: "Agents",
              docFooterText: "Agents",
              link: "/agents",
            },
            {
              text: "Docs List",
              link: "/llms.txt",
            },
            {
              text: "Full Docs",
              link: "/llms-full.txt",
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
