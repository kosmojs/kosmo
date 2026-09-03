import { stat } from "node:fs/promises";
import { builtinModules } from "node:module";
import { isAbsolute, join, parse } from "node:path";

import type { Plugin } from "vite";

import {
  defaults,
  type ProjectSettings,
  type SourceFolder,
  type VirtualModule,
} from "@kosmojs/core";

import { pathResolver } from "./paths";

/**
 * Resolves Kosmo's generated import prefixes to absolute file paths.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every source folder is scaffolded with three tsconfig `paths` prefixes
 * that let generated and user code import across
 * the folder's layout without long relative chains:
 *
 *   appPrefix "@" -> the project root            (<root>/*)
 *   srcPrefix "~" -> the folder's src dir        (<root>/src/<name>/*)
 *   libPrefix "_" -> the folder's lib dir        (<root>/lib/<name>/*)
 *
 * These are the backbone of the generated code: `defineRoute` and friends are
 * emitted with `_/...` imports, pages import layouts and components via `~/...`,
 * and `@/...` reaches shared app-level modules. If a bundler cannot resolve
 * them, nothing the framework generates can be loaded.
 *
 * Historically Vite resolved these through its built-in `resolve.tsconfigPaths: true`,
 * reading the `paths` straight from the generated tsconfig. That option
 * regressed in Vite 8.1.0 (still broken as of 8.1.3): it stops resolving
 * `paths` mappings, especially those defined in an extended / referenced base
 * config - which is exactly Kosmo's structure, where a source folder's
 * tsconfig `extends` `lib/<name>/tsconfig.json` and the paths use the
 * TypeScript `${configDir}` variable. The failure surfaces as:
 *
 *   [vite] Failed to resolve import "_/pageSamples/welcome.vue" from
 *   "src/<name>/pages/index/index.vue". Does the file exist?
 *
 * (Upstream: vitejs/vite #22139, #22047, #22371, #21889, #21856.)
 *
 * Rather than pin Vite to 8.0.x indefinitely, or depend on the general-purpose
 * `vite-tsconfig-paths` plugin, this internal plugin resolves ONLY
 * known prefixes against dirs derived from the source folder. That makes it:
 *
 *   - Correct on 8.1.x, where native `tsconfigPaths` is broken.
 *   - Faster: no tsconfig discovery, no `extends` chain walking, no glob
 *     matching - just a prefix check and a handful of `stat` probes,
 *     cached by Vite per specifier.
 *   - Non-blocking: probes via async `fs/promises` `stat`, so `resolveId` never
 *     stalls the event loop.
 *   - `.vue` / `.mdx`-aware: `resolveId` sees every specifier regardless of the
 *     importer's type, so imports from non-JS files resolve without the
 *     `loose` / `allowJs` escape hatches `vite-tsconfig-paths` needs.
 *
 * A project with custom `paths` beyond these three prefixes should install
 * `vite-tsconfig-paths`; this plugin is internal and intentionally narrow.
 *
 * The prefix -> dir bases come from `pathResolver`, the same source of truth the
 * tsconfig generator uses, so alias resolution here can never drift from the
 * paths that were written into the generated tsconfig.
 * */
export const tsconfigPaths = (sourceFolder: SourceFolder): Plugin => {
  /**
   * Candidate extensions for an extensionless specifier, in resolution priority order.
   * Mirrors the renderable file types the generators emit;
   * a new page type (e.g. `.svelte`) must be added here or its aliased imports won't resolve.
   * */
  const EXTENSIONS = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".vue",
    ".svelte",
    ".md",
    ".mdx",
    ".json",
  ];

  const { createPath } = pathResolver(sourceFolder);

  const table: Array<[prefix: string, baseDir: string]> = [
    [`${defaults.srcPrefix}/`, createPath.src()],
    [`${defaults.libPrefix}/`, createPath.lib()],
    [`${defaults.appPrefix}/`, sourceFolder.root],
  ];

  const resolveWithin = async (
    baseDir: string,
    rest: string,
  ): Promise<string> => {
    const target = join(baseDir, rest);
    const { ext } = parse(rest);

    // Specifier already carries a known extension: the target IS the candidate
    // (an explicit `foo.js` must not be probed as `foo.js.js`). Only fall back
    // to its `/index.<ext>` for a directory import that happens to end in a
    // known extension (rare, but keeps behaviour total).
    if (EXTENSIONS.includes(ext)) {
      for (const candidate of [target, `${target}/index${ext}`]) {
        if (await isFile(candidate)) {
          return candidate;
        }
      }
      return target;
    }

    // No known extension: probe each, plus its index form.
    for (const e of EXTENSIONS) {
      for (const candidate of [`${target}${e}`, `${target}/index${e}`]) {
        if (await isFile(candidate)) {
          return candidate;
        }
      }
    }

    return target;
  };

  return {
    name: "kosmo:tsconfigPaths",
    enforce: "pre",
    async resolveId(source) {
      if (isAbsolute(source) || source.startsWith(".")) {
        return;
      }
      for (const [prefix, baseDir] of table) {
        if (source.startsWith(prefix)) {
          return resolveWithin(baseDir, source.replace(prefix, ""));
        }
      }
      return;
    },
  };
};

const nodePrefix = (): Plugin => {
  return {
    name: "kosmojs:node-prefix",
    enforce: "pre",
    resolveId(source) {
      return builtinModules.includes(source)
        ? { id: `node:${source}`, external: true }
        : undefined;
    },
  };
};

/**
 * Resolves the CSR/SSR variant of env-sensitive modules.
 *
 * WHY THIS EXISTS
 * ---------------
 * A handful of generated modules must differ between the client graph and the SSR bundle -
 * the fetch transport (a no-op in the browser, an in-process dispatch on the server)
 * and the TanStack Query client (a singleton in the browser, per-request on the server).
 *
 * Every build installs this plugin; but only the SSR bundle installs it with `kind: "ssr"`.
 * Nothing is written, so concurrent processes cannot disturb each other.
 *
 * Generators declare their modules via `factory.virtualModules()`.
 * */
export const virtualModules = (
  modules: Array<VirtualModule>,
  {
    kind,
    command,
  }: { kind: "csr" | "ssr"; command: ProjectSettings["command"] },
): Plugin => {
  /**
   * Rollup's / Rolldown's convention for ids owned by a plugin:
   * the NUL prefix keeps other plugins and Node resolution from touching them.
   * */
  const VIRTUAL_PREFIX = "\0";

  const virtualSources = new Map<string, { csr: string; ssr: string }>();

  for (const { specifier, csr, ssr } of modules) {
    virtualSources.set(specifier, { csr, ssr });
  }

  // Built-in build context, importable from any graph.
  // Given modules should not override it.
  {
    const source = `export const command = "${command}";`;
    virtualSources.set("virtual:kosmo/env", { csr: source, ssr: source });
  }

  return {
    name: "kosmo:virtualModules",
    enforce: "pre",

    resolveId(source) {
      return virtualSources.has(source) ? VIRTUAL_PREFIX + source : undefined;
    },

    load(id) {
      return id.startsWith(VIRTUAL_PREFIX)
        ? virtualSources.get(id.slice(VIRTUAL_PREFIX.length))?.[kind]
        : undefined;
    },
  };
};

export const vitePlugins = {
  tsconfigPaths,
  nodePrefix,
  virtualModules,
};

const isFile = async (path: string) => {
  return stat(path)
    .then((e) => e.isFile())
    .catch(() => false);
};
