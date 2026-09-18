import { defineConfig } from "vitepress";
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from "vitepress-plugin-group-icons";
import llmstxtPlugin from "vitepress-plugin-llms";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";

// retired URL -> its replacement, both as site-absolute .html paths
const redirects: Array<[string, string]> = [
  // CLI moved
  ["/essentials/cli.html", "/cli/intro.html"],
  // OpenAPI moved
  ["/openapi.html", "/openapi/intro.html"],
  // Agents notes moved
  ["/agents.html", "/agents/intro.html"],
];

// the URL a page is published at, to match a redirect key against
const pageUrl = (relativePath: string) => {
  return `/${relativePath.replace(/\.md$/, ".html")}`;
};

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

    const url = pageUrl(pageData.relativePath);
    const redirect = redirects.find(([old]) => old === url);

    // mark .html URLs as canonical - for a redirect stub that is the target,
    // otherwise the retired URL competes with the page it points at
    pageData.frontmatter.head.push([
      "link",
      {
        rel: "canonical",
        href: `https://kosmojs.dev${redirect ? redirect[1] : url}`,
      },
    ]);

    if (redirect) {
      pageData.frontmatter.head.push(
        ["meta", { "http-equiv": "refresh", content: `0; url=${redirect[1]}` }],
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
    plugins: [
      llmstxtPlugin({
        // redirect stubs carry no content - keep them out of llms.txt
        ignoreFiles: redirects.map(([from]) => {
          return from.replace(/^\//, "").replace(/\.html$/, ".md");
        }),
      }) as never,
      groupIconVitePlugin() as never,
    ],
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
      {
        text: "CLI",
        link: "/cli/intro",
        activeMatch: "^/cli/",
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
              text: "Why HTTP",
              docFooterText: "Why HTTP",
              link: "/essentials/why-http",
            },
            {
              text: "Why Codegen",
              docFooterText: "Why Codegen",
              link: "/essentials/why-codegen",
            },
          ],
        },
        {
          text: "CLI",
          link: "/cli/intro",
          collapsed: false,
          items: [
            {
              text: "create kosmo",
              docFooterText: "create kosmo",
              link: "/cli/create",
            },
            {
              text: "kosmo folder",
              docFooterText: "kosmo folder",
              link: "/cli/folder",
            },
            {
              text: "kosmo sidecar",
              docFooterText: "kosmo sidecar",
              link: "/cli/sidecar",
            },
            {
              text: "kosmo serve",
              docFooterText: "kosmo serve",
              link: "/cli/serve",
            },
            {
              text: "kosmo preview",
              docFooterText: "kosmo preview",
              link: "/cli/preview",
            },
            {
              text: "kosmo build",
              docFooterText: "kosmo build",
              link: "/cli/build",
            },
            {
              text: "kosmo typecheck",
              docFooterText: "kosmo typecheck",
              link: "/cli/typecheck",
            },
          ],
        },
        {
          text: "Routing",
          link: "/routing/intro",
          collapsed: false,
          items: [
            {
              text: "Rationale",
              link: "/routing/rationale",
            },
            {
              text: "Parameters",
              link: "/routing/params",
            },
          ],
        },
        {
          text: "Backend",
          link: "/backend/intro",
          collapsed: false,
          items: [
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
              text: "Edge Middleware",
              collapsed: false,
              link: "/backend/edge-middleware",
            },
            {
              text: "Error Handling",
              collapsed: false,
              link: "/backend/error-handling",
            },
            {
              text: "Aliases",
              link: "/backend/aliases",
            },
            {
              text: "Custom Templates",
              link: "/backend/custom-templates",
            },
          ],
        },
        {
          text: "Frontend",
          link: "/frontend/intro",
          collapsed: false,
          items: [
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
          link: "/validation/intro",
          collapsed: false,
          items: [
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
          link: "/fetch/intro",
          collapsed: false,
          items: [
            {
              text: "Quick Start",
              link: "/fetch/start",
            },
            {
              text: "Integration",
              link: "/fetch/integration",
            },
            {
              text: "Isomorphic Clients",
              docFooterText: "Isomorphic Clients",
              link: "/fetch/isomorphic-clients",
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
          text: "Sidecar Folders",
          link: "/sidecar/intro",
          collapsed: false,
          items: [
            {
              text: "Config",
              docFooterText: "Sidecar config",
              link: "/sidecar/config",
            },
            {
              text: "Entry and runner",
              docFooterText: "Entry and runner",
              link: "/sidecar/entry",
            },
            {
              text: "In development",
              docFooterText: "Sidecars in development",
              link: "/sidecar/development",
            },
            {
              text: "Preview and production",
              docFooterText: "Sidecar folders in production",
              link: "/sidecar/production",
            },
          ],
        },
        {
          text: "OpenAPI",
          link: "/openapi/intro",
          collapsed: false,
          items: [
            {
              text: "Config",
              docFooterText: "OpenAPI config",
              link: "/openapi/config",
            },
            {
              text: "Generated spec",
              docFooterText: "OpenAPI: generated spec",
              link: "/openapi/spec",
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
              link: "/agents/intro",
              collapsed: true,
              items: [
                {
                  text: "Hono",
                  docFooterText: "Hono backend",
                  link: "/agents/hono",
                },
                {
                  text: "H3",
                  docFooterText: "H3 backend",
                  link: "/agents/h3",
                },
                {
                  text: "Koa",
                  docFooterText: "Koa backend",
                  link: "/agents/koa",
                },
                {
                  text: "React",
                  docFooterText: "React frontend",
                  link: "/agents/react",
                },
                {
                  text: "SolidJS",
                  docFooterText: "SolidJS frontend",
                  link: "/agents/solid",
                },
                {
                  text: "Vue",
                  docFooterText: "Vue frontend",
                  link: "/agents/vue",
                },
                {
                  text: "Svelte",
                  docFooterText: "Svelte frontend",
                  link: "/agents/svelte",
                },
                {
                  text: "MDX",
                  docFooterText: "MDX frontend",
                  link: "/agents/mdx",
                },
              ],
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
