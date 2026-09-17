import { styleText } from "node:util";

import * as prompts from "@clack/prompts";
import { detect, resolveCommand } from "package-manager-detector";
import semver from "semver";

import type {
  BACKENDS,
  DeepPartial,
  FolderConfig,
  FRONTENDS,
  GeneratorSignature,
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
  devPort?: number;
  previewPort?: number;
  distDir?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type Project = {
  name: string;
  distDir?: string;
  devPort?: number;
  previewPort?: number;
};

export type SourceFolder = {
  name: string;
  frontend?: keyof typeof FRONTENDS | undefined;
  backend?: keyof typeof BACKENDS | undefined;
  sidecar?: boolean | undefined;
};

export const FOLDER_OPTIONS = {
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
  folder: SourceFolder,
  folderConfig?: DeepPartial<FolderConfig>,
) => {
  const { frontend, backend } = folder;

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
    if (folderConfig?.frontend?.ssr !== false) {
      generators.push(ssrGenerator());
    }

    if (
      folderConfig?.frontend?.ssg !== false &&
      folderConfig?.frontend?.ssr !== false
    ) {
      generators.push(ssgGenerator());
    }
  }

  if (backend) {
    if (folderConfig?.fetch !== false) {
      generators.push(fetchGenerator());
    }
    if (folderConfig?.validation !== false) {
      generators.push(typeboxGenerator());
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
