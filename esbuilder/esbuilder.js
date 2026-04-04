import { execFile } from "node:child_process";
import { parseArgs, styleText } from "node:util";

import { build } from "esbuild";
import ora from "ora";
import { glob } from "tinyglobby";
import { workspaceRoot } from "workspace-root";

import pkg from "../package.json" with { type: "json" };

const nodeVersion =
  pkg.devEngines?.runtime?.name === "node" //
    ? pkg.devEngines.runtime.version
    : undefined;

if (!nodeVersion) {
  throw styleText("red", "Expected node runtime");
}

const target = `node${nodeVersion.split(".")[0].replace(/[^\d]/g, "")}`;

const { values, positionals } = parseArgs({
  options: {
    scripts: {
      type: "string",
      default: ["@/scripts/"],
      multiple: true,
      short: "s",
    },
    "external-exclude": {
      type: "string",
      multiple: true,
    },
  },
  allowPositionals: true,
});

const root = await workspaceRoot();

if (!root) {
  throw styleText("red", "Could not detect workspace root");
}

const scriptPatternsMapper = (pattern) => {
  if (pattern.startsWith("@/")) {
    pattern = pattern.replace("@", root);
  }

  if (pattern.endsWith("/")) {
    pattern = `${pattern}*`;
  }

  return pattern;
};

for (const pattern of values.scripts.map(scriptPatternsMapper)) {
  const scripts = await glob(pattern, {
    onlyFiles: true,
    ignore: ["publish/*"],
  });

  for (const script of scripts) {
    const text = root ? script.replace(root, "@") : script;
    const spinner = ora({ spinner: "dots2" }).start(text);

    await new Promise((resolve) => {
      // TODO: cross-platform support?
      const child = execFile("bash", [script], (error, stdout, stderr) => {
        if (error) {
          spinner.fail();
          console.error(styleText("red", error.message));
          console.log(stdout);
          console.error(stderr);
          process.exit(1);
        }

        if (stderr?.trim()) {
          spinner.text = `${spinner.text}\n${styleText("red", stderr)}`;
        }

        if (stdout?.trim()) {
          spinner.text = `${spinner.text}\n${styleText("cyan", stdout)}`;
        }
      });

      child.on("close", (code) => {
        if (spinner.text === text) {
          spinner.text = `${spinner.text}\n`;
        }
        spinner[code === 0 ? "succeed" : "warn"]();
        resolve(code);
      });
    });
  }
}

const spinner = ora().start(positionals.join("; "));

const plugins = [
  {
    // Resolves extensionless #templates/* imports to actual files.
    // Imports must omit the extension so TS matches the ambient
    // `declare module "#templates/*"` instead of treating it as a real module.
    name: "templateLoader",
    setup(build) {
      build.onResolve({ filter: /^#templates\// }, async (args) => {
        const base = args.path.replace("#templates/", "src/templates/");
        const [path] = await glob(
          [
            // files with extension takes priority
            base,
            `${base}.{ts,tsx}`,
          ],
          {
            absolute: true,
            onlyFiles: true,
          },
        );
        return { path };
      });
    },
  },
];

try {
  await build({
    bundle: true,
    platform: "node",
    plugins,
    target,
    format: "esm",
    packages: "external",
    sourcemap: "linked",
    logLevel: "error",
    entryPoints: positionals,
    outdir: "./pkg",
    legalComments: "inline",
  });
  spinner.succeed();
} catch (error) {
  spinner.fail();
  console.error(error);
  process.exit(1);
}
