import picomatch, { type Matcher } from "picomatch";

import type { NestedRouteEntry, PathToken, RouteEntry } from "@kosmojs/dev";

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

  const traverseEntries = (
    entries: Array<NestedRouteEntry>,
  ): Array<TransformedEntry> => {
    return entries.flatMap(({ index, layout, children }) => {
      const { name, pathTokens } = { ...index, ...layout } as RouteEntry;

      if (!pathTokens) {
        // this is unlikely to happen, but still...
        return [];
      }

      const path = pathFactory(
        pathTokens.map((token, i) => {
          if (!token.param) {
            return token;
          }

          // not optional if:
          // - next token is optional/rest
          // - there is a children with an optional/rest param
          let isOptional = true;

          if (
            pathTokens[i + 1]?.param?.isOptional ||
            pathTokens[i + 1]?.param?.isRest
          ) {
            isOptional = false;
          } else if (
            children.some(({ index }) => {
              return index?.pathTokens.some(
                ({ param }) => param?.isOptional || param?.isRest,
              );
            })
          ) {
            isOptional = false;
          }

          return {
            ...token,
            param: {
              ...token.param,
              isOptional,
            },
          };
        }),
      );

      const metaMatch = metaMatchers.find(([isMatch]) => isMatch(name));
      const meta = metaMatch?.[1] ? JSON.stringify(metaMatch?.[1]) : undefined;

      if (pathTokens.at(-1)?.param?.isRest) {
        const indexPath = pathFactory([pathTokens.at(-1) as PathToken]);

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
  return pathTokens
    .flatMap(({ path, param }) => {
      if (param?.isRest) {
        return [`*${param.name}`];
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
