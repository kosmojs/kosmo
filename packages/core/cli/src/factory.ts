import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * INFO: For best compatibility, all packages should share the same version.
 * When bumping the version (even a patch) for a single package, bump it for all packages
 * to keep versions fully synchronized across the project.
 * */
import self from "@kosmojs/cli/package.json" with { type: "json" };
import { defaults, renderToFile } from "@kosmojs/dev";

import {
  copyFiles,
  DEFAULT_BACKEND,
  DEFAULT_BASE,
  DEFAULT_DIST,
  DEFAULT_FRAMEWORK,
  DEFAULT_PORT,
  NODE_VERSION,
  type Project,
  pathExists,
  type SourceFolder,
} from "./base";

import srcConfigTpl from "./templates/src/config/index.hbs";
import srcViteConfigTpl from "./templates/src/vite.config.hbs";
import viteBaseTpl from "./templates/vite.base.hbs";

const TPL_DIR = resolve(import.meta.dirname, "templates");

type Plugin = {
  importDeclaration: string;
  importName: string;
  options: string;
};

type Generator = {
  name: string;
  options: string;
};

const tsconfigJson = {
  extends: "@kosmojs/config/tsconfig.vite.json",
};

const SELF_VERSION = `^${self.version}`;

export const createProject = async (
  path: string,
  project: Project,
  assets?: {
    NODE_VERSION?: `${number}`;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
) => {
  const packageJson = {
    type: "module",
    distDir: project.distDir || DEFAULT_DIST,
    scripts: {
      dev: "kosmo dev",
      build: "kosmo build",
      "+folder": "kosmo folder",
    },
    dependencies: {
      "@kosmojs/api": SELF_VERSION,
      "@kosmojs/fetch": SELF_VERSION,
      typebox: self.devDependencies.typebox,
      ...assets?.dependencies,
    },
    devDependencies: {
      "@kosmojs/config": SELF_VERSION,
      "@kosmojs/cli": SELF_VERSION,
      "@kosmojs/dev": SELF_VERSION,
      "@kosmojs/generators": SELF_VERSION,
      "@types/node": self.devDependencies["@types/node"],
      esbuild: self.devDependencies.esbuild,
      tslib: self.devDependencies.tslib,
      typescript: self.devDependencies.typescript,
      vite: self.devDependencies.vite,
      ...assets?.devDependencies,
    },
    pnpm: {
      onlyBuiltDependencies: ["esbuild"],
    },
  };

  const esbuildJson = {
    bundle: true,
    platform: "node",
    target: `node${assets?.NODE_VERSION || NODE_VERSION}`,
    format: "esm",
    packages: "external",
    sourcemap: "linked",
    logLevel: "info",
  };

  const projectPath = resolve(path, project.name);

  if (await pathExists(projectPath)) {
    throw new Error(`${project.name} already exists`);
  }

  await copyFiles(TPL_DIR, projectPath, {
    exclude: [/src/, /.+\.hbs/],
  });

  for (const [file, template] of [
    ["vite.base.ts", viteBaseTpl],
    ["esbuild.json", JSON.stringify(esbuildJson, null, 2)],
    ["package.json", JSON.stringify(packageJson, null, 2)],
    ["tsconfig.json", JSON.stringify(tsconfigJson, null, 2)],
  ]) {
    await renderToFile(resolve(projectPath, file), template, {
      defaults,
      distDir: project.distDir || DEFAULT_DIST,
    });
  }
};

export const createSourceFolder = async (
  projectRoot: string, // path inside project
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

  const packageImport = await import(packageFile, {
    with: { type: "json" },
  }).then((e) => e.default);

  const plugins: Array<Plugin> = [];

  const generators: Array<Generator> = [
    { name: "fetchGenerator", options: "" },
    { name: "typeboxGenerator", options: "" },
  ];

  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  const framework = folder.framework || DEFAULT_FRAMEWORK;
  const backendFramework = folder.backend || DEFAULT_BACKEND;

  let tsconfig: Record<string, unknown> | undefined;

  if (framework === "solid") {
    Object.assign(dependencies, {
      "@solidjs/router": self.devDependencies["@solidjs/router"],
      "solid-js": self.devDependencies["solid-js"],
    });

    Object.assign(devDependencies, {
      "vite-plugin-solid": self.devDependencies["vite-plugin-solid"],
    });

    plugins.push({
      importDeclaration: `import solidPlugin from "vite-plugin-solid";`,
      importName: "solidPlugin",
      options: folder.ssr ? "{ ssr: true }" : "",
    });

    generators.push({
      name: "solidGenerator",
      options: opt?.frameworkOptions
        ? JSON.stringify(opt.frameworkOptions, null, 2)
        : "",
    });

    tsconfig = {
      extends: `@kosmojs/config/tsconfig.${framework}.json`,
    };
  } else if (framework === "react") {
    Object.assign(dependencies, {
      react: self.devDependencies.react,
      "react-router": self.devDependencies["react-router"],
    });

    Object.assign(devDependencies, {
      "@vitejs/plugin-react": self.devDependencies["@vitejs/plugin-react"],
      "@types/react": self.devDependencies["@types/react"],
      "@types/react-dom": self.devDependencies["@types/react-dom"],
      "react-dom": self.devDependencies["react-dom"],
    });

    plugins.push({
      importDeclaration: `import reactPlugin from "@vitejs/plugin-react";`,
      importName: "reactPlugin",
      options: "",
    });

    generators.push({
      name: "reactGenerator",
      options: opt?.frameworkOptions
        ? JSON.stringify(opt.frameworkOptions, null, 2)
        : "",
    });

    tsconfig = {
      extends: `@kosmojs/config/tsconfig.${framework}.json`,
    };
  } else if (framework === "vue") {
    Object.assign(dependencies, {
      "vue-router": self.devDependencies["vue-router"],
      vue: self.devDependencies.vue,
    });

    Object.assign(devDependencies, {
      "@vitejs/plugin-vue": self.devDependencies["@vitejs/plugin-vue"],
    });

    plugins.push({
      importDeclaration: `import vuePlugin from "@vitejs/plugin-vue";`,
      importName: "vuePlugin",
      options: "",
    });

    generators.push({
      name: "vueGenerator",
      options: opt?.frameworkOptions
        ? JSON.stringify(opt.frameworkOptions, null, 2)
        : "",
    });

    tsconfig = {
      extends: `@kosmojs/config/tsconfig.${framework}.json`,
    };
  }

  if (backendFramework === "koa") {
    Object.assign(dependencies, {
      koa: self.devDependencies.koa,
      "@koa/router": self.devDependencies["@koa/router"],
    });

    generators.push({ name: "koaGenerator", options: "" });
  }

  if (folder.ssr) {
    generators.push({
      name: "ssrGenerator",
      options: "",
    });
  }

  const context = {
    folder: {
      base: DEFAULT_BASE,
      port: DEFAULT_PORT,
      ...folder,
    },
    defaults,
    plugins,
    generators,
  };

  for (const [file, template] of [
    ["vite.config.ts", srcViteConfigTpl],
    [`${defaults.configDir}/index.ts`, srcConfigTpl],
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

  if (tsconfig) {
    await writeFile(
      resolve(folderPath, "tsconfig.json"),
      JSON.stringify(tsconfig, null, 2),
      "utf8",
    );
  }

  const packageUpdated = {
    ...packageImport,
    dependencies: {
      ...packageImport.dependencies,
      ...dependencies,
      ...opt?.dependencies,
    },
    devDependencies: {
      ...packageImport.devDependencies,
      ...devDependencies,
      ...opt?.devDependencies,
    },
  };

  await writeFile(packageFile, JSON.stringify(packageUpdated, null, 2));
};
