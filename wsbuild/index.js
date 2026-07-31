import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import { build } from "vite";

import plugins from "../plugins/index.js";
import { BUNDLED_RE, resolveExternals } from "./externals.js";

const { values, positionals } = parseArgs({
  options: {
    scripts: {
      type: "string",
      default: ["lint", "typecheck"],
      multiple: true,
      short: "s",
    },
  },
  allowPositionals: true,
});

const root = resolve(import.meta.dirname, "..");

if (!root) {
  throw styleText("red", "Could not detect workspace root");
}

const input = Object.fromEntries(
  positionals.map((p) => {
    return [p.replace(/^src\/|\.ts$/g, ""), p];
  }),
);

const { self, external, missing, misplaced } = await resolveExternals({
  cwd: process.cwd(),
});

// Bundled packages are private and never published. Leaving them in
// `dependencies` makes the published manifest demand packages that are not on
// the registry, while pnpm rewrites `workspace:^` to a version that either
// does not exist or resolves to a stale copy alongside the bundled one.
if (misplaced.length) {
  console.error(
    styleText("red", `${self.name}: bundled packages declared as runtime deps`),
  );

  for (const name of misplaced) {
    console.error(styleText("red", `  - ${name}`));
  }

  console.error(
    "Move them to devDependencies: the workspace still links them for the build, but consumers never install them.",
  );

  process.exit(1);
}

// Anything a bundled package imports survives as a bare import in this package's output.
// If this package does not declare it, consumers cannot resolve it at runtime -
// which no build-time check would otherwise catch.
if (missing.length) {
  console.error(
    styleText(
      "red",
      `${self.name}: bundled packages import undeclared externals`,
    ),
  );

  for (const name of missing) {
    console.error(styleText("red", `  - ${name}`));
  }

  console.error(
    "Add them to dependencies, otherwise the published package fails to resolve them at runtime.",
  );

  process.exit(1);
}

await build({
  configFile: false,
  appType: "custom",
  plugins,
  ssr: {
    // An explicit list rather than `true`.
    // Vite only treats `external: true` as a hint:
    // it still runs the id through tryNodeResolve,
    // and during a build the importer is discarded,
    // so resolution happens from this package's root only.
    // Under pnpm's strict layout a bundled generator's own dependency
    // is not resolvable from here, resolution fails, and it gets inlined.
    // Naming the package outright short-circuits that check entirely.
    external,
    noExternal: BUNDLED_RE,
  },
  resolve: {
    tsconfigPaths: true,
    conditions: ["node"],
  },
  build: {
    target: "esnext",
    ssr: true,
    minify: true,
    sourcemap: true,
    emptyOutDir: true,
    rolldownOptions: {
      input,
      output: {
        dir: "./pkg",
        format: "esm",
        entryFileNames: "[name].js",
      },
    },
  },
});

for (const name of values.scripts) {
  const path = resolve(import.meta.dirname, `../scripts/build/${name}`);
  await new Promise((resolve) => {
    console.log(styleText("blue", `› ${name}`));
    execFile("sh", [path], (error, stdout, stderr) => {
      if (error) {
        console.error(styleText("red", error.message));
        console.log(stdout);
        console.error(stderr);
        process.exit(1);
      }

      if (stderr?.trim()) {
        console.error(stderr);
      }

      if (stdout?.trim()) {
        console.log(stdout);
      }
    }).on("close", resolve);
  });
}
