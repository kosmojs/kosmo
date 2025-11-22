import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import picomatch, { type Matcher } from "picomatch";

import {
  defaults,
  type GeneratorFactory,
  type PageRoute,
  type PathToken,
  pathResolver,
  type RouteResolverEntry,
  render,
  renderToFile,
} from "@kosmojs/devlib";

import type { Options } from "./types";

import libFetchUnwrapTpl from "./templates/lib/fetch/unwrap.hbs";
import libPagesTpl from "./templates/lib/pages.hbs";
import libVueClientTpl from "./templates/lib/vue/client.hbs";
import libVueIndexTpl from "./templates/lib/vue/index.hbs";
import libVueServerTpl from "./templates/lib/vue/server.hbs";
import stylesTpl from "./templates/lib/vue/styles.css?as=text";
import libVueUseTpl from "./templates/lib/vue/use.hbs";
import paramTpl from "./templates/param.hbs";
import publicAppTpl from "./templates/public/App.hbs";
import publicComponentsLinkTpl from "./templates/public/components/Link.hbs";
import publicEntryClientTpl from "./templates/public/entry/client.hbs";
import publicEntryServerTpl from "./templates/public/entry/server.hbs";
import publicEnvTpl from "./templates/public/env.hbs";
import publicIndexTpl from "./templates/public/index.html?as=text";
import publicPageTpl from "./templates/public/page.hbs";
import publicRouterTpl from "./templates/public/router.hbs";
import welcomePageTpl from "./templates/public/welcome-page.hbs";

function randomCongratMessage(): string {
  const messages = [
    "🎉 Well done! You just created a new Vue route.",
    "🚀 Success! A fresh Vue route is ready to roll.",
    "🌟 Nice work! Another Vue route added to your app.",
    "🧩 All set! A new Vue route has been scaffolded.",
    "🔧 Scaffold complete! Your new Vue route is in place.",
    "✅ Built! Your Vue route is scaffolded and ready.",
    "✨ Fantastic! Your new Vue route is good to go.",
    "🎯 Nailed it! A brand new Vue route just landed.",
    "💫 Awesome! Another Vue route joins the party.",
    "⚡ Lightning fast! A new Vue route created successfully.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export const factory: GeneratorFactory<Options> = async (
  { appRoot, sourceFolder, formatters, generators, command },
  { templates, meta },
) => {
  const { resolve } = pathResolver({ appRoot, sourceFolder });

  const customTemplates: Array<[Matcher, string]> = Object.entries(
    templates || {},
  ).map(([pattern, template]) => [picomatch(pattern), template]);

  const metaMatchers: Array<[Matcher, unknown]> = Object.entries(
    meta || {},
  ).map(([pattern, meta]) => [picomatch(pattern), meta]);

  const metaResolver = ({ name }: PageRoute) => {
    const match = metaMatchers.find(([isMatch]) => isMatch(name));
    return Object.prototype.toString.call(match?.[1]) === "[object Object]"
      ? JSON.stringify(match?.[1])
      : undefined;
  };

  const ssrGenerator = generators.some((e) => e.kind === "ssr");

  await mkdir(resolve("libDir", sourceFolder, "{vue}"), { recursive: true });

  await writeFile(
    resolve("libDir", sourceFolder, "{vue}/styles.module.css"),
    stylesTpl,
    "utf8",
  );

  await renderToFile(
    resolve("fetchLibDir", "unwrap.ts"),
    libFetchUnwrapTpl,
    {},
    { formatters },
  );

  for (const [file, template] of [
    ["env.d.ts", publicEnvTpl],
    ["components/Link.vue", publicComponentsLinkTpl],
    ["App.vue", publicAppTpl],
    ["router.ts", publicRouterTpl],
    [join(defaults.entryDir, "client.ts"), publicEntryClientTpl],
    ["index.html", publicIndexTpl],
    ...(ssrGenerator
      ? [[join(defaults.entryDir, "server.ts"), publicEntryServerTpl]]
      : []),
  ] as const) {
    await renderToFile(
      resolve("@", file),
      template,
      {
        defaults,
        sourceFolder,
        importPathmap: {
          config: join(sourceFolder, defaults.configDir),
          pageMap: join(sourceFolder, defaults.pagesLibDir),
          fetch: join(sourceFolder, defaults.fetchLibDir),
          vue: join(sourceFolder, "{vue}"),
        },
      },
      {
        // For index.html: overwrite only if empty or missing "<!--app-html-->".
        // For other files: overwrite only if blank.
        overwrite:
          file === "index.html"
            ? (c) => !c?.trim().length || !c?.includes("<!--app-html-->")
            : (c) => !c?.trim().length,
        formatters,
      },
    );
  }

  const generatePublicFiles = async (entries: Array<RouteResolverEntry>) => {
    for (const { kind, route } of entries) {
      if (kind !== "page") {
        continue;
      }

      const customTemplate = customTemplates.find(([isMatch]) => {
        return isMatch(route.name);
      });

      await renderToFile(
        resolve("pagesDir", route.file),
        route.name === "index"
          ? welcomePageTpl
          : customTemplate?.[1] || publicPageTpl,
        {
          defaults,
          route,
          message: randomCongratMessage(),
          importPathmap: {
            styles: join(sourceFolder, "{vue}/styles.module.css"),
          },
        },
        {
          // write only to blank files
          overwrite: (fileContent) => !fileContent?.trim().length,
          formatters,
        },
      );
    }
  };

  const staticSegments = (pathTokens: Array<PathToken>) => {
    return pathTokens.reduce((a, e) => a + (e.param ? 0 : 1), 0);
  };

  const generateIndexFiles = async (entries: Array<RouteResolverEntry>) => {
    const routes = entries
      .flatMap(({ kind, route }) => {
        return kind === "page"
          ? [
              {
                ...route,
                path: join("/", pathFactory(route.pathTokens)),
                paramsLiteral: route.params.schema
                  .map((param) => render(paramTpl, { param }).trim())
                  .join(", "),
                meta: metaResolver(route),
                importPathmap: {
                  page: join(
                    sourceFolder,
                    defaults.pagesDir,
                    `${route.importPath}/index.vue`,
                  ),
                },
              },
            ]
          : [];
      })
      .sort((a, b) => {
        /**
         * Sort routes so that more specific (static) paths come before dynamic ones.
         *
         * This is important because dynamic segments
         * (e.g., `:id` or `*catchall`) are more general,
         * and can match values that should be routed to more specific static paths.
         *
         * For example, given:
         *   - `/users/account`
         *   - `/users/:id`
         * If `/users/:id` comes first, visiting `/users/account` would incorrectly match it,
         * treating "account" as an `id`. So static routes must take precedence.
         *
         * Estimating specificity by counting static segments - i.e., those that don't start
         * with `:` or `*`. The route with more static segments is considered more specific.
         * */
        const aStaticSegments = staticSegments(a.pathTokens);
        const bStaticSegments = staticSegments(b.pathTokens);
        return aStaticSegments === bStaticSegments
          ? a.path.localeCompare(b.path)
          : bStaticSegments - aStaticSegments;
      });

    /**
     * Selecting api routes eligible for `useResource`.
     * Only considering api routes that handle GET requests without params.
     * */
    const apiRoutes = entries
      .flatMap(({ kind, route }) => {
        if (kind !== "api") {
          return [];
        }

        if (!route.methods.includes("GET")) {
          return [];
        }

        if (!route.optionalParams) {
          return [];
        }

        return [
          {
            ...route,
            importPathmap: {
              fetch: join(
                sourceFolder,
                defaults.apiLibDir,
                route.importPath,
                "fetch",
              ),
            },
          },
        ];
      })
      .sort(
        // cosmetic sort, needed for consistency between builds
        (a, b) => a.name.localeCompare(b.name),
      );

    const context = {
      routes,
      apiRoutes,
      shouldHydrate: JSON.stringify(ssrGenerator ? command === "build" : false),
      importPathmap: {
        config: join(sourceFolder, defaults.configDir),
        fetch: join(sourceFolder, defaults.fetchLibDir),
      },
    };

    for (const [file, template] of [
      ["{vue}/index.ts", libVueIndexTpl],
      ["{vue}/client.ts", libVueClientTpl],
      ["{vue}/server.ts", libVueServerTpl],
      ["{vue}/use.ts", libVueUseTpl],
      [`${defaults.pagesLibDir}.ts`, libPagesTpl],
    ]) {
      await renderToFile(
        resolve("libDir", sourceFolder, file),
        template,
        context,
        { formatters },
      );
    }
  };

  return {
    async watchHandler(entries, event) {
      // Fill empty route files with templates (default or custom)
      // - Initial call (event is undefined): process all routes
      // - Create event: process newly added route
      if (!event || event.kind === "create") {
        await generatePublicFiles(entries);
      }

      // Always regenerate index files to keep router in sync
      await generateIndexFiles(entries);
    },
  };
};

export const pathFactory = (pathTokens: Array<PathToken>) => {
  return pathTokens
    .flatMap(({ path, param }) => {
      if (param?.isRest) {
        return [`:${param.name}(.*)?`];
      }
      if (param?.isOptional) {
        return [`:${param.name}?`];
      }
      if (param) {
        return [`:${param.name}`];
      }
      return path === "/" ? [] : [path];
    })
    .join("/")
    .replace(/\+/g, "\\\\+");
};
