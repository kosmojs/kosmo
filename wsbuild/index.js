import { execFile } from "node:child_process";
import { parseArgs, styleText } from "node:util";

import { glob } from "tinyglobby";
import { build } from "vite";
import { workspaceRoot } from "workspace-root";

import plugins from "../plugins/index.js";

const { values, positionals } = parseArgs({
  options: {
    scripts: {
      type: "string",
      default: ["@/scripts/"],
      multiple: true,
      short: "s",
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

const input = Object.fromEntries(
  positionals.map((p) => {
    return [p.replace(/^src\/|\.ts$/g, ""), p];
  }),
);

await build({
  configFile: false,
  appType: "custom",
  plugins,
  ssr: {
    external: true,
  },
  resolve: {
    tsconfigPaths: true,
    conditions: ["node"],
  },
  build: {
    ssr: true,
    target: "esnext",
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

for (const pattern of values.scripts.map(scriptPatternsMapper)) {
  const scripts = await glob(pattern, {
    onlyFiles: true,
    ignore: ["publish/*"],
  });

  for (const script of scripts) {
    await new Promise((resolve) => {
      console.log(styleText("blue", `› ${script}`));
      execFile("sh", [script], (error, stdout, stderr) => {
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
}
