import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import { build } from "vite";

import plugins from "../plugins/index.js";

const { values, positionals } = parseArgs({
  options: {
    scripts: {
      type: "string",
      default: ["lint", "typecheck", "typefix"],
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

for (const name of values.scripts) {
  const path = resolve(import.meta.dirname, `../scripts/${name}`);
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
