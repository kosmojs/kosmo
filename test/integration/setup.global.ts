import { writeFile } from "node:fs/promises";

import { exec, pnpmDir, rootDir } from ".";

export default async () => {
  const { stdout } = await exec(
    "pnpm",
    ["-r", "pack", "--out", `${pnpmDir}/%s.tgz`, "--json"],
    { cwd: rootDir },
  );
  await writeFile(`${pnpmDir}/packages.json`, stdout);
};
