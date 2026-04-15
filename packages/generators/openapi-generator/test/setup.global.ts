import { mkdir, rm, writeFile } from "node:fs/promises";

import { generateTsconfig } from "@kosmojs/lib";

import { appRoot, sourceFolder } from ".";

const cleanup = () => rm(`${appRoot}/lib`, { force: true, recursive: true });

export default async () => {
  await cleanup();
  const tsconfig = generateTsconfig(sourceFolder.name);

  await mkdir(`${appRoot}/lib/${sourceFolder.name}`, { recursive: true });

  await writeFile(
    `${appRoot}/lib/${sourceFolder.name}/tsconfig.base.json`,
    JSON.stringify(tsconfig),
    "utf8",
  );

  return cleanup;
};
