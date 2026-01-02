import { join } from "node:path";

import picomatch, { type Matcher } from "picomatch";

import type { NestedRouteEntry, PathToken, RouteEntry } from "@kosmojs/dev";

import type { Options } from "./types";

export type TransformedEntry = {
  name?: string;
  path: string;
  component?: string;
  children?: Array<TransformedEntry>;
  meta?: string | undefined;
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

export const traverseFactory = (options: Options) => {
  const metaMatchers: Array<[Matcher, unknown]> = Object.entries({
    ...options.meta,
  }).map(([pattern, meta]) => [picomatch(pattern), meta]);

  const traverseEntries = (
    entries: Array<NestedRouteEntry>,
    parent?: string | undefined,
  ): Array<TransformedEntry> => {
    return entries.flatMap(({ index, layout, children }) => {
      const { name, pathTokens } = { ...index, ...layout } as RouteEntry;

      if (!pathTokens) {
        // this is unlikely to happen, but still...
        return [];
      }

      const layoutName = `${name}:layout`;

      const path = parent
        ? pathFactory(pathTokens)
        : join("/", pathFactory(pathTokens));

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
                { name, path: "", component: index.id },
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
                { name, path: "", component: index.id },
                ...traverseEntries(children, name),
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
              children: traverseEntries(children, name),
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
              { name, path: "", component: index.id },
              ...traverseEntries(children, name),
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
              { name, path: "", component: index.id },
              ...traverseEntries(children, name),
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
            children: traverseEntries(children, name),
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
};
