import { readFileSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { styleText } from "node:util";

import * as prompts from "@clack/prompts";
import { format } from "oxfmt";

import {
  BACKENDS,
  DEFAULT_DIST,
  DEFAULT_PORT,
  defaults,
  FRAMEWORKS,
  type GeneratorSignature,
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
import { render, renderToFile } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import {
  assertNoError,
  isCLI,
  type MaybePromise,
  type Project,
  type SourceFolder,
  validateBase,
  validateName,
} from "./base";
import * as templates from "./templates";

/**
 * Read the installed package.json at runtime to get the actual version.
 * A static import would be inlined by the bundler with the pre-bump version.
 *
 * INFO: For best compatibility, all packages should share the same version.
 * When bumping the version (even a patch) for a single package,
 * bump it for all packages to keep versions fully synchronized across the project.
 * */
const { version } = JSON.parse(
  readFileSync(
    createRequire(import.meta.url).resolve("@kosmojs/cli/package.json"),
    "utf-8",
  ),
);

const SELF_VERSION = `^${version}`;

type GeneratorOptions = Partial<
  Record<
    keyof typeof FRAMEWORKS | keyof typeof BACKENDS | "ssr",
    Record<string, unknown>
  >
>;

// Resolve a clack prompt, exiting cleanly on ctrl-c / escape
const readAnswer = async <T>(input: Promise<T | symbol>) => {
  const value = await input;
  if (prompts.isCancel(value)) {
    prompts.cancel("Cancelled");
    process.exit(0);
  }
  return value;
};

export const createProject = async (
  path: string,
  project: Project,
  assets?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    input?: {
      overwrite?: boolean;
    };
  },
) => {
  await mkdir(path, { recursive: true });

  const entries = await readdir(path);

  const exemptPatterns = [/^\.git/, /^readme/i, /^license/i];

  if (entries.some((e) => !exemptPatterns.some((r) => r.test(e)))) {
    if (isCLI(assets?.input)) {
      // cli mode
      assertNoError(() => {
        return assets?.input?.overwrite
          ? undefined
          : "Target dir is not empty. Either remove dir contents or provide --overwrite flag";
      });
    } else {
      // interactive mode
      const answer = await readAnswer(
        prompts.select({
          message: "Target dir is not empty",
          options: [
            { value: "remove", label: "Remove existing files" },
            {
              value: "overwrite",
              label: "Keep existing files, overwrite as needed",
            },
            { value: "cancel", label: "Cancel" },
          ],
        }),
      );

      if (answer === "remove") {
        for (const entry of entries) {
          if (!exemptPatterns.some((r) => r.test(entry))) {
            await rm(resolve(path, entry), { recursive: true });
          }
        }
      } else if (answer === "cancel") {
        prompts.cancel("Cancelled");
        process.exit(0);
      }

      prompts.outro();
    }
  }

  const packageJson = {
    type: "module",
    distDir: project.distDir || DEFAULT_DIST,
    devPort: project.devPort || DEFAULT_PORT,
    scripts: {
      dev: "kosmo serve",
      build: "kosmo build",
      typecheck: "kosmo typecheck",
      folder: "kosmo folder",
    },
    dependencies: {
      "@kosmojs/core": SELF_VERSION,
      ...coreGenerator.dependencies,
      ...assets?.dependencies,
    },
    devDependencies: {
      "@kosmojs/cli": SELF_VERSION,
      "@kosmojs/dev": SELF_VERSION,
      "@types/node": self.devDependencies["@types/node"],
      "@types/deno": self.devDependencies["@types/deno"],
      "@types/bun": self.devDependencies["@types/bun"],
      typescript: self.devDependencies["typescript"],
      vite: self.devDependencies["vite"],
      ...coreGenerator.devDependencies,
      ...assets?.devDependencies,
    },
  };

  await renderToFile(
    resolve(path, "package.json"),
    JSON.stringify(packageJson, undefined, 2),
    {},
    {
      // overwrite regardless, project should start with a clean package.json
      overwrite: true,
    },
  );

  await renderToFile(
    resolve(path, ".gitignore"),
    templates.gitignore,
    {},
    { overwrite: false },
  );
};

export const createFolder = async (
  root: string,
  {
    intro,
    outro,
    note,
    input,
  }: {
    input?: {
      name?: string;
      base?: string;
      backend?: string;
      framework?: string;
      ssr?: boolean;
      tsq?: boolean;
      quiet?: boolean;
      overwrite?: boolean;
    };
    intro?: () => MaybePromise<string | undefined>;
    outro?: (f: SourceFolder) => MaybePromise<string | undefined>;
    note?: (f: SourceFolder) => MaybePromise<string | undefined>;
  },
): Promise<SourceFolder> => {
  const srcDir = resolve(root, defaults.srcDir);

  await mkdir(srcDir, { recursive: true });
  const entries = await readdir(srcDir);

  if (isCLI(input)) {
    // cli mode

    if (intro) {
      input?.quiet || console.log(await intro());
    }

    assertNoError(() => {
      return validateName(input?.name, "Please provide folder name");
    });

    if (!input?.overwrite) {
      assertNoError(() => {
        return entries.includes(input?.name ?? "") //
          ? `./${defaults.srcDir}/${input?.name} already exists. Either remove it or provide --overwrite flag.`
          : undefined;
      });
    }

    assertNoError(() => validateBase(input?.base));

    for (const [key, values] of [
      ["framework", FRAMEWORKS],
      ["backend", BACKENDS],
    ] as const) {
      if (input?.[key]) {
        assertNoError(() => {
          return !Object.keys(values).includes(input[key] as never)
            ? `Invalid ${key}, use one of: ${Object.keys(values).join(", ")}`
            : undefined;
        });
      }
    }

    const folder = input as SourceFolder;

    await createSourceFolder(root, folder);

    if (note) {
      input?.quiet || console.log(await note(folder));
    }

    if (outro) {
      input?.quiet || console.log(await outro(folder));
    }

    return folder;
  }

  // interactive mode
  {
    if (intro) {
      const output = await intro();
      !output || prompts.intro(output);
    }

    const name = await readAnswer(
      prompts.text({
        message: "Folder Name",
        validate: validateName,
      }),
    );

    if (entries.includes(name)) {
      const answer = await readAnswer(
        prompts.select({
          message: [
            styleText(["blue", "bold"], `./${defaults.srcDir}/${name}`),
            "already exists",
          ].join(" "),
          options: [
            { value: "remove", label: "Remove existing files" },
            {
              value: "overwrite",
              label: "Keep existing files, overwrite as needed",
            },
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
    }

    const base = await readAnswer(
      prompts.text({
        message: "Base URL",
        initialValue: "/",
        validate: (base) => validateBase(base || "/"),
      }),
    );

    const backend = await readAnswer(
      prompts.select({
        message: "Backend Framework",
        options: [
          ...Object.entries(BACKENDS).map(([value, label]) => {
            return { value, label };
          }),
          { value: undefined, label: "None (client-only folder)" },
        ],
      }),
    );

    const framework = await readAnswer(
      prompts.select({
        message: "Framework",
        options: [
          ...Object.entries(FRAMEWORKS).map(([value, label]) => {
            return { value, label };
          }),
          { value: undefined, label: "None (API-only folder)" },
        ],
      }),
    );

    // SSR and TanStack Query only apply to frameworks with a client runtime
    const promptExtras =
      !framework || ["mdx"].includes(framework) //
        ? false
        : true;

    let ssr: boolean | undefined;
    let tsq: boolean | undefined;

    if (promptExtras) {
      ssr = await readAnswer(
        prompts.confirm({
          message: "Enable server-side rendering (SSR)?",
          initialValue: false,
          active: "yes",
          inactive: "no",
        }),
      );

      tsq = await readAnswer(
        prompts.confirm({
          message: "Enable TanStack Query?",
          initialValue: false,
          active: "yes",
          inactive: "no",
        }),
      );
    }

    const folder: SourceFolder = {
      name,
      base,
      ...(framework ? ({ framework } as never) : {}),
      ...(backend ? ({ backend } as never) : {}),
      ssr,
      tsq,
    };

    await createSourceFolder(root, folder);

    if (note) {
      const output = await note(folder);
      !output || prompts.note(output);
    }

    if (outro) {
      const output = await outro(folder);
      !output || prompts.outro(output);
    }

    return folder;
  }
};

export const createSourceFolder = async (
  projectRoot: string,
  folder: SourceFolder,
  generatorOptions?: GeneratorOptions,
) => {
  const folderPath = resolve(projectRoot, defaults.srcDir, folder.name);

  await mkdir(folderPath, { recursive: true });

  const packageFile = resolve(projectRoot, "package.json");

  // Using readFile cause import() returns cached content
  const packageJson = JSON.parse(await readFile(packageFile, "utf8"));

  const [kosmoConfig, { generators }] = createKosmoConfig(
    folder,
    generatorOptions,
  );

  await writeFile(
    resolve(folderPath, "kosmo.config.ts"),
    await format("kosmo.config.ts", kosmoConfig, {
      sortImports: true,
    }).then((e) => (e.errors.length ? kosmoConfig : e.code)),
    "utf8",
  );

  for (const file of [
    // stub files for initial build to pass;
    // generators will fill them with appropriate content.
    ...(folder.backend ? [`${defaults.apiDir}/index/index.ts`] : []),
    ...(["solid", "react"].includes(folder.framework ?? "")
      ? [
          `${defaults.pagesDir}/index/index.tsx`,
          `${defaults.entryDir}/client.ts`,
        ]
      : []),
    ...(["vue"].includes(folder.framework ?? "")
      ? [
          `${defaults.pagesDir}/index/index.vue`,
          `${defaults.entryDir}/client.ts`,
        ]
      : []),
    ...(["svelte"].includes(folder.framework ?? "")
      ? [
          `${defaults.pagesDir}/index/index.svelte`,
          `${defaults.entryDir}/client.ts`,
        ]
      : []),
    ...(["mdx"].includes(folder.framework ?? "")
      ? [
          `${defaults.pagesDir}/index/index.mdx`,
          `${defaults.entryDir}/client.ts`,
        ]
      : []),
  ] as const) {
    await renderToFile(
      resolve(folderPath, file),
      "",
      {},
      {
        // do not overwrite real files with a stub!
        // if at any point file should be regenerated,
        // just empty or delete it and dev server will generate a clean version.
        overwrite: false,
      },
    );
  }

  for (const { generator } of generators) {
    for (const key of ["dependencies", "devDependencies"] as const) {
      packageJson[key] = {
        ...packageJson[key],
        ...(typeof generator[key] === "function"
          ? generator[key](folder.tsq ? { tanstack: { query: true } } : {})
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
};

export const createKosmoConfig = (
  folder: SourceFolder,
  generatorOptions?: GeneratorOptions,
) => {
  const imports: Array<string> = [];

  const generators: Array<{
    name: string;
    options: string;
    generator: GeneratorSignature;
  }> = [];

  const { base, framework = "", backend = "" } = folder;

  const options = Object.entries({
    ...generatorOptions,
    ...(folder.tsq && framework !== "mdx"
      ? {
          [framework]: {
            ...(generatorOptions?.[framework as never] || {}),
            tanstack: { query: true },
          },
        }
      : {}),
  }).reduce<Record<string, string>>((map, [key, val]) => {
    map[key] = JSON.stringify(val);
    return map;
  }, {});

  if (framework === "solid") {
    generators.push({
      name: "solidGenerator",
      options: options[framework],
      generator: solidGenerator as never,
    });
  } else if (framework === "react") {
    generators.push({
      name: "reactGenerator",
      options: options[framework],
      generator: reactGenerator as never,
    });
  } else if (framework === "vue") {
    generators.push({
      name: "vueGenerator",
      options: options[framework],
      generator: vueGenerator as never,
    });
  } else if (framework === "svelte") {
    generators.push({
      name: "svelteGenerator",
      options: options[framework],
      generator: svelteGenerator as never,
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
      options: options[framework]
        ? options[framework]
        : `{ remarkPlugins: [frontmatterPlugin, mdxFrontmatterPlugin] }`,
      generator: mdxGenerator as never,
    });

    generators.push({
      name: "ssgGenerator",
      options: "",
      generator: ssgGenerator as never,
    });
  }

  if (backend === "hono") {
    generators.push({
      name: "honoGenerator",
      options: options[backend],
      generator: honoGenerator as never,
    });
  } else if (backend === "h3") {
    generators.push({
      name: "h3Generator",
      options: options[backend],
      generator: h3Generator as never,
    });
  } else if (backend === "koa") {
    generators.push({
      name: "koaGenerator",
      options: options[backend],
      generator: koaGenerator as never,
    });
  }

  if (folder.ssr || framework === "mdx") {
    generators.push({
      name: "ssrGenerator",
      options: options.ssr,
      generator: ssrGenerator as never,
    });
  }

  if (generators.some(({ generator }) => generator.meta.slot === "backend")) {
    generators.push(
      {
        name: "fetchGenerator",
        options: "",
        generator: fetchGenerator as never,
      },
      {
        name: "typeboxGenerator",
        options: "",
        generator: typeboxGenerator as never,
      },
    );
  }

  const context = {
    base,
    imports,
    generators,
  };

  return [render(templates.kosmoConfig, context), { generators }] as const;
};
