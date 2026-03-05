import { rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { routesFactory } from "@kosmojs/dev";

import { appRoot, resolvedOptions } from ".";

const cleanup = () => rm(`${appRoot}/lib`, { force: true, recursive: true });

export default async () => {
  await cleanup();

  const { resolvers } = await routesFactory(resolvedOptions);

  const resolvedRoutes = [];

  for (const { handler } of resolvers.values()) {
    resolvedRoutes.push(await handler());
  }

  for (const { factory } of resolvedOptions.generators) {
    const { build } = await factory(resolvedOptions);
    await build(resolvedRoutes);
  }

  const routeNames = resolvedRoutes
    .flatMap(({ kind, entry }) => {
      return kind === "apiRoute" ? [entry.name] : [];
    })
    .sort();

  await writeFile(
    resolve(import.meta.dirname, "@fixtures/routes.ts"),
    `export type RouteName =\n  | ${routeNames.map((e) => JSON.stringify(e)).join("\n  | ")};`,
    "utf8",
  );

  return cleanup;
};
