import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

// Workspace packages matching this are bundled into whichever package depends
// on them rather than externalized. Their own dependencies therefore have to
// be externalized in their place, and declared by the bundling package.
export const BUNDLED_RE = /^@kosmojs\/.+-generator$/;

const readManifest = async (dir) => {
  try {
    return JSON.parse(await readFile(resolve(dir, "package.json"), "utf8"));
  } catch {
    return undefined;
  }
};

const runtimeDepsOf = (manifest) => [
  ...Object.keys(manifest?.dependencies ?? {}),
  ...Object.keys(manifest?.peerDependencies ?? {}),
];

const allDepsOf = (manifest) => [
  ...runtimeDepsOf(manifest),
  ...Object.keys(manifest?.devDependencies ?? {}),
];

// pnpm owns the workspace definition, so ask pnpm rather than reading pnpm-workspace.yaml.
// Works from any package directory and stays correct through negations, catalogs etc.
const readWorkspace = async (cwd) => {
  const { stdout } = await exec(
    "pnpm",
    ["list", "--recursive", "--depth", "-1", "--json"],
    { cwd, maxBuffer: 32 * 1024 * 1024 },
  );

  const packages = new Map();

  for (const entry of JSON.parse(stdout)) {
    if (entry.name && entry.path) {
      packages.set(entry.name, entry.path);
    }
  }

  return packages;
};

export const resolveExternals = async ({ cwd }) => {
  const self = await readManifest(cwd);

  if (!self?.name) {
    throw new Error(`Could not read a named package.json in ${cwd}`);
  }

  const workspace = await readWorkspace(cwd);

  const bundled = new Set(
    [...workspace.keys()].filter((name) => BUNDLED_RE.test(name)),
  );

  const external = new Set(runtimeDepsOf(self));
  const required = new Set();
  const visited = new Set();

  // Walk the bundled packages reachable from this one. Anything they import
  // that is not itself bundled survives as a bare import in the output,
  // so it has to be externalized here and declared by this package.
  const walk = async (name) => {
    if (visited.has(name)) {
      return;
    }

    visited.add(name);

    const dir = workspace.get(name);
    const manifest = dir ? await readManifest(dir) : undefined;

    for (const dep of runtimeDepsOf(manifest)) {
      if (bundled.has(dep)) {
        await walk(dep);
      } else {
        external.add(dep);
        required.add(dep);
      }
    }
  };

  for (const dep of allDepsOf(self)) {
    if (bundled.has(dep)) {
      await walk(dep);
    }
  }

  const declared = new Set(runtimeDepsOf(self));

  return {
    self,
    bundled: [...bundled].sort(),
    external: [...external]
      .filter((name) => !bundled.has(name) && name !== self.name)
      .sort(),
    // Externals pulled in by bundled packages that this package fails to declare.
    missing: [...required].filter((name) => !declared.has(name)).sort(),
    // Bundled packages wrongly declared as runtime dependencies.
    misplaced: runtimeDepsOf(self)
      .filter((name) => bundled.has(name))
      .sort(),
  };
};
