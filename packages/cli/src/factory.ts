import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import {
  type BACKEND_FRAMEWORKS,
  DEFAULT_BACKEND,
  DEFAULT_BASE,
  DEFAULT_DIST,
  DEFAULT_FRAMEWORK,
  DEFAULT_PORT,
  defaults,
  type FRAMEWORKS,
  type GeneratorMeta,
} from "@kosmojs/core";
import {
  fetchGenerator,
  honoGenerator,
  koaGenerator,
  mdxGenerator,
  reactGenerator,
  solidGenerator,
  ssgGenerator,
  ssrGenerator,
  typeboxGenerator,
  vueGenerator,
} from "@kosmojs/dev";
import { pathExists, render, renderToFile } from "@kosmojs/lib";

import { copyFiles, type Project, type SourceFolder } from "./base";
import * as templates from "./templates";

/**
 * Read the installed package.json at runtime to get the actual version.
 * A static `import ... with { type: "json" }` would be inlined by the
 * bundler with the pre-bump version, defeating the point.
 *
 * INFO: For best compatibility, all packages should share the same version.
 * When bumping the version (even a patch) for a single package, bump it for all packages
 * to keep versions fully synchronized across the project.
 * */
const self = JSON.parse(
  readFileSync(
    createRequire(import.meta.url).resolve("@kosmojs/cli/package.json"),
    "utf-8",
  ),
);

const TPL_DIR = resolve(import.meta.dirname, "templates");

const SELF_VERSION = `^${self.version}`;

type FrameworkOptions = Partial<
  Record<
    keyof typeof FRAMEWORKS | keyof typeof BACKEND_FRAMEWORKS,
    Record<string, unknown>
  >
>;

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
  options?: FrameworkOptions,
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

  const framework = folder.framework || DEFAULT_FRAMEWORK;

  const [kosmoConfig, { generators }] = createKosmoConfig(folder, options);

  await writeFile(resolve(folderPath, "kosmo.config.ts"), kosmoConfig, "utf8");

  for (const file of [
    // stub files for initial build to pass;
    // generators will fill them with appropriate content.
    `${defaults.apiDir}/index/index.ts`,
    ...(["solid", "react"].includes(framework as never)
      ? [
          `${defaults.pagesDir}/index/index.tsx`,
          `${defaults.entryDir}/client.tsx`,
        ]
      : []),
    ...(["vue"].includes(framework as never)
      ? [
          `${defaults.pagesDir}/index/index.vue`,
          `${defaults.entryDir}/client.ts`,
        ]
      : []),
    ...(["mdx"].includes(framework as never)
      ? [
          `${defaults.pagesDir}/index/index.mdx`,
          `${defaults.entryDir}/client.tsx`,
        ]
      : []),
  ] as const) {
    await renderToFile(resolve(folderPath, file), "", {});
  }

  await writeFile(
    resolve(folderPath, "tsconfig.json"),
    JSON.stringify(
      { extends: `../../${defaults.libDir}/${folder.name}/tsconfig.base.json` },
      undefined,
      2,
    ),
    "utf8",
  );

  for (const generator of generators) {
    for (const key of ["dependencies", "devDependencies"] as const) {
      packageJson[key] = { ...packageJson[key], ...generator.meta[key] };
    }
  }

  await writeFile(packageFile, JSON.stringify(packageJson, undefined, 2));

  return folder;
};

export const createKosmoConfig = (
  folder: SourceFolder,
  options?: FrameworkOptions,
) => {
  const imports: Array<string> = [];

  const plugins: Array<{
    importDeclaration: string;
    importName: string;
    options: string;
  }> = [];

  const generators: Array<{
    name: string;
    options: string;
    meta: GeneratorMeta;
  }> = [];

  const {
    base = DEFAULT_BASE,
    framework = DEFAULT_FRAMEWORK,
    backend = DEFAULT_BACKEND,
  } = folder;

  const generatorOptions = options?.[(framework as never) || backend]
    ? JSON.stringify(options[(framework as never) || backend], undefined, 2)
    : "";

  if (framework === "solid") {
    plugins.push({
      importDeclaration: `import solidPlugin from "vite-plugin-solid";`,
      importName: "solidPlugin",
      options: folder.ssr ? "{ ssr: true }" : "",
    });

    generators.push({
      name: "solidGenerator",
      options: generatorOptions,
      meta: solidGenerator().meta,
    });
  } else if (framework === "react") {
    plugins.push({
      importDeclaration: `import reactPlugin from "@vitejs/plugin-react";`,
      importName: "reactPlugin",
      options: "",
    });

    generators.push({
      name: "reactGenerator",
      options: generatorOptions,
      meta: reactGenerator().meta,
    });
  } else if (framework === "vue") {
    plugins.push({
      importDeclaration: `import vuePlugin from "@vitejs/plugin-vue";`,
      importName: "vuePlugin",
      options: "",
    });

    generators.push({
      name: "vueGenerator",
      options: generatorOptions,
      meta: vueGenerator().meta,
    });
  } else if (framework === "mdx") {
    imports.push(
      ...[
        `import frontmatterPlugin from "remark-frontmatter";`,
        `import mdxFrontmatterPlugin from "remark-mdx-frontmatter";`,
      ],
    );

    generators.push({
      name: "mdxGenerator",
      options: generatorOptions.length
        ? generatorOptions
        : `{ remarkPlugins: [frontmatterPlugin, mdxFrontmatterPlugin] }`,
      meta: mdxGenerator().meta,
    });
  }

  if (backend === "koa") {
    generators.push({
      name: "koaGenerator",
      options: generatorOptions,
      meta: koaGenerator().meta,
    });
  } else if (backend === "hono") {
    generators.push({
      name: "honoGenerator",
      options: generatorOptions,
      meta: honoGenerator().meta,
    });
  }

  if (folder.ssr || folder.ssg) {
    generators.push({
      name: "ssrGenerator",
      options: "",
      meta: ssrGenerator().meta,
    });
  }

  if (folder.ssg) {
    generators.push({
      name: "ssgGenerator",
      options: "",
      meta: ssgGenerator().meta,
    });
  }

  if (generators.some(({ meta }) => meta.slot === "api")) {
    generators.push(
      {
        name: "fetchGenerator",
        options: "",
        meta: fetchGenerator().meta,
      },
      {
        name: "typeboxGenerator",
        options: "",
        meta: typeboxGenerator().meta,
      },
    );
  }

  const context = {
    base,
    plugins,
    imports,
    generators,
    frameworkSpecificOptions: [
      ...(framework === "solid"
        ? [`oxc: { jsx: { importSource: "solid-js" } }`]
        : []),
    ],
  };

  return [render(templates.kosmoConfig, context), { generators }] as const;
};
