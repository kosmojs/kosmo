import { rm } from "node:fs/promises";

import { appRoot } from ".";

export default async () => {
  await rm(`${appRoot}/lib`, { force: true, recursive: true });
  return async () => {};
};
