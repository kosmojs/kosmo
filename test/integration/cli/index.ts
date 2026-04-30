import { resolve } from "node:path";

import { pnpmDir } from "..";

export * from "..";

export const pkgsDir = resolve(pnpmDir, "workspace");
