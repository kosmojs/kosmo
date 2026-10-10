import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { styleText } from "node:util";

import {
  BACKENDS,
  type DeepPartial,
  defaults,
  type FolderConfig,
  FRONTENDS,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";
import { formatCode, render, renderToFile } from "@kosmojs/lib";

import {
  assertNoError,
  type FolderOptions,
  isTTY,
  printAnswer,
  prompts,
  readAnswer,
  resolveFolderGenerators,
} from "./base";
import * as templates from "./templates";

export const prepareFolder = async (
  root: string,
  name: string,
  input: Partial<{ overwrite: boolean }> | undefined,
) => {
  const srcDir = resolve(root, defaults.srcDir);

  await mkdir(srcDir, { recursive: true });
  const entries = await readdir(srcDir);

  if (!entries.includes(name) || input?.overwrite) {
    return;
  }

  const path = `./${defaults.srcDir}/${name}/`;
  const message = `${styleText(["blue", "bold"], path)} already exists`;

  if (isTTY()) {
    const answer = await readAnswer<"remove" | "overwrite" | "cancel">(
      prompts.select({
        message,
        options: [
          { value: "remove", label: "Remove existing files" },
          { value: "overwrite", label: "Overwrite existing files" },
          { value: "cancel", label: "Cancel" },
        ],
      }),
    );

    if (answer === "remove") {
      await rm(resolve(srcDir, name), { recursive: true });
    } else if (answer === "cancel") {
      prompts.cancel("Cancelled");
      process.exit(0);
    }

    return;
  }

  assertNoError(() => {
    return `${message}. Either remove it or provide --overwrite flag.`;
  });
};

export const readFolderOptions = async (
  root: string,
  name: string,
  input:
    | Partial<{
        frontend: string;
        "no-frontend": boolean;
        backend: string;
        "no-backend": boolean;
        overwrite: boolean;
      }>
    | undefined,
): Promise<FolderOptions> => {
  const tty = isTTY();

  await prepareFolder(root, name, input);

  const options: FolderOptions = { name };

  for (const [key, values] of [
    ["frontend", FRONTENDS],
    ["backend", BACKENDS],
  ] as const) {
    if (input?.[key] && input?.[`no-${key}`]) {
      // both value and negation given, fail
      assertNoError(() => {
        return `--${key} and --no-${key} are mutually exclusive; use only one`;
      });
    }

    const message = key.replace(/^./, (e) => e.toUpperCase());

    if (input?.[key]) {
      // value given, validate it
      assertNoError(() => {
        return !Object.keys(values).includes(input[key] as never)
          ? `Invalid ${key}, use one of: ${Object.keys(values).join(", ")}`
          : undefined;
      });
      // value validated
      options[key] = input[key] as never;
      if (tty) {
        printAnswer(message, options[key]);
      }
    } else if (input?.[`no-${key}`]) {
      if (tty) {
        printAnswer(message, "none");
      }
    } else {
      if (tty) {
        // no value nor negation given, ask for the value

        const answer = await readAnswer(
          prompts.select({
            message,
            options: [
              ...Object.entries(values).map(([value, label]) => {
                return { value, label };
              }),
              { value: undefined, label: "none" },
            ],
          }),
        );

        options[key] = answer as never;
      } else {
        // no value nor negation given, and no tty to ask, fail
        assertNoError(() => {
          return `${key} is required: either provide --${key} <name> or --no-${key} flag`;
        });
      }
    }
  }

  return options;
};

export const httpFolderConfig = (
  options: FolderOptions,
  {
    frontend: frontendPartial = {},
    backend: backendPartial = {},
    ...configPartial
  }: DeepPartial<Omit<FolderConfig, "sidecar">> = {},
): FolderConfig => {
  // frontend options with default values
  const frontend = {
    stack: options.frontend as never,
    base: frontendPartial?.base || `/${options.name}`,
    ssr: "ssr" in frontendPartial ? frontendPartial.ssr : true,
    ssg: "ssg" in frontendPartial ? frontendPartial.ssg : false,
    tanstack:
      "tanstack" in frontendPartial
        ? frontendPartial.tanstack
        : { query: false },
    test: "test" in frontendPartial ? frontendPartial.test : true,
  };

  // backend options with default values
  const backend = {
    stack: options.backend as never,
    base: backendPartial.base || `/${options.name}/api`,
    test: "test" in backendPartial ? backendPartial.test : true,
  };

  return {
    ...(options.frontend
      ? {
          frontend: {
            ...frontend,
            ...Object.fromEntries(
              Object.entries(frontendPartial).flatMap(([k, v]) => {
                return k in frontend ? [] : [[k, v]];
              }),
            ),
          },
        }
      : {}),
    ...(options.backend
      ? {
          backend: {
            ...backend,
            ...Object.fromEntries(
              Object.entries(backendPartial).flatMap(([k, v]) => {
                return k in backend ? [] : [[k, v]];
              }),
            ),
          },
        }
      : {}),
    fetch: !options.backend || !options.frontend ? false : true,
    validation: !options.backend ? false : true,
    typecheck: true,
    ...configPartial,
  };
};

export const createHTTPFolder = async (
  root: string,
  options: FolderOptions,
  partialConfig?: DeepPartial<FolderConfig>,
) => {
  const folderPath = resolve(root, defaults.srcDir, options.name);

  await mkdir(folderPath, { recursive: true });

  const packageFile = resolve(root, "package.json");

  // Using readFile cause import() returns cached content
  const packageJson = JSON.parse(await readFile(packageFile, "utf8"));

  const config = httpFolderConfig(options, partialConfig);

  const kosmoConfig = createKosmoConfig(options, config);

  await writeFile(
    resolve(folderPath, "kosmo.config.ts"),
    await formatCode(kosmoConfig, "kosmo.config.ts"),
    "utf8",
  );

  const generators = resolveFolderGenerators(options, config);

  for (const generator of generators) {
    for (const key of ["dependencies", "devDependencies"] as const) {
      packageJson[key] = {
        ...packageJson[key],
        ...(typeof generator[key] === "function"
          ? generator[key](config)
          : generator[key]),
      };
    }
  }

  await writeFile(packageFile, JSON.stringify(packageJson, undefined, 2));

  await renderToFile(
    resolve(folderPath, "public/favicon.svg"),
    templates.favicon,
    {},
    { overwrite: false },
  );

  await seedFolder(root, options, config as never);
};

export const createSidecarFolder = async (
  root: string,
  options: FolderOptions,
) => {
  const path = resolve(root, defaults.srcDir, options.name);

  await mkdir(path, { recursive: true });

  const config = {
    sidecar: {
      entry: "./entry.ts",
      run: "./run.ts",
      serve: false,
    },
  };

  const kosmoConfig = createKosmoConfig(options, config);

  await writeFile(
    resolve(path, "kosmo.config.ts"),
    await formatCode(kosmoConfig, "kosmo.config.ts"),
    "utf8",
  );

  await seedFolder(root, options, config);
};

const seedFolder = async (
  root: string,
  options: FolderOptions,
  config: FolderConfig,
) => {
  const generators = resolveFolderGenerators(options, config);

  const sourceFolder: SourceFolder = {
    name: options.name,
    config,
    generators,
  };

  const projectSettings: ProjectSettings = {
    root,
    sourceFolders: [sourceFolder],
    devHost: "",
    previewHost: "",
    distDir: "/dev/null",
  };

  for (const generator of generators) {
    await generator.factory(projectSettings, sourceFolder).seed();
  }
};

const createKosmoConfig = (options: FolderOptions, config: FolderConfig) => {
  const { frontend, backend, sidecar } = options;

  const context = {
    frontend,
    backend,
    sidecar,
    config: Object.fromEntries(
      Object.entries(config).map(([key, val]) => [
        key,
        Object.prototype.toString.call(val) === "[object Object]"
          ? Object.fromEntries(
              Object.entries(val).map(([key, val]) => [
                key,
                JSON.stringify(val),
              ]),
            )
          : JSON.stringify(val),
      ]),
    ),
  };

  return render(templates.kosmoConfig, context);
};
