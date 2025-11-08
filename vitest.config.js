import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const setupFactory = (name, setup) => {
  return {
    extends: true,
    test: {
      name,
      include: [`packages/${name}/test/**/*.test.ts`],
      alias: {
        "@/lib": resolve(
          import.meta.dirname,
          `packages/${name}/test/@fixtures/app/lib/`,
        ),
        "@/core": resolve(
          import.meta.dirname,
          `packages/${name}/test/@fixtures/app/core/`,
        ),
        "@test": resolve(import.meta.dirname, `packages/${name}/test`),
        // should go last
        "@": resolve(import.meta.dirname, `packages/${name}/src`),
      },
      ...setup,
    },
  };
};

export default defineConfig({
  reporters: ["verbose"],
  test: {
    projects: [
      setupFactory("core/api"),
      setupFactory("core/dev"),
      setupFactory("core/devlib"),
      setupFactory("core/fetch", {
        setupFiles: ["packages/core/fetch/test/setup.ts"],
        environment: "jsdom",
        globals: true,
      }),

      setupFactory("generators/api-generator"),
      setupFactory("generators/openapi-generator", {
        globalSetup: ["packages/generators/openapi-generator/test/setup.ts"],
      }),
      setupFactory("generators/typebox-generator", {
        globalSetup: ["packages/generators/typebox-generator/test/setup.ts"],
      }),
      setupFactory("generators/solid-generator"),
      setupFactory("generators/react-generator"),

      setupFactory("integration:csr", {
        include: ["test/integration/**/*.test.ts"],
        fileParallelism: false,
      }),
      setupFactory("integration:ssr", {
        include: ["test/integration/**/*.test.ts"],
        fileParallelism: false,
        provide: {
          SSR: "true",
        },
      }),
    ],
  },
  plugins: [
    {
      name: "vite:load-as-text",
      enforce: "pre",
      transform(src, id) {
        if (id.endsWith(".hbs") || id.endsWith("?as=text")) {
          return {
            code: `export default ${JSON.stringify(src)}`,
            map: null,
          };
        }
      },
    },
  ],
});
