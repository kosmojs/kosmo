import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { extract } from "tar";
import YAML from "yaml";

import { exec, installDependencies, pkgsDir, rootDir } from ".";

export default async () => {
  await rm(pkgsDir, { recursive: true, force: true });

  const { stdout } = await exec(
    "pnpm",
    ["-r", "pack", "--out", `${pkgsDir}/%s.tgz`, "--json"],
    { cwd: rootDir },
  );

  const pkgs: Array<{
    name: string;
    version: string;
    filename: string;
    files: Array<{ path: string }>;
  }> = JSON.parse(stdout as string);

  for (const { name, filename } of pkgs) {
    const cwd = join(dirname(filename), name);
    await mkdir(cwd, { recursive: true });
    await extract({
      cwd,
      file: filename,
      strip: 1,
    });
  }

  await writeFile(
    join(pkgsDir, "pnpm-workspace.yaml"),
    YAML.stringify({ packages: pkgs.map((e) => e.name) }),
  );

  await installDependencies(pkgsDir, ["--prod"]);
};
