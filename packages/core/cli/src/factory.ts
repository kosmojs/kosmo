import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * INFO: For best compatibility, all packages should share the same version.
 * When bumping the version (even a patch) for a single package, bump it for all packages
 * to keep versions fully synchronized across the project.
 * */
import self from "@kosmojs/cli/package.json" with { type: "json" };
import type { GeneratorBase } from "@kosmojs/core";
import {
  fetchGenerator,
  honoGenerator,
  koaGenerator,
  reactGenerator,
  solidGenerator,
  ssrGenerator,
  typeboxGenerator,
  vueGenerator,
} from "@kosmojs/dev";
import { defaults, pathExists, renderToFile } from "@kosmojs/lib";

import {
  copyFiles,
  DEFAULT_BACKEND,
  DEFAULT_BASE,
  DEFAULT_DIST,
  DEFAULT_FRAMEWORK,
  DEFAULT_PORT,
  type Project,
  type SourceFolder,
} from "./base";
import * as templates from "./templates";

const TPL_DIR = resolve(import.meta.dirname, "templates");

type Plugin = {
  importDeclaration: string;
  importName: string;
  options: string;
};

type Generator = {
  name: string;
  options: string;
  base: GeneratorBase;
};

const SELF_VERSION = `^${self.version}`;

export const createProject = async (
  path: string,
  project: Project,
  assets?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
) => {
  const packageJson = {
    type: "module",
    distDir: project.distDir || DEFAULT_DIST,
    devPort: project.devPort || DEFAULT_PORT,
    scripts: {
      dev: "kosmo serve",
      build: "kosmo build",
      "+folder": "kosmo folder",
    },
    dependencies: {
      "@kosmojs/core": SELF_VERSION,
      ...assets?.dependencies,
    },
    devDependencies: {
      "@kosmojs/cli": SELF_VERSION,
      "@kosmojs/dev": SELF_VERSION,
      "@types/node": self.devDependencies["@types/node"],
      tslib: self.devDependencies.tslib,
      typescript: self.devDependencies.typescript,
      vite: self.devDependencies.vite,
      ...assets?.devDependencies,
    },
  };

  const projectPath = resolve(path, project.name);

  if (await pathExists(projectPath)) {
    throw new Error(`${project.name} already exists`);
  }

  for (const [file, template] of [
    ["package.json", JSON.stringify(packageJson, undefined, 2)],
    [
      "tsconfig.json",
      JSON.stringify(
        { extends: `./${defaults.libDir}/tsconfig.base.json` },
        undefined,
        2,
      ),
    ],
  ]) {
    await renderToFile(resolve(projectPath, file), template, {
      defaults,
      distDir: project.distDir || DEFAULT_DIST,
    });
  }
};

export const createSourceFolder = async (
  projectRoot: string,
  folder: SourceFolder,
  opt?: {
    frameworkOptions?: Record<string, unknown>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
) => {
  const folderPath = resolve(projectRoot, defaults.srcDir, folder.name);

  if (await pathExists(folderPath)) {
    throw new Error(`${folder.name} already exists`);
  }

  await copyFiles(resolve(TPL_DIR, "src"), folderPath, {
    exclude: [/.+\.hbs/],
  });

  const packageFile = resolve(projectRoot, "package.json");

  // Using readFile instead of import() because reimporting returns
  // cached content, and adding a cache-busting query string causes
  // Vite's module runner to treat JSON as JavaScript, failing to parse
  const packageFileContent = await readFile(packageFile, "utf8");

  const packageJson = JSON.parse(packageFileContent);

  const { base = DEFAULT_BASE } = folder;

  const plugins: Array<Plugin> = [];

  const generators: Array<Generator> = [];

  const framework = folder.framework || DEFAULT_FRAMEWORK;
  const backendFramework = folder.backend || DEFAULT_BACKEND;

  if (framework === "solid") {
    plugins.push({
      importDeclaration: `import solidPlugin from "vite-plugin-solid";`,
      importName: "solidPlugin",
      options: folder.ssr ? "{ ssr: true }" : "",
    });

    generators.push({
      name: "solidGenerator",
      options: opt?.frameworkOptions
        ? JSON.stringify(opt.frameworkOptions, undefined, 2)
        : "",
      base: solidGenerator(),
    });
  } else if (framework === "react") {
    plugins.push({
      importDeclaration: `import reactPlugin from "@vitejs/plugin-react";`,
      importName: "reactPlugin",
      options: "",
    });

    generators.push({
      name: "reactGenerator",
      options: opt?.frameworkOptions
        ? JSON.stringify(opt.frameworkOptions, undefined, 2)
        : "",
      base: reactGenerator(),
    });
  } else if (framework === "vue") {
    plugins.push({
      importDeclaration: `import vuePlugin from "@vitejs/plugin-vue";`,
      importName: "vuePlugin",
      options: "",
    });

    generators.push({
      name: "vueGenerator",
      options: opt?.frameworkOptions
        ? JSON.stringify(opt.frameworkOptions, undefined, 2)
        : "",
      base: vueGenerator(),
    });

  }

  if (backendFramework === "koa") {
    generators.push({
      name: "koaGenerator",
      options: "",
      base: koaGenerator(),
    });
  } else if (backendFramework === "hono") {
    generators.push({
      name: "honoGenerator",
      options: "",
      base: honoGenerator(),
    });
  }

  if (folder.ssr) {
    generators.push({
      name: "ssrGenerator",
      options: "",
      base: ssrGenerator(),
    });
  }

  if (generators.some(({ base }) => base.meta.slot === "api")) {
    generators.push(
      ...[
        {
          name: "fetchGenerator",
          options: "",
          base: fetchGenerator(),
        },
        {
          name: "typeboxGenerator",
          options: "",
          base: typeboxGenerator(),
        },
      ],
    );
  }

  const context = {
    base,
    plugins,
    generators,
    frameworkSpecificOptions: [
      ...(framework === "solid"
        ? [`oxc: { jsx: { importSource: "solid-js" } }`]
        : []),
    ],
  };

  for (const [file, template] of [
    ["config/index.ts", templates.config],
    ["kosmo.config.ts", templates.kosmoConfig],
    // stub files for initial build to pass;
    // generators will fill them with appropriate content.
    [`${defaults.apiDir}/index/index.ts`, ""],
    ...(["solid", "react"].includes(framework as never)
      ? [
          [`${defaults.pagesDir}/index/index.tsx`, ""],
          [`${defaults.entryDir}/client.tsx`, ""],
        ]
      : []),
    ...(["vue"].includes(framework as never)
      ? [
          [`${defaults.pagesDir}/index/index.vue`, ""],
          [`${defaults.entryDir}/client.ts`, ""],
        ]
      : []),
  ]) {
    await renderToFile(resolve(folderPath, file), template, context);
  }

  await writeFile(
    resolve(folderPath, "tsconfig.json"),
    JSON.stringify(
      {
        extends: `../../${defaults.libDir}/${folder.name}/tsconfig.base.json`,
      },
      undefined,
      2,
    ),
    "utf8",
  );

  for (const generator of generators) {
    for (const key of ["dependencies", "devDependencies"] as const) {
      packageJson[key] = { ...packageJson[key], ...generator.base.meta[key] };
    }
  }

  for (const key of ["dependencies", "devDependencies"] as const) {
    packageJson[key] = { ...packageJson[key], ...opt?.[key] };
  }

  await writeFile(packageFile, JSON.stringify(packageJson, undefined, 2));

  return folder;
};
