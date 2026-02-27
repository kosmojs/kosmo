import { rm } from "node:fs/promises";

import { appRoot } from ".";

const cleanup = () => rm(`${appRoot}/lib`, { force: true, recursive: true });

export default async () => {
  await cleanup();
  return cleanup;
};
