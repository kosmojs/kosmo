import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

import { defaults } from "./packages/core/pkg/index.js";
import plugins from "./plugins/index.js";

const setupFactory = (name, { alias, ...setup } = {}) => {
  return {
    extends: true,
    test: {
      name,
      alias: {
        ...alias,
        "@src": "src",
        "@test": "test",
      },
      ...(name.startsWith("integration:")
        ? {
            root: "./test",
            hookTimeout: 180_000,
          }
        : {
            root: resolve(import.meta.dirname, name),
            include: ["test/**/*.test.ts"],
            hookTimeout: 60_000,
          }),
      ...setup,
    },
  };
};

export default defineConfig({
  plugins,
  reporters: ["verbose"],
  test: {
    projects: [
      setupFactory("packages/core", {
        setupFiles: ["test/setup.ts"],
        globals: true,
      }),

      setupFactory("packages/cli", {
        setupFiles: ["test/setup.ts"],
      }),

      setupFactory("packages/lib"),

      setupFactory("generators/fetch-generator", {
        alias: {
          [defaults.appPrefix]: "test/@fixtures/app",
          [defaults.srcPrefix]: "test/@fixtures/app/src",
          [defaults.libPrefix]: "test/@fixtures/app/lib/src",
        },
        globalSetup: ["test/setup.global.ts"],
        setupFiles: ["test/setup.ts"],
        globals: true,
      }),

      setupFactory("generators/koa-generator", {
        setupFiles: ["test/setup.ts"],
      }),

      setupFactory("generators/hono-generator", {
        setupFiles: ["test/setup.ts"],
      }),

      setupFactory("generators/openapi-generator", {
        testTimeout: 60_000,
        globalSetup: ["test/setup.global.ts"],
      }),

      setupFactory("generators/typebox-generator", {
        globalSetup: ["test/setup.global.ts"],
        alias: {
          [defaults.appPrefix]: "test/@fixtures/app",
          [defaults.srcPrefix]: "test/@fixtures/app/src",
          [defaults.libPrefix]: "test/@fixtures/app/lib/src",
        },
      }),

      setupFactory("generators/solid-generator"),
      setupFactory("generators/react-generator"),
      setupFactory("generators/vue-generator"),

      setupFactory("integration:api", {
        include: ["integration/{koa,hono}/*.test.ts"],
      }),

      setupFactory("integration:csr", {
        include: ["integration/{react,solid,vue,mdx}/*.test.ts"],
        fileParallelism: false,
        provide: {
          CSR: "true",
        },
      }),

      setupFactory("integration:ssr", {
        include: ["integration/{react,solid,vue,mdx}/*.test.ts"],
        provide: {
          SSR: "true",
        },
      }),

      setupFactory("integration:cli", {
        globalSetup: ["integration/cli/setup.global.ts"],
        include: ["integration/cli/*.test.ts"],
        testTimeout: 60_000,
      }),
    ],
  },
});
