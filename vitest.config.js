import { resolve } from "node:path";

import { glob } from "tinyglobby";
import { defineConfig } from "vitest/config";

import { defaults } from "@kosmojs/lib";

const setupFactory = (name, { alias, ...setup } = {}) => {
  return {
    extends: true,
    test: {
      name,
      hookTimeout: 90_000,
      include: [`packages/${name}/test/**/*.test.ts`],
      alias: {
        ...alias,
        "@src": resolve(import.meta.dirname, `packages/${name}/src`),
        "@test": resolve(import.meta.dirname, `packages/${name}/test`),
      },
      ...setup,
    },
  };
};

export default defineConfig({
  reporters: ["verbose"],
  test: {
    projects: [
      setupFactory("core/core", {
        setupFiles: ["packages/core/core/test/setup.ts"],
        globals: true,
      }),

      setupFactory("core/cli", {
        setupFiles: ["packages/core/cli/test/setup.ts"],
      }),

      setupFactory("core/lib"),

      setupFactory("generators/fetch-generator", {
        alias: {
          [defaults.appPrefix]: resolve(
            import.meta.dirname,
            "packages/generators/fetch-generator/test/@fixtures/app",
          ),
          [defaults.srcPrefix]: resolve(
            import.meta.dirname,
            "packages/generators/fetch-generator/test/@fixtures/app/src",
          ),
          [defaults.libPrefix]: resolve(
            import.meta.dirname,
            "packages/generators/fetch-generator/test/@fixtures/app/lib/src",
          ),
        },
        globalSetup: [
          "packages/generators/fetch-generator/test/setup.global.ts",
        ],
        setupFiles: ["packages/generators/fetch-generator/test/setup.ts"],
        globals: true,
      }),

      setupFactory("generators/koa-generator", {
        setupFiles: ["packages/generators/koa-generator/test/setup.ts"],
      }),

      setupFactory("generators/hono-generator", {
        setupFiles: ["packages/generators/hono-generator/test/setup.ts"],
      }),

      setupFactory("generators/openapi-generator", {
        testTimeout: 30_000,
        globalSetup: [
          "packages/generators/openapi-generator/test/setup.global.ts",
        ],
      }),

      setupFactory("generators/typebox-generator", {
        globalSetup: [
          "packages/generators/typebox-generator/test/setup.global.ts",
        ],
        alias: {
          [defaults.appPrefix]: resolve(
            import.meta.dirname,
            "packages/generators/typebox-generator/test/@fixtures/app",
          ),
          [defaults.srcPrefix]: resolve(
            import.meta.dirname,
            "packages/generators/typebox-generator/test/@fixtures/app/src",
          ),
          [defaults.libPrefix]: resolve(
            import.meta.dirname,
            "packages/generators/typebox-generator/test/@fixtures/app/lib/src",
          ),
        },
      }),

      setupFactory("generators/solid-generator"),
      setupFactory("generators/react-generator"),
      setupFactory("generators/vue-generator"),
      setupFactory("generators/ssr-generator"),

      setupFactory("integration:api", {
        include: ["test/integration/{koa,hono}/*.test.ts"],
      }),

      setupFactory("integration:csr", {
        include: ["test/integration/{react,solid,vue}/*.test.ts"],
        fileParallelism: false,
        provide: {
          CSR: "true",
        },
      }),

      setupFactory("integration:ssr", {
        include: ["test/integration/{react,solid,vue}/*.test.ts"],
        provide: {
          SSR: "true",
        },
      }),
    ],
  },
  plugins: [
    {
      name: "vite:load-templates",
      enforce: "pre",
      async resolveId(src) {
        if (src.startsWith("#templates/")) {
          const base = src.replace("#templates/", "src/templates/");
          const [path] = await glob(
            [
              // files with extension takes priority
              base,
              `${base}.{ts,tsx}`,
            ],
            {
              absolute: true,
              onlyFiles: true,
            },
          );
          if (path) {
            return `${path}?raw`;
          }
        }
      },
    },
  ],
});
