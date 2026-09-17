import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { styleText } from "node:util";

import {
  BACKENDS,
  DEFAULT_DIST,
  type DeepPartial,
  defaults,
  type FolderConfig,
  FRONTENDS,
} from "@kosmojs/core";
import { formatCode, render, renderToFile } from "@kosmojs/lib";

import {
  assertNoError,
  isTTY,
  printAnswer,
  prompts,
  readAnswer,
  resolveFolderGenerators,
  type SourceFolder,
} from "./base";
import * as templates from "./templates";

export const prepareFolder = async (
  root: string,
  name: string,
  input: Partial<{ overwrite: boolean }> | undefined,
): Promise<SourceFolder> => {
  const srcDir = resolve(root, defaults.srcDir);

  await mkdir(srcDir, { recursive: true });
  const entries = await readdir(srcDir);

  if (entries.includes(name) && !input?.overwrite) {
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
    } else {
      assertNoError(() => {
        return `${message}. Either remove it or provide --overwrite flag.`;
      });
    }
  }

  return { name };
};

export const prepareSourceFolder = async (
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
): Promise<SourceFolder> => {
  const tty = isTTY();

  const folder = await prepareFolder(root, name, input);

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
      folder[key] = input[key] as never;
      if (tty) {
        printAnswer(message, folder[key]);
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

        folder[key] = answer as never;
      } else {
        // no value nor negation given, and no tty to ask, fail
        assertNoError(() => {
          return `${key} is required: either provide --${key} <name> or --no-${key} flag`;
        });
      }
    }
  }

  return folder;
};

export const createHTTPFolder = async (
  root: string,
  folder: SourceFolder,
  configPatch?: DeepPartial<FolderConfig>,
) => {
  const folderPath = resolve(root, defaults.srcDir, folder.name);

  await mkdir(folderPath, { recursive: true });

  const packageFile = resolve(root, "package.json");

  // Using readFile cause import() returns cached content
  const packageJson = JSON.parse(await readFile(packageFile, "utf8"));

  const { frontend, backend } = folder;

  const { frontend: frontendPatch = {} } = { ...configPatch };

  const config: DeepPartial<FolderConfig> = {
    ...(frontend
      ? {
          frontend: {
            ...frontendPatch,
            stack: frontend,
            base: frontendPatch.base || `/${folder.name}`,
            ssr: "ssr" in frontendPatch ? frontendPatch.ssr : true,
            ssg: "ssg" in frontendPatch ? frontendPatch.ssg : false,
            tanstack:
              "tanstack" in frontendPatch
                ? frontendPatch.tanstack
                : { query: false },
          },
        }
      : {}),
    ...(backend
      ? {
          backend: {
            ...configPatch?.backend,
            stack: backend,
            base: configPatch?.backend?.base || `/${folder.name}/api`,
          },
        }
      : {}),
    fetch: configPatch?.fetch === false || !backend || !frontend ? false : true,
    validation: configPatch?.validation === false || !backend ? false : true,
    typecheck: configPatch?.typecheck === false ? false : true,
  };

  const kosmoConfig = createKosmoConfig(folder, config);

  await writeFile(
    resolve(folderPath, "kosmo.config.ts"),
    await formatCode(kosmoConfig, "kosmo.config.ts"),
    "utf8",
  );

  const generators = resolveFolderGenerators(folder);

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

  await seedFolder(root, folder, config as never);
};

export const createSidecarFolder = async (
  root: string,
  sidecar: SourceFolder,
) => {
  const path = resolve(root, defaults.srcDir, sidecar.name);

  await mkdir(path, { recursive: true });

  const config = {
    sidecar: {
      entry: "./entry.ts",
      run: "./run.ts",
      serve: false,
    },
  };

  const kosmoConfig = createKosmoConfig(sidecar, config);

  await writeFile(
    resolve(path, "kosmo.config.ts"),
    await formatCode(kosmoConfig, "kosmo.config.ts"),
    "utf8",
  );

  await seedFolder(root, sidecar, config);
};

const seedFolder = async (
  root: string,
  folder: SourceFolder,
  config: FolderConfig,
) => {
  for (const generator of resolveFolderGenerators(folder)) {
    await generator
      .factory({
        root,
        name: folder.name,
        config,
        generators: [],
        distDir: DEFAULT_DIST,
      })
      .seed();
  }
};

const createKosmoConfig = (
  folder: SourceFolder,
  config: DeepPartial<FolderConfig>,
) => {
  const { frontend, backend, sidecar } = folder;

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
