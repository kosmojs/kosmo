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
        "#": "src",
      },
      ...(name.startsWith("integration:")
        ? {
            root: "./test",
            testTimeout: 10_000,
            hookTimeout: 180_000,
          }
        : {
            root: resolve(import.meta.dirname, name),
            include: ["test/**/*.test.ts"],
            testTimeout: 5_000,
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

      setupFactory("generators/hono-generator", {
        setupFiles: ["test/setup.ts"],
      }),

      setupFactory("generators/h3-generator", {
        setupFiles: ["test/setup.ts"],
      }),

      setupFactory("generators/koa-generator", {
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

      setupFactory("integration:cli", {
        include: ["integration/cli/*.test.ts"],
      }),

      setupFactory("integration:backend", {
        include: ["integration/{hono,h3,koa}/*.test.ts"],
        provide: {
          MODE: "backend",
        },
      }),

      setupFactory("integration:csr", {
        include: ["integration/{react,solid,vue,svelte,mdx}/*.test.ts"],
        exclude: ["integration/*/ssg.test.ts"],
        provide: {
          MODE: "csr",
        },
      }),

      setupFactory("integration:ssr", {
        include: ["integration/{react,solid,vue,svelte,mdx}/*.test.ts"],
        exclude: ["integration/*/ssg.test.ts"],
        provide: {
          MODE: "ssr",
        },
      }),

      setupFactory("integration:ssg", {
        include: ["integration/{react,solid,vue,svelte,mdx}/ssg.test.ts"],
        provide: {
          MODE: "ssg",
        },
      }),
    ],
  },
});
