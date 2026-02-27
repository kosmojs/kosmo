import { styleText } from "node:util";

import picomatch, { type Matcher } from "picomatch";

import {
  type NestedRouteEntry,
  normalizeStaticValue,
  type PathToken,
  type PathTokenParamPart,
  type PathTokenStaticPart,
  type RouteEntry,
} from "@kosmojs/dev";

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
  const routeName = pathTokens.map((e) => e.orig).join("/");

  const staticValue = ({ value }: PathTokenStaticPart) => {
    return normalizeStaticValue(value);
  };

  const paramValue = (p: PathTokenParamPart) => {
    if (p.kind === "splat") {
      // React Router v7 uses the unnamed splat syntax * for catch-all routes
      return "*";
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

      if (!/\.\w+$/.test(token.orig)) {
        console.warn(
          `❗${styleText(["red", "bold"], "WARN")}: React Router v7 only supports dot-suffix mixed segments (e.g. :param.html).`,
        );
        console.warn(
          `  ${styleText(["magenta"], token.orig)} in ${styleText(["blue"], routeName)} route won't match as expected.`,
        );
        console.warn();
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

export const traverseFactory = (options: Options) => {
  const metaMatchers: Array<[Matcher, unknown]> = Object.entries({
    ...options.meta,
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
