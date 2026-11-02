import { join } from "node:path";

import type {
  NestedRouteEntry,
  PathToken,
  PathTokenParamPart,
  PathTokenStaticPart,
  RouteEntry,
} from "@kosmojs/core";

export type TransformedEntry = {
  name?: string;
  path: string;
  component?: string;
  children?: Array<TransformedEntry>;
  // emitted as `strict: false` on the route record
  nonStrict?: boolean;
};

export const pathFactory = (pathTokens: Array<PathToken>) => {
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
        return [(token.parts[0] as PathTokenStaticPart).value];
      }

      if (token.kind === "param") {
        return [paramValue(token.parts[0] as PathTokenParamPart)];
      }

      return [
        token.parts
          .map((part): string => {
            return part.type === "static" ? part.value : paramValue(part);
          })
          .join(""),
      ];
    })
    .join("/");
};

export const traverseFactory = () => {
  // A top-level route made of optional params only (e.g. pages/{filter} -> "/:filter?")
  // compiles to an empty path when the params are absent,
  // and with the router-wide `strict: true` vue-router no longer matches it against "/".
  // Relax strictness for that route only (per-record option), so ranking of every other route stays strict.
  // Nested ones (e.g. "/blog/:category?") keep a static prefix and match fine.
  const isRootWithOptionalOnlyParams = (
    parent: string | undefined,
    pathTokens: Array<PathToken>,
  ) => {
    return parent // not root
      ? false
      : pathTokens.every((token) => {
          return token.kind === "param"
            ? token.parts.every((part) => {
                return part.type === "param" //
                  ? part.kind !== "required"
                  : false;
              })
            : false;
        });
  };

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

      const createLeaf = (entry: TransformedEntry) => {
        return {
          ...entry,
          nonStrict: isRootWithOptionalOnlyParams(parent, pathTokens),
        };
      };

      const layoutName = `${name}/layout`;

      const path = parent
        ? pathFactory(pathTokens)
        : join("/", pathFactory(pathTokens));

      const lastToken = pathTokens.at(-1);

      if (hasSplatParam(lastToken)) {
        if (index && layout) {
          return [
            createLeaf({
              name: layoutName,
              path,
              component: layout.id,
              children: [
                // no recursion here - splat params always goes last
                createLeaf({ name, path: "", component: index.id }),
              ],
            }),
          ];
        }

        if (index) {
          return [
            createLeaf({
              // prefix-only entry, no name no component
              path,
              children: [
                createLeaf({ name, path: "", component: index.id }),
                ...traverseEntries(children, name),
              ],
            }),
          ];
        }

        if (layout) {
          return [
            createLeaf({
              name: layoutName,
              path,
              component: layout.id,
              children: traverseEntries(children, name),
            }),
          ];
        }

        return [];
      }

      if (index && layout) {
        return [
          createLeaf({
            name: layoutName,
            path,
            component: layout.id,
            children: [
              createLeaf({ name, path: "", component: index.id }),
              ...traverseEntries(children, name),
            ],
          }),
        ];
      }

      if (index) {
        return [
          createLeaf({
            // prefix-only entry, no name no component
            path,
            children: [
              createLeaf({ name, path: "", component: index.id }),
              ...traverseEntries(children, name),
            ],
          }),
        ];
      }

      if (layout) {
        return [
          createLeaf({
            name: layoutName,
            path,
            component: layout.id,
            children: traverseEntries(children, name),
          }),
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
    "✨ Fantastic! Your new Vue route is good to go.",
    "🎯 Nailed it! A brand new Vue route just landed.",
    "💫 Awesome! Another Vue route joins the party.",
    "⚡ Lightning fast! A new Vue route created successfully.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};
