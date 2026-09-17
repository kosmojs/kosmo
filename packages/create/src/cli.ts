#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { mkdir, readdir, rm } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import {
  assertNoError,
  createHTTPFolder,
  FOLDER_OPTIONS,
  isTTY,
  type Project,
  packageManager,
  prepareSourceFolder,
  printMessage,
  prompts,
  readAnswer,
  validateName,
} from "@kosmojs/cli";
import { BACKENDS, FRONTENDS } from "@kosmojs/core";

import { createProject } from "./factory";

const usage = [
  "",
  `🚀 ${styleText(["bold", "underline", "cyan"], "KosmoJS CLI")}`,
  "",
  styleText("bold", "BASIC USAGE"),
  "",
  ` ${styleText("blue", "npm create kosmo <name>")}`,
  ` Create a project at ${styleText("blue", "./<name>")} path ${styleText("dim", "(interactive mode)")}`,
  "",
  ` ${styleText("blue", "npm create kosmo .")}`,
  " Create a project in current folder",
  "",
  ` ${styleText("blue", "npm create kosmo <name> -- --frontend ...")}`,
  ` Create a project at ${styleText("blue", "./<name>")} path ${styleText("dim", "(CLI mode)")}`,
  "",
  ` ${styleText("blue", "npm create kosmo . -- --frontend ...")}`,
  ` Create a project in current folder`,
  "",
  " pnpm/yarn works without extra --",
  ` ${styleText("dim", "pnpm create kosmo . --frontend ...")}`,
  ` ${styleText("dim", "yarn create kosmo . --frontend ...")}`,
  "",
  " CLI mode arguments:",
  `   ${styleText("cyan", `--frontend`)} ${styleText("yellow", Object.keys(FRONTENDS).join("|"))} ${styleText("dim", "(--no-frontend for API-only folders)")}`,
  `   ${styleText("cyan", `--backend`)} ${styleText("yellow", Object.keys(BACKENDS).join("|"))} ${styleText("dim", "(--no-backend for client-only folders use)")}`,
  `   ${styleText("cyan", "--overwrite")} ${styleText("dim", "overwrite existing files (use with caution)")}`,
  "",
  ` ${styleText("blue", "-h, --help")}`,
  " Display this help message and exit",
  "",
  " The first Source Folder is always `app`, with pages at / and backend at /api",
  " Add more folders later with `kosmo folder`, or a standalone process with `kosmo sidecar`.",
  "",
];

const printUsage = () => {
  for (const line of usage) {
    console.log(line);
  }
};

const run = async () => {
  const { values, positionals } = parseArgs({
    options: {
      ...FOLDER_OPTIONS,
      overwrite: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: true,
  });

  if (values.help) {
    printUsage();
    return;
  }

  const [name] = positionals;

  if (name !== ".") {
    assertNoError(() => validateName(name, "No project name provided"));
  }

  const root = resolve(process.cwd(), name);

  const project: Project = {
    name: basename(root),
  };

  printMessage(
    styleText(["blue", "bold"], "› Preparing a new KosmoJS project"),
    "intro",
  );

  await mkdir(root, { recursive: true });

  const entries = await readdir(root);

  const exemptPatterns = [/^\.git/, /^readme/i, /^license/i];

  if (
    entries.some((e) => !exemptPatterns.some((r) => r.test(e))) &&
    !values?.overwrite
  ) {
    const path = name === "." ? "./" : `./${name}/`;
    const message = `${styleText(["blue", "bold"], path)} is not empty`;
    if (isTTY()) {
      const answer = await readAnswer<"remove" | "overwrite" | "cancel">(
        prompts.select({
          message,
          options: [
            { value: "remove", label: "Remove existing files" },
            {
              value: "overwrite",
              label: "Keep existing files, overwrite as needed",
            },
            { value: "cancel", label: "Cancel" },
          ],
        }),
      );
      if (answer === "remove") {
        for (const entry of entries) {
          if (!exemptPatterns.some((r) => r.test(entry))) {
            await rm(resolve(root, entry), { recursive: true });
          }
        }
      } else if (answer === "cancel") {
        prompts.cancel("Cancelled");
        process.exit(0);
      } else if (answer === "overwrite") {
        // do not passthrough overwrite option, let user decide what to do with existing folder, if any.
        // at the price of two consecutive prompts.
      }
    } else {
      assertNoError(() => {
        return `$message. Either remove dir contents or provide --overwrite flag`;
      });
    }
  }

  await createProject(root, project);

  const input = Object.keys(values).length ? values : undefined;
  const folder = await prepareSourceFolder(root, "app", input);

  await createHTTPFolder(root, folder, {
    frontend: { base: "/" },
    backend: { base: "/api" },
  });

  const pm = await packageManager();

  printMessage(
    [
      `${styleText(["blue"], "Next steps: install dependencies and start the dev server.")}`,
      styleText(
        ["dim"],
        "On first start remaining files are seeded and everything wired together.",
      ),
      "\n",
      ...(name === "." ? [] : [`cd ./${name}`, "\n"]),
      `📦 ${styleText(["blue", "bold"], "Install Dependencies")}`,
      pm.command("install"),
      "\n",
      `🚀 ${styleText(["blue", "bold"], "Start the dev server")}`,
      pm.command("run", "dev"),
      "\n",
      styleText(["dim"], "📘 Docs: https://kosmojs.dev"),
    ]
      .map((e) => e.trimEnd())
      .join("\n"),
    "note",
  );

  printMessage(
    styleText(
      ["green", "bold"],
      "✨ Well done! Your project is ready to perform",
    ),
    "outro",
  );
};

await run().catch((error) => {
  process.env.DEBUG?.includes("cli")
    ? console.error(error)
    : console.error(error.message);
  process.exit(1);
});
