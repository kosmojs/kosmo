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
import { formatCode, pathResolver, render, renderToFile } from "@kosmojs/lib";

import {
  exitOnError,
  type FolderOptions,
  isTTY,
  printAnswer,
  prompts,
  readAnswer,
  resolveFolderGenerators,
} from "./base";
import * as templates from "./templates";

export const prepareSourceFolder = async (
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

  exitOnError(() => {
    return `${message}. Either remove it or provide --overwrite flag.`;
  });
};

export const readFolderOptions = async (
  name: string,
  input:
    | Partial<{
        frontend: string;
        backend: string;
        sidecar: boolean;
        overwrite: boolean;
      }>
    | undefined,
): Promise<FolderOptions> => {
  const tty = isTTY();

  const options: FolderOptions = { name };

  for (const [key, values] of [
    ["frontend", FRONTENDS],
    ["backend", BACKENDS],
  ] as const) {
    const message = key.replace(/^./, (e) => e.toUpperCase());

    if (input?.[key]) {
      // value given, validate it
      exitOnError(() => {
        return !Object.keys(values).includes(input[key] as never)
          ? `Invalid ${key}, use one of: ${Object.keys(values).join(", ")}`
          : undefined;
      });
      // value validated
      options[key] = input[key] as never;
      if (tty) {
        printAnswer(message, options[key]);
      }
    } else if (tty) {
      // no value given, ask for the value in the terminal

      const answer = await readAnswer(
        prompts.select({
          message,
          options: [
            ...Object.entries(values).map(([value, label]) => {
              return { value, label };
            }),
            { value: undefined, label: "None" },
          ],
        }),
      );

      options[key] = answer as never;
    }
  }

  {
    const message = "Add a Sidecar?";
    if ("sidecar" in { ...input }) {
      options.sidecar = input?.sidecar;
      if (tty) {
        printAnswer(message, options.sidecar ? "Yes" : "No");
      }
    } else if (tty) {
      const answer = await readAnswer(prompts.confirm({ message }));
      options.sidecar = answer as never;
    }
  }

  exitOnError(() => {
    const keys = ["frontend", "backend", "sidecar"] as const;
    return keys.some((e) => options[e])
      ? undefined
      : `Nothing to create: provide at least one of --${keys.join(", --")}`;
  });

  return options;
};

export const createSourceFolderConfig = (
  options: FolderOptions,
  {
    frontend: frontendPartial = {},
    backend: backendPartial = {},
    sidecar: sidecarPartial = {},
    ...configPartial
  }: DeepPartial<FolderConfig> = {},
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
    test: "test" in frontendPartial ? frontendPartial.test : false,
  };

  // backend options with default values
  const backend = {
    stack: options.backend as never,
    base: backendPartial.base || `/${options.name}/api`,
    test: "test" in backendPartial ? backendPartial.test : false,
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
    ...(options.sidecar
      ? {
          sidecar: {
            serve: "serve" in sidecarPartial ? sidecarPartial.serve : false,
            test: "test" in sidecarPartial ? sidecarPartial.test : false,
          },
        }
      : {}),
    fetch: !options.backend || !options.frontend ? false : true,
    validation: !options.backend ? false : true,
    typecheck: true,
    ...configPartial,
  };
};

export const createSourceFolder = async (
  root: string,
  options: FolderOptions,
  partialConfig?: DeepPartial<FolderConfig>,
) => {
  const folderPath = resolve(root, defaults.srcDir, options.name);

  await mkdir(folderPath, { recursive: true });

  const packageFile = resolve(root, "package.json");

  // Using readFile cause import() returns cached content
  const packageJson = JSON.parse(await readFile(packageFile, "utf8"));

  const config = createSourceFolderConfig(options, partialConfig);

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

  if (config.frontend) {
    await renderToFile(
      resolve(folderPath, "public/favicon.svg"),
      templates.favicon,
      {},
      { overwrite: false },
    );
  }

  await seedSourceFolder(root, options, config as never);
};

const seedSourceFolder = async (
  root: string,
  options: FolderOptions,
  config: FolderConfig,
) => {
  const generators = resolveFolderGenerators(options, config);

  const sourceFolder: SourceFolder = {
    name: options.name,
    config,
    generators,
    envSources: [],
  };

  const projectSettings: ProjectSettings = {
    root,
    mode: "development",
    sourceFolders: [sourceFolder],
    devHost: "",
    previewHost: "",
    distDir: "/dev/null",
  };

  const { createPath } = pathResolver(projectSettings, sourceFolder);

  if (config.frontend) {
    // create an empty index page, frontend generator will seed it accordingly
    const frontend =
      typeof config.frontend?.stack === "object"
        ? config.frontend.stack.name
        : config.frontend.stack;

    const ext = {
      react: "tsx",
      solid: "tsx",
      vue: "vue",
      svelte: "svelte",
      mdx: "mdx",
    }[frontend];

    await renderToFile(createPath.pages(`index/index.${ext}`), "", {});
  }

  if (config.backend) {
    // create an empty index route, backend generator will seed it accordingly
    await renderToFile(createPath.api("index/index.ts"), "", {});
  }

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
