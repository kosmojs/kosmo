import { join } from "node:path";

import picomatch, { type Matcher } from "picomatch";

import {
  type NestedRouteEntry,
  normalizeStaticValue,
  type PathToken,
  type PathTokenParamPart,
  type PathTokenStaticPart,
  type RouteEntry,
} from "@kosmojs/lib";

import type { Options } from "./types";

export type TransformedEntry = {
  name?: string;
  path: string;
  component?: string;
  children?: Array<TransformedEntry>;
  meta?: string | undefined;
};

export const pathFactory = (pathTokens: Array<PathToken>) => {
  const staticValue = ({ value }: PathTokenStaticPart) => {
    return normalizeStaticValue(value);
  };

  const paramValue = (p: PathTokenParamPart) => {
    if (p.kind === "splat") {
      return `:${p.name}(.*)?`;
    }
    if (p.kind === "optional") {
      return `:${p.name}?`;
    }
    return `:${p.name}`;
  };

  return pathTokens
    .flatMap((token) => {
      if (token.kind === "static") {
        return [staticValue(token.parts[0] as PathTokenStaticPart)];
      }

      if (token.kind === "param") {
        return [paramValue(token.parts[0] as PathTokenParamPart)];
      }

      return [
        token.parts
          .map((part) => {
            return part.type === "static"
              ? staticValue(part)
              : paramValue(part);
          })
          .join(""),
      ];
    })
    .join("/");
};

export const traverseFactory = (options?: Options | undefined) => {
  const metaMatchers: Array<[Matcher, unknown]> = Object.entries({
    ...options?.meta,
  }).map(([pattern, meta]) => [picomatch(pattern), meta]);

  const hasSplatParam = (token: PathToken | undefined) => {
    if (token?.kind === "param") {
      const param = token.parts[0] as PathTokenParamPart;
      return param?.kind === "splat";
    }
    return false;
  };

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

      const lastToken = pathTokens.at(-1);

      if (hasSplatParam(lastToken)) {
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
