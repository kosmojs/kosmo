import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version; this external
 * import resolves to the actual published package.json.
 * INFO: For best compatibility, all packages should share the same version as the `kosmojs` package.
 * When bumping the version (even a patch) for a single package, bump it for all packages
 * to keep versions fully synchronized across the project.
 * */
import self from "kosmojs/package.json";

import { defaults, renderToFile } from "@kosmojs/devlib";

import {
  copyFiles,
  DEFAULT_BASE,
  DEFAULT_DIST,
  DEFAULT_FRAMEWORK,
  DEFAULT_PORT,
  NODE_VERSION,
  type Project,
  pathExists,
  type SourceFolder,
} from "./base";

import srcApiAppTpl from "./templates/@src/api/app.hbs";
import srcApiRouterTpl from "./templates/@src/api/router.hbs";
import srcApiServerTpl from "./templates/@src/api/server.hbs";
import srcApiUseTpl from "./templates/@src/api/use.hbs";
import srcConfigTpl from "./templates/@src/config/index.hbs";
import srcViteConfigTpl from "./templates/@src/vite.config.hbs";
import viteBaseTpl from "./templates/vite.base.hbs";

const TPL_DIR = resolve(import.meta.dirname, "templates");

type Plugin = {
  importDeclaration: string;
  importName: string;
  options: string;
};

type Generator = {
  importDeclaration: string;
  importName: string;
  options: string;
};

const tsconfigJson = {
  extends: "@kosmojs/config/tsconfig.vite.json",
  compilerOptions: {
    paths: {
      [`${defaults.appPrefix}/*`]: ["./*", `./${defaults.libDir}/*`],
    },
  },
};

const SEMVER = `^${self.version}`;

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
      "@kosmojs/api": SEMVER,
      qs: self.devDependencies.qs,
      ...assets?.dependencies,
    },
    devDependencies: {
      "@kosmojs/config": SEMVER,
      "@kosmojs/dev": SEMVER,
      "@types/node": self.devDependencies["@types/node"],
      "@types/qs": self.devDependencies["@types/qs"],
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
    exclude: [/@src/, /.+\.hbs/],
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
  const folderPath = resolve(projectRoot, folder.name);

  if (await pathExists(folderPath)) {
    throw new Error(`${folder.name} already exists`);
  }

  await copyFiles(resolve(TPL_DIR, "@src"), folderPath, {
    exclude: [/.+\.hbs/],
  });

  const packageFile = resolve(projectRoot, "package.json");

  const packageImport = await import(packageFile, {
    with: { type: "json" },
  }).then((e) => e.default);

  const tsconfigFile = resolve(projectRoot, "tsconfig.json");

  const tsconfigImport = await import(tsconfigFile, {
    with: { type: "json" },
  }).then((e) => e.default);

  const compilerOptions = {
    ...tsconfigImport?.compilerOptions,
    // instruct TypeScript to preserve JSX
    jsx: "preserve",
  };

  const plugins: Array<Plugin> = [];
  const generators: Array<Generator> = [];

  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  const framework: SourceFolder["framework"] =
    folder.framework || DEFAULT_FRAMEWORK;

  if (framework === "solid") {
    Object.assign(dependencies, {
      "@solidjs/router": self.devDependencies["@solidjs/router"],
      "solid-js": self.devDependencies["solid-js"],
    });

    Object.assign(devDependencies, {
      "@kosmojs/solid-generator": SEMVER,
      "vite-plugin-solid": self.devDependencies["vite-plugin-solid"],
    });

    plugins.push({
      importDeclaration: `import solidPlugin from "vite-plugin-solid";`,
      importName: "solidPlugin",
      options: folder.ssr ? "{ ssr: true }" : "",
    });

    generators.push({
      importDeclaration: `import solidGenerator from "@kosmojs/solid-generator";`,
      importName: "solidGenerator",
      options: opt?.frameworkOptions
        ? JSON.stringify(opt.frameworkOptions, null, 2)
        : "",
    });

    compilerOptions.jsxImportSource = "solid-js";
  } else if (framework === "react") {
    Object.assign(dependencies, {
      react: self.devDependencies.react,
      "react-router": self.devDependencies["react-router"],
    });

    Object.assign(devDependencies, {
      "@kosmojs/react-generator": SEMVER,
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
      importDeclaration: `import reactGenerator from "@kosmojs/react-generator";`,
      importName: "reactGenerator",
      options: opt?.frameworkOptions
        ? JSON.stringify(opt.frameworkOptions, null, 2)
        : "",
    });

    compilerOptions.jsxImportSource = "react";
  }

  if (folder.ssr) {
    generators.push({
      importDeclaration: `import ssrGenerator from "@kosmojs/ssr-generator";`,
      importName: "ssrGenerator",
      options: "",
    });
    Object.assign(devDependencies, {
      "@kosmojs/ssr-generator": SEMVER,
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
    importPathmap: {
      core: [defaults.appPrefix, defaults.coreDir, defaults.apiDir].join("/"),
      lib: [folder.name, defaults.apiLibDir].join("/"),
    },
  };

  for (const [file, template] of [
    [`${defaults.configDir}/index.ts`, srcConfigTpl],
    [`${defaults.apiDir}/app.ts`, srcApiAppTpl],
    [`${defaults.apiDir}/router.ts`, srcApiRouterTpl],
    [`${defaults.apiDir}/server.ts`, srcApiServerTpl],
    [`${defaults.apiDir}/use.ts`, srcApiUseTpl],
    ["vite.config.ts", srcViteConfigTpl],
    // stub files for initial build to pass;
    // generators will fill them with appropriate content.
    [`${defaults.apiDir}/index/index.ts`, ""],
    ...(["solid", "react"].includes(framework)
      ? [
          [`${defaults.pagesDir}/index/index.tsx`, ""],
          [`${defaults.entryDir}/client.tsx`, ""],
        ]
      : []),
  ]) {
    await renderToFile(resolve(folderPath, file), template, context);
  }

  const tsconfigUpdated = {
    ...tsconfigJson,
    ...tsconfigImport,
    compilerOptions: {
      ...compilerOptions,
      paths: {
        ...compilerOptions?.paths,
        [`${folder.name}/*`]: [
          `./${folder.name}/*`,
          `./${defaults.libDir}/${folder.name}/*`,
        ],
      },
    },
  };

  await writeFile(
    tsconfigFile,
    JSON.stringify(tsconfigUpdated, null, 2),
    "utf8",
  );

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
