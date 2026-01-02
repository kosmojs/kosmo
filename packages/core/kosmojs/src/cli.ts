#!/usr/bin/env -S node --enable-source-maps --no-warnings=ExperimentalWarning

import { parseArgs, styleText } from "node:util";

import {
  assertNoError,
  createProject,
  messageFactory,
  type Project,
  validateName,
} from "@kosmojs/cli";

const usage = [
  "",
  `🚀 ${styleText(["bold", "underline", "cyan"], "KosmoJS CLI")}`,
  "",
  styleText("bold", "BASIC USAGE"),
  "",
  `  ${styleText("blue", "npx kosmojs")} ${styleText("dim", "<name>")}`,
  "  Create a new Project with given name",
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

const { values, positionals } = parseArgs({
  options: {
    help: { type: "boolean", short: "h" },
    quiet: { type: "boolean", short: "q" },
  },
  allowPositionals: true,
  strict: true,
});

if (values.help) {
  printUsage();
  process.exit(0);
}

const cwd = process.cwd();

const [name] = positionals;

const messages = messageFactory(values.quiet ? () => {} : console.log);

try {
  assertNoError(() => validateName(name));

  const project: Project = {
    name: name as string,
  };

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
