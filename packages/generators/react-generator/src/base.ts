import picomatch, { type Matcher } from "picomatch";

import type { NestedRouteEntry, PathToken, RouteEntry } from "@kosmojs/dev";

import type { Options } from "./types";

export type TransformedEntry = {
  name?: string;
  path?: string;
  index?: true;
  component?: string;
  children?: Array<TransformedEntry>;
  meta?: string | undefined;
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

export const traverseFactory = (options: Options) => {
  const metaMatchers: Array<[Matcher, unknown]> = Object.entries({
    ...options.meta,
  }).map(([pattern, meta]) => [picomatch(pattern), meta]);

  const traverseEntries = (
    entries: Array<NestedRouteEntry>,
  ): Array<TransformedEntry> => {
    return entries.flatMap(({ index, layout, children }) => {
      const { name, pathTokens } = { ...index, ...layout } as RouteEntry;

      if (!pathTokens) {
        // this is unlikely to happen, but still...
        return [];
      }

      const layoutName = `${name}:layout`;
      const path = pathFactory(pathTokens);

      const metaMatch = metaMatchers.find(([isMatch]) => isMatch(name));
      const meta = metaMatch?.[1] ? JSON.stringify(metaMatch?.[1]) : undefined;

      if (pathTokens.at(-1)?.param?.isRest) {
        if (index && layout) {
          return [
            {
              name: layoutName,
              path,
              component: layout.id,
              children: [
                // no recursion here - splat params always goes last
                { name, path: "*", component: index.id },
              ],
              meta,
            },
          ];
        }

        if (index) {
          return [
            {
              // prefix-only entry, no name no component
              path,
              children: [
                { name, path: "*", component: index.id },
                ...traverseEntries(children),
              ],
              meta,
            },
          ];
        }

        if (layout) {
          return [
            {
              name: layoutName,
              path,
              component: layout.id,
              children: traverseEntries(children),
              meta,
            },
          ];
        }

        return [];
      }

      if (index && layout) {
        return [
          {
            name: layoutName,
            path,
            component: layout.id,
            children: [
              { name, index: true, component: index.id },
              ...traverseEntries(children),
            ],
            meta,
          },
        ];
      }

      if (index) {
        return [
          {
            // prefix-only entry, no name no component
            path,
            children: [
              { name, index: true, component: index.id },
              ...traverseEntries(children),
            ],
            meta,
          },
        ];
      }

      if (layout) {
        return [
          {
            name: layoutName,
            path,
            component: layout.id,
            children: traverseEntries(children),
            meta,
          },
        ];
      }

      return [];
    });
  };

  return traverseEntries;
};

export const randomCongratMessage = () => {
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
};
