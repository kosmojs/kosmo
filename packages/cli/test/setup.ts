import { rm } from "node:fs/promises";

import { afterEach } from "vitest";

afterEach(async (ctx) => {
  if (ctx.tempDir) {
    await rm(ctx.tempDir, { recursive: true, force: true });
  }
});
