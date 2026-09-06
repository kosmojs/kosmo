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
import { BACKENDS, FRONTENDS } from "@kosmojs/core";

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
  `   ${styleText("cyan", "--ssr")} ${styleText("dim", "enable server-side rendering (SSR)")}`,
  `   ${styleText("cyan", "--ssg")} ${styleText("dim", "enable static site generation (SSG); implies --ssr")}`,
  `   ${styleText("cyan", "--tsq")} ${styleText("dim", "enable TanStack Query")}`,
  `   ${styleText("cyan", "--overwrite")} ${styleText("dim", "overwrite existing files (use with caution)")}`,
  `   ${styleText("cyan", "-q, --quiet")} ${styleText("dim", "suppress all output (errors still shown)")}`,
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

const run = async () => {
  const { values, positionals } = parseArgs({
    options: {
      ...FOLDER_OPTIONS,
      overwrite: { type: "boolean" },
      quiet: { type: "boolean", short: "q" },
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

  const readyText = styleText(
    ["blue", "bold"],
    "› Ready to bootstrap a new KosmoJS project",
  );

  const doneText = styleText(
    ["green", "bold"],
    "✨ Well done! Your KosmoJS project is ready to perform",
  );

  const nextStepsText = [
    `${styleText(["blue"], "Next steps: install dependencies and start the dev server.")}`,
    styleText(
      ["dim"],
      "On first start it generates the remaining files and wires everything together.",
    ),
    "\n",
    ...(name === "." ? [] : [`$ cd ./${name}`, "\n"]),
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

  {
    const [name, base] = ["app", "/"];

    if (isCLI(Object.keys(values).length)) {
      // cli mode
      await createProject(root, project, { input: values });
      await createFolder(root, {
        name,
        base,
        input: values,
        intro: () => doneText,
        note: () => nextStepsText,
      });
    } else {
      // interactive mode
      await createProject(root, project);
      await createFolder(root, {
        name,
        base,
        intro: () => readyText,
        note: () => nextStepsText,
        outro: () => doneText,
      });
    }
  }
};

await run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
