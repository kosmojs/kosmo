#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { parseArgs, styleText } from "node:util";

import prompts, { type PromptObject } from "prompts";

import {
  assertNoError,
  createProject,
  type Project,
  validateName,
} from "@kosmojs/cli";

import { messageFactory } from "./base";

const usage = [
  "",
  `🚀 ${styleText(["bold", "underline", "cyan"], "KosmoJS CLI")}`,
  "",
  styleText("bold", "BASIC USAGE"),
  "",
  `  ${styleText("blue", "npm create kosmo")}`,
  "  Create a new Project - interactive mode",
  "",
  `  ${styleText("blue", "npm create kosmo")} ${styleText("dim", "--name <name>")}`,
  "  Create a new Project - non-interactive mode",
  "",
  `  ${styleText("magenta", "-q, --quiet")}`,
  "  Suppress all output (errors still shown)",
  "",
  `  ${styleText("magenta", "-h, --help")}`,
  "  Display this help message and exit",
  "",
];

const printUsage = () => {
  for (const line of usage) {
    console.log(line);
  }
};

const { values } = parseArgs({
  options: {
    name: { type: "string", short: "n" },
    help: { type: "boolean", short: "h" },
    quiet: { type: "boolean", short: "q" },
  },
  strict: true,
});

if (values.help) {
  printUsage();
  process.exit(0);
}

const cwd = process.cwd();

let { name } = values;

const messages = messageFactory(name || values.quiet ? () => {} : console.log);

if (!name) {
  const onState: PromptObject["onState"] = (state) => {
    if (state.aborted) {
      process.nextTick(() => process.exit(1));
    }
  };

  const validateName = (name: string | undefined) => {
    if (!name) {
      return "Invalid name provided";
    }
    if (/[^\w.@$+-]/.test(name)) {
      return "May contain only alphanumerics, hyphens, periods or any of @ $ +";
    }
    return undefined;
  };

  const input = await prompts<"name">([
    {
      type: "text",
      name: "name",
      message: "Project Name",
      onState,
      validate: (name) => validateName(name) || true,
    },
  ]);

  name = input.name;
}

try {
  assertNoError(() => validateName(name));

  const project: Project = {
    name: name as string,
  };

  messages.preamble();

  await createProject(cwd, project);

  messages.projectCreated(project);

  process.exit(0);
} catch (
  // biome-ignore lint: any
  error: any
) {
  console.error(error.message);
  process.exit(1);
}
