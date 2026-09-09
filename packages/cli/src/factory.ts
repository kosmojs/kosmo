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
  DEFAULT_PREVIEW_PORT,
  defaults,
  type FolderConfig,
  FRONTENDS,
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
        return !assets?.input?.overwrite
          ? "Target dir is not empty. Either remove dir contents or provide --overwrite flag"
          : undefined;
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
    previewPort: project.previewPort || DEFAULT_PREVIEW_PORT,
    scripts: {
      dev: "kosmo serve",
      preview: "kosmo preview",
      build: "kosmo build",
      typecheck: "kosmo typecheck",
      folder: "kosmo folder",
    },
    dependencies: {
      "@kosmojs/core": SELF_VERSION,
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
    name,
    base,
    input,
    intro,
    outro,
    note,
  }: {
    name: string;
    base?: string;
    input?: {
      frontend?: string;
      "no-frontend"?: boolean;
      backend?: string;
      "no-backend"?: boolean;
      ssr?: boolean;
      ssg?: boolean;
      tsq?: boolean;
      quiet?: boolean;
      overwrite?: boolean;
    };
    intro?: () => MaybePromise<string | undefined>;
    outro?: (f: SourceFolder) => MaybePromise<string | undefined>;
    note?: (f: SourceFolder) => MaybePromise<string | undefined>;
  },
): Promise<SourceFolder> => {
  assertNoError(() => validateName(name, "No folder name provided"));

  const srcDir = resolve(root, defaults.srcDir);

  await mkdir(srcDir, { recursive: true });
  const entries = await readdir(srcDir);

  if (isCLI(input)) {
    // cli mode

    if (intro) {
      input?.quiet || console.log(await intro());
    }

    if (!input?.overwrite) {
      assertNoError(() => {
        return entries.includes(name ?? "") //
          ? `./${defaults.srcDir}/${name} already exists. Either remove it or provide --overwrite flag.`
          : undefined;
      });
    }

    for (const [key, values] of [
      ["frontend", FRONTENDS],
      ["backend", BACKENDS],
    ] as const) {
      if (input?.[key]) {
        assertNoError(() => {
          return !Object.keys(values).includes(input[key] as never)
            ? `Invalid ${key}, use one of: ${Object.keys(values).join(", ")}`
            : undefined;
        });
      } else if (!input?.[`no-${key}`]) {
        assertNoError(() => {
          return `${key} is required: either provide --${key} <name> or --no-${key} flag`;
        });
      }
      assertNoError(() => {
        return !input?.[key] || !input?.[`no-${key}`]
          ? undefined
          : `--${key} and --no-${key} are mutually exclusive; use only one`;
      });
    }

    const folder = { ...input, name, base } as SourceFolder;

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

    const frontend = (await readAnswer(
      prompts.select({
        message: "Frontend",
        options: [
          ...Object.entries(FRONTENDS).map(([value, label]) => {
            return { value, label };
          }),
          { value: undefined, label: "None (API-only folder)" },
        ],
      }),
    )) as SourceFolder["frontend"];

    const backend = (await readAnswer(
      prompts.select({
        message: "Backend Framework",
        options: [
          ...Object.entries(BACKENDS).map(([value, label]) => {
            return { value, label };
          }),
          { value: undefined, label: "None (client-only folder)" },
        ],
      }),
    )) as SourceFolder["backend"];

    // SSR enabled unconditionally on mdx folders
    const ssr = frontend
      ? frontend === "mdx"
        ? true
        : await readAnswer(
            prompts.confirm({
              message: "Enable server-side rendering (SSR)?",
              initialValue: false,
              active: "yes",
              inactive: "no",
            }),
          )
      : false;

    // ssg can be enabled only if ssr enabled
    const ssg = ssr
      ? await readAnswer(
          prompts.confirm({
            message: "Enable static site generation (SSG)?",
            initialValue: false,
            active: "yes",
            inactive: "no",
          }),
        )
      : false;

    // TanStack Query not available on mdx folders
    const tsq = frontend
      ? frontend === "mdx"
        ? false
        : await readAnswer(
            prompts.confirm({
              message: "Enable TanStack Query?",
              initialValue: false,
              active: "yes",
              inactive: "no",
            }),
          )
      : false;

    const folder: SourceFolder = {
      name,
      frontend,
      backend,
      ssr: ssr === true,
      ssg: ssg === true,
      tsq: tsq === true,
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
  folderDefaults?: FolderConfig,
) => {
  const folderPath = resolve(projectRoot, defaults.srcDir, folder.name);

  await mkdir(folderPath, { recursive: true });

  const packageFile = resolve(projectRoot, "package.json");

  // Using readFile cause import() returns cached content
  const packageJson = JSON.parse(await readFile(packageFile, "utf8"));

  const { frontend, backend } = folder;

  const options = {
    ...(frontend
      ? {
          frontend: {
            stack: frontend,
            base: `/${folder.name}`,
            fetch: true,
            ssr: folder.ssr || folder.ssg ? true : false,
            ssg: folder.ssg ? true : false,
            ...(["mdx"].includes(frontend)
              ? {}
              : { tanstack: { query: folder.tsq ? true : false } }),
            ...folderDefaults?.frontend,
          },
        }
      : {}),
    ...(backend
      ? {
          backend: {
            stack: backend,
            base: `/${folder.name}/api`,
            ...folderDefaults?.backend,
          },
        }
      : {}),
  };

  const kosmoConfig = createKosmoConfig(folder, options);

  await writeFile(
    resolve(folderPath, "kosmo.config.ts"),
    await format("kosmo.config.ts", kosmoConfig, {
      sortImports: true,
    }).then((e) => (e.errors.length ? kosmoConfig : e.code)),
    "utf8",
  );

  for (const file of [
    // stub files for initial build to pass;
    // generators will seed them with appropriate content.
    ...(folder.backend ? [`${defaults.apiDir}/index/index.ts`] : []),
    ...(["solid", "react"].includes(folder.frontend ?? "")
      ? [
          `${defaults.pagesDir}/index/index.tsx`,
          `${defaults.entryDir}/client.ts`,
        ]
      : []),
    ...(["vue"].includes(folder.frontend ?? "")
      ? [
          `${defaults.pagesDir}/index/index.vue`,
          `${defaults.entryDir}/client.ts`,
        ]
      : []),
    ...(["svelte"].includes(folder.frontend ?? "")
      ? [
          `${defaults.pagesDir}/index/index.svelte`,
          `${defaults.entryDir}/client.ts`,
        ]
      : []),
    ...(["mdx"].includes(folder.frontend ?? "")
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
        // if at any point file should be re-seeded,
        // just empty or delete it and dev server will seed a clean version.
        overwrite: false,
      },
    );
  }

  const generators: Array<GeneratorSignature> = [coreGenerator()];

  if (frontend === "solid") {
    generators.push(solidGenerator as never);
  } else if (frontend === "react") {
    generators.push(reactGenerator as never);
  } else if (frontend === "vue") {
    generators.push(vueGenerator as never);
  } else if (frontend === "svelte") {
    generators.push(svelteGenerator as never);
  } else if (frontend === "mdx") {
    generators.push(mdxGenerator as never);
  }

  if (backend === "hono") {
    generators.push(honoGenerator as never);
  } else if (backend === "h3") {
    generators.push(h3Generator as never);
  } else if (backend === "koa") {
    generators.push(koaGenerator as never);
  }

  if (folder.ssr || folder.ssg || frontend === "mdx") {
    generators.push(ssrGenerator());
  }

  if (folder.ssg) {
    generators.push(ssgGenerator());
  }

  if (Object.values(generators).some((e) => e.meta.slot === "backend")) {
    generators.push(fetchGenerator());
    generators.push(typeboxGenerator());
  }

  for (const generator of generators) {
    for (const key of ["dependencies", "devDependencies"] as const) {
      packageJson[key] = {
        ...packageJson[key],
        ...(typeof generator[key] === "function"
          ? generator[key](options)
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
  options: Record<string, Record<string, unknown>>,
) => {
  const { frontend, backend } = folder;

  const context = {
    frontend,
    backend,
    options: Object.fromEntries(
      // frontend/backend etc.
      Object.entries(options).map(([key, val]) => [
        key,
        Object.fromEntries(
          // stack/base etc.
          Object.entries(val).map(([key, val]) => [key, JSON.stringify(val)]),
        ),
      ]),
    ),
  };

  return render(templates.kosmoConfig, context);
};
