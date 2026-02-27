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
  path: string;
  component?: string;
  children?: Array<TransformedEntry>;
  meta?: string | undefined;
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

  const hasOptionalParam = (token: PathToken | undefined) => {
    if (token?.kind === "param") {
      const param = token.parts[0] as PathTokenParamPart;
      return param?.kind === "optional" || hasSplatParam(token);
    }
    return false;
  };

  const traverseEntries = (
    entries: Array<NestedRouteEntry>,
  ): Array<TransformedEntry> => {
    return entries.flatMap(({ index, layout, children }) => {
      const { name, pathTokens } = { ...index, ...layout } as RouteEntry;

      const path = pathFactory(
        pathTokens.map((token, i) => {
          if (token.kind !== "param") {
            return token;
          }

          // force convert to required if:
          // - next token is optional/splat
          // - there is a children with an optional/splat param
          if (
            hasOptionalParam(pathTokens[i + 1]) ||
            children.some((e) => e.index?.pathTokens.some(hasOptionalParam))
          ) {
            return {
              ...token,
              parts: [
                {
                  ...token.parts[0],
                  kind: "required",
                },
              ],
            };
          }

          return token;
        }),
      );

      const metaMatch = metaMatchers.find(([isMatch]) => isMatch(name));
      const meta = metaMatch?.[1] ? JSON.stringify(metaMatch?.[1]) : undefined;

      const lastToken = pathTokens.at(-1);

      if (hasSplatParam(lastToken)) {
        const indexPath = pathFactory([lastToken as never]);

        if (index && layout) {
          return [
            {
              path,
              component: layout.id,
              children: [
                // no recursion here - splat params always goes last
                { path: indexPath, component: index.id },
              ],
              meta,
            },
          ];
        }

        if (index) {
          return [
            {
              // prefix-only entry, no component
              path,
              children: [
                { path: indexPath, component: index.id },
                ...traverseEntries(children),
              ],
              meta,
            },
          ];
        }

        if (layout) {
          return [
            {
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
            path,
            component: layout.id,
            children: [
              { path: "/", component: index.id },
              ...traverseEntries(children),
            ],
            meta,
          },
        ];
      }

      if (index) {
        return [
          {
            // prefix-only entry, no component
            path,
            children: [
              { path: "/", component: index.id },
              ...traverseEntries(children),
            ],
            meta,
          },
        ];
      }

      if (layout) {
        return [
          {
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

export const pathFactory = (pathTokens: Array<PathToken>) => {
  const routeName = pathTokens.map((e) => e.orig).join("/");

  const staticValue = ({ value }: PathTokenStaticPart) => {
    return normalizeStaticValue(value);
  };

  const paramValue = (p: PathTokenParamPart) => {
    if (p.kind === "splat") {
      return `*${p.name}`;
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

      if (token.parts.length) {
        console.warn(
          `❗${styleText(["red", "bold"], "WARN")}: At the moment Solid Router does not support mixed path segments.`,
        );
        console.warn(
          `  ${styleText(["magenta"], token.orig)} segment in ${styleText(["blue"], routeName)} route won't match as expected.`,
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

export const randomCongratMessage = () => {
  const messages = [
    "🎉 Well done! You just created a new Solid route.",
    "🚀 Success! A fresh Solid route is ready to roll.",
    "🌟 Nice work! Another Solid route added to your app.",
    "🧩 All set! A new Solid route has been scaffolded.",
    "🔧 Scaffold complete! Your new Solid route is in place.",
    "✅ Built! Your Solid route is scaffolded and ready.",
    "✨ Fantastic! Your new Solid route is good to go.",
    "🎯 Nailed it! A brand new Solid route just landed.",
    "💫 Awesome! Another Solid route joins the party.",
    "⚡ Lightning fast! A new Solid route created successfully.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};
