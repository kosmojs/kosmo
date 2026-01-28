import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const setupFactory = (name, setup) => {
  return {
    extends: true,
    test: {
      name,
      hookTimeout: 60_000,
      include: [`packages/${name}/test/**/*.test.ts`],
      alias: {
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

      setupFactory("core/cli", {
        setupFiles: ["packages/core/cli/test/setup.ts"],
      }),

      setupFactory("core/dev"),

      setupFactory("core/fetch", {
        setupFiles: ["packages/core/fetch/test/setup.ts"],
        environment: "jsdom",
        globals: true,
      }),

      setupFactory("generators/koa-generator"),

      setupFactory("generators/openapi-generator", {
        globalSetup: [
          "packages/generators/openapi-generator/test/setup.global.ts",
        ],
      }),

      setupFactory("generators/typebox-generator", {
        globalSetup: [
          "packages/generators/typebox-generator/test/setup.global.ts",
        ],
        alias: {
          "~": resolve(
            import.meta.dirname,
            "packages/generators/typebox-generator/test/@fixtures/app",
          ),
          "@": resolve(
            import.meta.dirname,
            "packages/generators/typebox-generator/test/@fixtures/app/src",
          ),
          _: resolve(
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
        include: ["test/integration/api/*.test.ts"],
        provide: {
          API: "true",
        },
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
