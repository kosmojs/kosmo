import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

import { defaults } from "@kosmojs/core";

import plugins from "./plugins/index.js";

const setupFactory = (name, { alias, ...setup } = {}) => {
  return {
    extends: true,
    test: {
      name,
      root: name.startsWith("integration:")
        ? "."
        : resolve(import.meta.dirname, name),
      include: ["test/**/*.test.ts"],
      hookTimeout: name.startsWith("integration:") ? 180_000 : 60_000,
      alias: {
        ...alias,
        "@src": "src",
        "@test": "test",
      },
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
        include: ["test/integration/{koa,hono}/*.test.ts"],
      }),

      setupFactory("integration:csr", {
        include: ["test/integration/{react,solid,vue,mdx}/*.test.ts"],
        fileParallelism: false,
        provide: {
          CSR: "true",
        },
      }),

      setupFactory("integration:ssr", {
        include: ["test/integration/{react,solid,vue,mdx}/*.test.ts"],
        provide: {
          SSR: "true",
        },
      }),
    ],
  },
});
