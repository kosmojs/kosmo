import { defineConfig, mergeConfig } from "vitest/config";

import { loadConfig } from "@kosmojs/vitest";

export default defineConfig(
  mergeConfig(
    {
      // your config here
    },
    await loadConfig(),
  ),
);
