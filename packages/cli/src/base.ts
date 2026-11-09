import { styleText } from "node:util";

import * as prompts from "@clack/prompts";
import { detect, resolveCommand } from "package-manager-detector";
import semver from "semver";

import {
  BACKENDS,
  type FolderConfig,
  FRONTENDS,
  type GeneratorSignature,
  type KosmoSettings,
} from "@kosmojs/core";
import {
  coreGenerator,
  fetchGenerator,
  h3Generator,
  honoGenerator,
  koaGenerator,
  mdxGenerator,
  reactGenerator,
  solidGenerator,
  ssgGenerator,
  ssrGenerator,
  svelteGenerator,
  typeboxGenerator,
  vitestGenerator,
  vueGenerator,
} from "@kosmojs/dev";
import { containsPathTraversalPatterns } from "@kosmojs/lib";

export const readAnswer = async <T>(input: Promise<T | symbol>) => {
  const value = await input;
  if (prompts.isCancel(value)) {
    prompts.cancel("Cancelled");
    process.exit(0);
  }
  return value;
};

export const printAnswer = (message: string, value: string) => {
  prompts.log.step(`${message}\n${styleText("dim", value)}`);
};

export const printMessage = (
  message: string,
  ttyLogger: "intro" | "note" | "outro",
) => {
  // biome-ignore lint: performance/noDynamicNamespaceImportAccess
  isTTY() ? prompts[ttyLogger](message) : console.log(message);
};

export { prompts };

export type PackageJSON = {
  kosmo?: KosmoSettings;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type FolderOptions = {
  name: string;
  frontend?: keyof typeof FRONTENDS | undefined;
  backend?: keyof typeof BACKENDS | undefined;
  sidecar?: boolean | undefined;
};

export const FOLDER_OPTIONS = {
  name: { type: "string" },
  frontend: { type: "string" },
  "no-frontend": { type: "boolean" },
  backend: { type: "string" },
  "no-backend": { type: "boolean" },
} as const;

type DependencyEntry = ["dependencies" | "devDependencies", string, string];

export const compareDependencies = (
  oldPackageJson: PackageJSON,
  newPackageJson: PackageJSON,
): Array<DependencyEntry> => {
  const newDependencies: Array<DependencyEntry> = [];

  for (const key of ["dependencies", "devDependencies"] as const) {
    for (const [pkg, ver] of Object.entries(newPackageJson[key] || {}) as Array<
      [string, string]
    >) {
      if (!oldPackageJson[key]?.[pkg]) {
        newDependencies.push([key, pkg, ver]);
      }
    }
  }

  return newDependencies;
};

export const isTTY = () => {
  return process.env.CI || !process.stdout.isTTY ? false : true;
};

export const assertFolderName = async (
  name: string | undefined,
): Promise<string> => {
  if (!name) {
    if (isTTY()) {
      const name = await readAnswer<string>(
        prompts.text({ message: "Folder Name", validate: validateName }),
      );
      return name as string;
    } else {
      assertNoError(() => "No folder name provided");
      throw new Error("Failed reading folder name");
    }
  } else {
    assertNoError(() => validateName(name, "No folder name provided"));
    return name;
  }
};

export const validateName = (
  name: string | undefined,
  emptyNameError: string = "No name provided",
) => {
  if (!name?.trim()) {
    return emptyNameError;
  }
  if (/[^\w.@$+-]/.test(name)) {
    return "May contain only alphanumerics or any of . - + $ @";
  }
  if (containsPathTraversalPatterns(name)) {
    return "Should not contain path traversal patterns";
  }
  if (name.startsWith("-")) {
    return "Should not start with a dash";
  }
  return undefined;
};

export const assertNoError = (validator: () => string | undefined) => {
  const error = validator();
  if (error) {
    throw new Error(`✗ ${styleText(["red", "underline"], "ERROR")}: ${error}`);
  }
};

export const resolveFolderGenerators = (
  options: FolderOptions,
  config: FolderConfig,
) => {
  const { frontend, backend } = options;

  const generators: Array<GeneratorSignature> = [
    // always present and always first
    coreGenerator(),
  ];

  if (frontend === "solid") {
    generators.push(solidGenerator());
  } else if (frontend === "react") {
    generators.push(reactGenerator());
  } else if (frontend === "vue") {
    generators.push(vueGenerator());
  } else if (frontend === "svelte") {
    generators.push(svelteGenerator());
  } else if (frontend === "mdx") {
    generators.push(mdxGenerator());
  } else if (frontend !== undefined) {
    throw new Error(`Unknown frontend: ${frontend}`);
  }

  if (backend === "hono") {
    generators.push(honoGenerator());
  } else if (backend === "h3") {
    generators.push(h3Generator());
  } else if (backend === "koa") {
    generators.push(koaGenerator());
  } else if (backend !== undefined) {
    throw new Error(`Unknown backend: ${backend}`);
  }

  if (frontend) {
    if (config?.frontend?.ssr !== false) {
      generators.push(ssrGenerator());
    }

    if (config?.frontend?.ssg !== false && config?.frontend?.ssr !== false) {
      generators.push(ssgGenerator());
    }
  }

  if (backend) {
    if (config?.fetch !== false) {
      generators.push(fetchGenerator());
    }

    if (config?.validation !== false) {
      generators.push(typeboxGenerator());
    }
  }

  if (config?.frontend?.test || config?.backend?.test) {
    generators.push(vitestGenerator());
    if (!generators.some((e) => e.meta.slot === "fetch")) {
      // backend testing implies fetch clients
      generators.push(fetchGenerator());
    }
  }

  return generators;
};

export const packageManager = async () => {
  const pm = await detect();
  return {
    name: pm?.name,
    command(command: "install" | "run", ...args: Array<string>) {
      const a = args.length ? ` ${args.join(" ")}` : "";
      const resolved = pm ? resolveCommand(pm.agent, command, args) : undefined;
      return resolved
        ? `${resolved.command} ${resolved.args.join(" ")}`.trim()
        : {
            install: [
              `npm install${a}`,
              `${styleText(["dim"], `# pnpm install${a} / yarn install${a}`)}`,
            ].join(" "),
            run: [
              `npm run${a}`,
              `${styleText(["dim"], `# pnpm dev${a} / yarn dev${a}`)}`,
            ].join(" "),
          }[command];
    },
  };
};

export const checkDependencies = async (
  packageJson: PackageJSON,
  generators: Array<GeneratorSignature>,
) => {
  const { dependencies = {}, devDependencies = {} } = packageJson;

  const missing: Array<[string, string, string]> = [];
  const outdated: Array<[string, string, string]> = [];

  const required = generators.flatMap((generator) => {
    return (["dependencies", "devDependencies"] as const).flatMap((key) => {
      return generator[key]
        ? Object.entries(
            typeof generator[key] === "function"
              ? (generator[key] as Function)(generator.options)
              : (generator[key] as object),
          ).flatMap(([name, v]) => {
            const minVersion = semver.minVersion(v as string)?.version;
            return minVersion ? [[name, minVersion, key]] : [];
          })
        : [];
    });
  });

  for (const [name, minVersion, key] of required) {
    const rawVersion = dependencies[name] || devDependencies[name];

    if (/^\w+:/.test(rawVersion)) {
      // ignore link:, file: etc.
      continue;
    }

    const version = rawVersion
      ? semver.minVersion(rawVersion)?.version
      : undefined;

    if (!rawVersion || !version) {
      missing.push([name, minVersion, key]);
    } else {
      if (semver.lt(version, minVersion)) {
        outdated.push([name, minVersion, key]);
      }
    }
  }

  if (missing.length) {
    console.error(
      styleText(
        ["red", "italic"],
        `There are ${missing.length} missing dependencies, please consider installing them.`,
      ),
    );
    for (const key of ["dependencies", "devDependencies"]) {
      const deps = missing.filter((e) => e[2] === key);
      if (deps.length) {
        console.error(
          `${key}: ${styleText(["blue"], deps.map(([name]) => name).join(" "))}`,
        );
      }
    }
  }

  if (outdated.length) {
    console.error(
      styleText(
        ["yellow", "italic"],
        `There are ${outdated.length} outdated dependencies, please consider updating them:`,
      ),
    );
    console.error(outdated.map(([name]) => name).join(" "));
    console.error();
  }
};

export const printUsage = () => {
  const usage = [
    "",
    `🚀 ${styleText(["bold", "underline", "cyan"], "KosmoJS CLI")}`,
    "",

    styleText("bold", "FOLDER COMMAND"),
    "",
    `  ${styleText("blue", "kosmo folder")}`,
    `  Create a Source Folder in interactive mode, prompting for each step`,
    "",
    styleText(
      "bold",
      "  Provide flags up front to create a Source Folder without prompts:",
    ),
    `  ${styleText("cyan", `--name`)} ${styleText("yellow", "folder name")} ${styleText("dim", "(required)")}`,
    `  ${styleText("cyan", `--frontend`)} ${styleText("yellow", Object.keys(FRONTENDS).join("|"))} ${styleText("dim", "(or --no-frontend for API-only folders)")}`,
    `  ${styleText("cyan", `--backend`)} ${styleText("yellow", Object.keys(BACKENDS).join("|"))} ${styleText("dim", "(or --no-backend for client-only folders)")}`,
    `  ${styleText("cyan", "--overwrite")} ${styleText("yellow", "overwrite existing files")} ${styleText("dim", "(use with caution)")}`,
    "",

    styleText("bold", "SIDECAR COMMAND"),
    "",
    `  ${styleText("blue", "kosmo sidecar")}`,
    `  Create a Sidecar Folder in interactive mode, prompting for each step`,
    "",
    styleText(
      "bold",
      "  Provide flags up front to create a Sidecar Folder without prompts:",
    ),
    `  ${styleText("cyan", `--name`)} ${styleText("yellow", "folder name")} ${styleText("dim", "(required)")}`,
    `  ${styleText("cyan", "--overwrite")} ${styleText("yellow", "overwrite existing files")} ${styleText("dim", "(use with caution)")}`,
    "",

    styleText("bold", "SERVE COMMAND"),
    "",
    `  ${styleText("blue", "kosmo serve")}`,
    `  Start dev server for all source folders`,
    "",
    `  ${styleText("blue", "kosmo serve")} ${styleText("magenta", "admin")}`,
    `  Start dev server for single source folder`,
    "",
    `  ${styleText("blue", "kosmo serve")} ${styleText("magenta", "admin front")}`,
    `  Start dev server for multiple source folders`,
    "",
    `  ${styleText("blue", "kosmo serve")} ${styleText("green", "--mode stage")}`,
    `  Start dev server using a custom mode (development by default on serve)`,
    "",

    styleText("bold", "PREVIEW COMMAND"),
    "",
    `  ${styleText("blue", "kosmo preview")}`,
    `  Build all source folders and serve the build output, rebuilding on change`,
    "",
    `  ${styleText("blue", "kosmo preview")} ${styleText("magenta", "admin front")}`,
    `  Preview selected source folders only`,
    "",
    `  ${styleText("blue", "kosmo preview")} ${styleText("green", "--mode stage")}`,
    `  Preview using a custom mode (production by default on preview)`,
    "",

    styleText("bold", "BUILD COMMAND"),
    "",
    `  ${styleText("blue", "kosmo build")}`,
    `  Build all source folders`,
    "",
    `  ${styleText("blue", "kosmo build")} ${styleText("magenta", "admin")}`,
    `  Build single source folder`,
    "",
    `  ${styleText("blue", "kosmo build")} ${styleText("magenta", "admin front")}`,
    `  Build multiple source folders`,
    "",
    `  ${styleText("blue", "kosmo build")} ${styleText("green", "--mode stage")}`,
    `  Build using a custom mode (production by default on build)`,
    "",

    styleText("bold", "TYPECHECK COMMAND"),
    "",
    `  ${styleText("blue", "kosmo typecheck")}`,
    `  Typecheck all source folders`,
    "",
    `  ${styleText("blue", "kosmo typecheck")} ${styleText("magenta", "admin")}`,
    `  Typecheck single source folder`,
    "",
    `  ${styleText("blue", "kosmo typecheck")} ${styleText("magenta", "admin front")}`,
    `  Typecheck multiple source folders`,
    "",
    `  ${styleText("blue", "kosmo typecheck")} ${styleText("magenta", ".")}`,
    `  Typecheck the project root only`,
    "",
    `  ${styleText("blue", "kosmo typecheck")} ${styleText("magenta", ". admin")}`,
    `  Typecheck the project root along with given folders`,
    "",

    styleText("bold", "COMMON OPTIONS"),
    "",
    `  ${styleText("cyan", "-h, --help")}`,
    `  Display this help message and exit`,
    "",
  ];

  for (const line of usage) {
    console.log(line);
  }
};
