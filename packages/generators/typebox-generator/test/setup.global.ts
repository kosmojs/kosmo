import { rm } from "node:fs/promises";

import { routesFactory } from "@kosmojs/dev";

import { appRoot, resolvedOptions } from ".";

export default async () => {
  await rm(`${appRoot}/lib`, { force: true, recursive: true });

  const { resolvers } = await routesFactory(resolvedOptions);

  const resolvedRoutes = [];

  for (const { handler } of resolvers.values()) {
    resolvedRoutes.push(await handler());
  }

  for (const { factory } of resolvedOptions.generators) {
    const { build } = await factory(resolvedOptions);
    await build(resolvedRoutes);
  }

  return async () => {};
};
