import { resolve } from "node:path";

import { createTsconfigPaths, renderToFile } from "@kosmojs/dev";

await renderToFile(
  resolve(import.meta.dirname, "tsconfig.vite.json"),
  JSON.stringify(
    {
      extends: "./tsconfig.base.json",
      compilerOptions: {
        allowImportingTsExtensions: true,
        noEmit: true,
        jsx: "preserve",
        types: ["vite/client"],
        paths: createTsconfigPaths("${configDir}"),
      },
    },
    null,
    2,
  ),
  {},
);

for (const [framework, jsxImportSource] of [
  ["react", "react"],
  ["solid", "solid-js"],
  ["vue", "vue"],
]) {
  await renderToFile(
    resolve(import.meta.dirname, `tsconfig.${framework}.json`),
    JSON.stringify(
      {
        extends: "./tsconfig.vite.json",
        compilerOptions: {
          jsxImportSource,
          paths: createTsconfigPaths("${configDir}/../.."),
        },
      },
      null,
      2,
    ),
    {},
  );
}
