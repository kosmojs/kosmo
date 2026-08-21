#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { parseArgs, styleText } from "node:util";

import * as prompts from "@clack/prompts";

import {
  assertNoError,
  createProject,
  type Project,
  validateName,
} from "@kosmojs/cli";

import { docsText, introText, nextStepsText, successText } from "./base";

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

// Session framing (intro / next steps / outro) renders only for
// interactive sessions not silenced by --quiet
const verbose = !name && !values.quiet;

// Resolve a clack prompt, exiting cleanly on ctrl-c / escape
const answer = async <T>(input: Promise<T | symbol>) => {
  const value = await input;
  if (prompts.isCancel(value)) {
    prompts.cancel("Cancelled");
    process.exit(0);
  }
  return value;
};

if (!name) {
  if (verbose) {
    prompts.intro(introText());
  }

  const validateName = (name: string | undefined) => {
    if (!name) {
      return "Invalid name provided";
    }
    if (/[^\w.@$+-]/.test(name)) {
      return "May contain only alphanumerics, hyphens, periods or any of @ $ +";
    }
    return undefined;
  };

  name = await answer(
    prompts.text({
      message: "Project Name",
      validate: validateName,
    }),
  );
}

try {
  assertNoError(() => validateName(name));

  const project: Project = {
    name: name as string,
  };

  await createProject(cwd, project);

  if (verbose) {
    prompts.log.success(successText());
    prompts.note(nextStepsText(project), "Next Steps");
    prompts.outro(docsText());
  }

  process.exit(0);
} catch (
  // biome-ignore lint: any
  error: any
) {
  console.error(error.message);
  process.exit(1);
}
