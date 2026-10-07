import { rm } from "node:fs/promises";

import { project } from ".";

const cleanup = async () => {
  await rm(`${project.root}/lib`, {
    force: true,
    recursive: true,
  });
};

export default async () => {
  await cleanup();
  return cleanup;
};
