#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import {
  assertNoError,
  createHTTPFolder,
  FOLDER_OPTIONS,
  isTTY,
  packageManager,
  printMessage,
  prompts,
  readAnswer,
  readFolderOptions,
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
  ` Create a project interactively, asking for name and frontend/backend:`,
  ` ${styleText("blue", "npm create kosmo")}`,
  "",
  " Create a project in current directory:",
  ` ${styleText("blue", "npm create kosmo .")}`,
  "",
  " Provide flags up front to skip interactive prompts:",
  ` ${styleText("blue", "npm create kosmo -- --name <name> ...")}`,
  "",
  " pnpm/yarn works without extra --",
  ` ${styleText("blue", "pnpm create kosmo --name <name> ...")}`,
  ` ${styleText("blue", "yarn create kosmo --name <name> ...")}`,
  "",
  " FLAGS:",
  `   ${styleText("cyan", `--name`)} ${styleText("yellow", "project name")} ${styleText("dim", "(ignored when using . to bootstrap in current directory)")}`,
  `   ${styleText("cyan", `--frontend`)} ${styleText("yellow", Object.keys(FRONTENDS).join("|"))} ${styleText("dim", "(or --no-frontend for API-only folders)")}`,
  `   ${styleText("cyan", `--backend`)} ${styleText("yellow", Object.keys(BACKENDS).join("|"))} ${styleText("dim", "(or --no-backend for client-only folders use)")}`,
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

  printMessage(
    styleText(["blue", "bold"], "› Preparing a new KosmoJS project"),
    "intro",
  );

  let name = positionals[0] === "." ? "." : values.name;

  if (!name) {
    if (isTTY()) {
      const answer = await readAnswer<string>(
        prompts.text({ message: "Project Name", validate: validateName }),
      );
      name = answer as string;
    } else {
      assertNoError(() => "No project name provided");
    }
  } else if (name !== ".") {
    assertNoError(() => validateName(name, "No project name provided"));
  }

  const folderOptions = await readFolderOptions("app", values);

  const root = resolve(process.cwd(), name as never);

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
      }
    } else {
      assertNoError(() => {
        return `${message}. Either remove dir contents or provide --overwrite flag`;
      });
    }
  }

  await createProject(root);

  await createHTTPFolder(root, folderOptions, {
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
      "✨ Well done! Your new project is ready to perform",
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
