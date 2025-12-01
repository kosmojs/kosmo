import { mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { styleText } from "node:util";

import picomatch, { type Matcher } from "picomatch";

import {
  defaults,
  type GeneratorFactory,
  type PageRoute,
  type PathToken,
  pathExists,
  pathResolver,
  type ResolvedEntry,
  render,
  renderToFile,
  sortRoutes,
} from "@kosmojs/devlib";

import type { Options } from "./types";

import libPagesTpl from "./templates/lib/pages.hbs";
import libReactClientTpl from "./templates/lib/react/client.hbs";
import libReactIndexTpl from "./templates/lib/react/index.hbs";
import libReactServerTpl from "./templates/lib/react/server.hbs";
import stylesTpl from "./templates/lib/react/styles.css?as=text";
import libReactUseTpl from "./templates/lib/react/use.hbs";
import paramTpl from "./templates/param.hbs";
import publicAppTpl from "./templates/public/App.hbs";
import publicComponentsLinkTpl from "./templates/public/components/Link.hbs";
import publicEntryClientTpl from "./templates/public/entry/client.hbs";
import publicEntryServerTpl from "./templates/public/entry/server.hbs";
import publicIndexTpl from "./templates/public/index.html?as=text";
import publicPageTpl from "./templates/public/page.hbs";
import publicRouterTpl from "./templates/public/router.hbs";
import welcomePageTpl from "./templates/public/welcome-page.hbs";

function randomCongratMessage(): string {
  const messages = [
    "🎉 Well done! You just created a new React route.",
    "🚀 Success! A fresh React route is ready to roll.",
    "🌟 Nice work! Another React route added to your app.",
    "⚡ Quick and easy! Your new React route is good to go.",
    "🥳 Congrats! Your app just leveled up with a new React route.",
    "🧩 All set! A new React route has been scaffolded.",
    "🔧 Scaffold complete! Your new React route is in place.",
    "✨ Fantastic! Your new React route is ready.",
    "🎯 Nailed it! A brand new React route just landed.",
    "💫 Awesome! Another React route joins the lineup.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export const factory: GeneratorFactory<Options> = async (
  { appRoot, sourceFolder, command, formatters, generators },
  { templates, meta },
) => {
  const { resolve } = pathResolver({ appRoot, sourceFolder });

  const tsconfigFile = join(appRoot, "tsconfig.json");
  const tsconfigExists = await pathExists(tsconfigFile);

  if (!tsconfigExists) {
    throw new Error("SolidGenerator: missing tsconfig.json file");
  }

  const compilerOptions = await import(tsconfigFile, {
    with: { type: "json" },
  }).then((e) => e.default.compilerOptions);

  if (compilerOptions?.jsx !== "preserve") {
    console.error();
    console.error(
      styleText("red", "✗ ReactGenerator: tsconfig issue detected"),
    );
    console.error(
      [
        `  It is highly recommended to add the following lines\n`,
        `  to your ${styleText("blue", basename(tsconfigFile))}, `,
        `  inside the ${styleText("magenta", "compilerOptions")} section:`,
      ].join(""),
    );
    console.error(styleText("gray", `"compilerOptions": {`));
    console.error(styleText("cyan", `  "jsx": "preserve",`));
    console.error(styleText("gray", "}"));
    console.error();
  }

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

  await mkdir(resolve("libDir", sourceFolder, "{react}"), { recursive: true });

  await writeFile(
    resolve("libDir", sourceFolder, "{react}/styles.module.css"),
    stylesTpl,
    "utf8",
  );

  for (const [file, template] of [
    ["components/Link.tsx", publicComponentsLinkTpl],
    ["App.tsx", publicAppTpl],
    ["router.tsx", publicRouterTpl],
    [join(defaults.entryDir, "client.tsx"), publicEntryClientTpl],
    ["index.html", publicIndexTpl],
    ...(ssrGenerator
      ? [[join(defaults.entryDir, "server.ts"), publicEntryServerTpl]]
      : []),
  ]) {
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
          react: join(sourceFolder, "{react}"),
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

  const generatePublicFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind !== "pageRoute") {
        continue;
      }

      const customTemplate = customTemplates.find(([isMatch]) => {
        return isMatch(entry.name);
      });

      await renderToFile(
        resolve("pagesDir", entry.file),
        entry.name === "index"
          ? welcomePageTpl
          : customTemplate?.[1] || publicPageTpl,
        {
          defaults,
          route: entry,
          message: randomCongratMessage(),
          importPathmap: {
            styles: join(sourceFolder, "{react}/styles.module.css"),
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

  const generateIndexFiles = async (entries: Array<ResolvedEntry>) => {
    const routes = entries
      .flatMap(({ kind, entry }) => {
        return kind === "pageRoute"
          ? [
              {
                ...entry,
                path: join("/", pathFactory(entry.pathTokens)),
                paramsLiteral: entry.params.schema
                  .map((param) => render(paramTpl, { param }).trim())
                  .join(", "),
                meta: metaResolver(entry),
                importPathmap: {
                  page: join(sourceFolder, defaults.pagesDir, entry.importFile),
                },
              },
            ]
          : [];
      })
      .sort(sortRoutes);

    const context = {
      routes,
      shouldHydrate: JSON.stringify(ssrGenerator ? command === "build" : false),
      importPathmap: {
        config: join(sourceFolder, defaults.configDir),
        fetch: join(sourceFolder, defaults.fetchLibDir),
      },
    };

    for (const [file, template] of [
      ["{react}/index.ts", libReactIndexTpl],
      ["{react}/client.ts", libReactClientTpl],
      ["{react}/server.ts", libReactServerTpl],
      ["{react}/use.ts", libReactUseTpl],
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
        // React Router v7 uses the unnamed splat syntax * for catch-all routes
        return ["*"];
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
