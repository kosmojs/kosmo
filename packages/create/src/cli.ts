#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { basename, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

import {
  assertNoError,
  createFolder,
  createProject,
  FOLDER_OPTIONS,
  isCLI,
  type Project,
  validateName,
} from "@kosmojs/cli";
import { BACKENDS, FRAMEWORKS } from "@kosmojs/core";

const usage = [
  "",
  `🚀 ${styleText(["bold", "underline", "cyan"], "KosmoJS CLI")}`,
  "",
  styleText("bold", "BASIC USAGE"),
  "",
  ` ${styleText("blue", "npm create kosmo <name>")}`,
  ` Create a project in ${styleText("blue", "./<name>")} ${styleText("dim", "(interactive mode)")}`,
  "",
  ` ${styleText("blue", "npm create kosmo .")}`,
  " Create a project in current folder",
  "",
  ` ${styleText("blue", "npm create kosmo <name> -- --folder ...")}`,
  ` Create a project in ${styleText("blue", "./<name>")} ${styleText("dim", "(CLI mode)")}`,
  "",
  ` ${styleText("blue", "npm create kosmo . -- --folder ...")}`,
  ` Create a project in current folder`,
  "",
  " pnpm and yarn do not need an extra --",
  ` ${styleText("dim", "pnpm create kosmo . --folder ...")}`,
  ` ${styleText("dim", "yarn create kosmo . --folder ...")}`,
  "",
  " CLI mode arguments:",
  `   ${styleText("cyan", "--folder")} ${styleText("dim", "folder name, required")}`,
  `   ${styleText("cyan", "--base")} ${styleText("dim", "folder base, required")}`,
  `   ${styleText("cyan", `--framework`)} ${styleText("yellow", Object.keys(FRAMEWORKS).join("|"))} ${styleText("dim", "(omit for API-only folders)")}`,
  `   ${styleText("cyan", `--backend`)} ${styleText("yellow", Object.keys(BACKENDS).join("|"))} ${styleText("dim", "(omit for client-only folders)")}`,
  `   ${styleText("cyan", "--ssr")} ${styleText("dim", "enable SSR")}`,
  `   ${styleText("cyan", "--tsq")} ${styleText("dim", "enable TanStack Query")}`,
  `   ${styleText("cyan", "--overwrite")} ${styleText("dim", "overwrite existing files (use with caution)")}`,
  `   ${styleText("cyan", "--quiet")} ${styleText("dim", "suppress all output (errors still shown)")}`,
  "",
  ` ${styleText("blue", "-h, --help")}`,
  " Display this help message and exit",
  "",
];

const printUsage = () => {
  for (const line of usage) {
    console.log(line);
  }
};

const { values, positionals } = parseArgs({
  options: {
    ...FOLDER_OPTIONS,
    folder: { type: "string" },
    overwrite: { type: "boolean" },
    quiet: { type: "boolean", short: "q" },
    help: { type: "boolean", short: "h" },
  },
  strict: true,
  allowPositionals: true,
});

if (values.help) {
  printUsage();
  process.exit(0);
}

const run = async () => {
  const [name] = positionals;

  if (name !== ".") {
    assertNoError(() => validateName(name, "Please provide project name"));
  }

  const root = resolve(process.cwd(), name);

  const project: Project = {
    name: basename(root),
  };

  const readyText = styleText(
    ["blue", "bold"],
    "› Project ready, let's add a Source Folder",
  );

  const doneText = styleText(
    ["green", "bold"],
    "✨ Well done! Your KosmoJS project is scaffolded",
  );

  const nextStepsText = [
    `${styleText(["blue"], "Next steps: install dependencies and start the dev server.")}`,
    styleText(
      ["dim"],
      "On first start it generates the remaining files and wires everything together.",
    ),
    "\n",
    ...(name === "." ? [] : [`$ cd ./${project.name}`, "\n"]),
    `📦 ${styleText(["blue", "bold"], "Install Dependencies")}`,
    `$ npm install ${styleText(["dim"], "# pnpm install / yarn install")}`,
    "\n",
    `🚀 ${styleText(["blue", "bold"], "Start the dev server")}`,
    `$ npm run dev ${styleText(["dim"], "# pnpm dev / yarn dev")}`,
    "\n",
    styleText(["dim"], "📘 Docs: https://kosmojs.dev"),
  ]
    .map((e) => e.trimEnd())
    .join("\n");

  if (isCLI(values.folder)) {
    // cli mode

    await createProject(root, project, { input: values });

    const { folder, ...input } = values;

    if (folder) {
      await createFolder(root, {
        input: { ...input, name: folder } as never,
        intro: () => doneText,
        note: () => nextStepsText,
      });
    } else {
      console.log(nextStepsText);
    }
  } else {
    // interactive mode
    await createProject(root, project);
    await createFolder(root, {
      intro: () => readyText,
      note: () => nextStepsText,
      outro: () => doneText,
    });
  }
};

await run().catch((error) => {
  console.error(styleText("red", error.message));
  process.exit(1);
});
