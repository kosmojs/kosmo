#!/usr/bin/env node
/**
 * Compose llms-full.txt from the plugin's output.
 *
 * The plugin generates dist/<page>.md for every page plus llms.txt; those stay as they are.
 * But llms-full.txt carries the multi-framework tab containers,
 * which read as one opaque block in a text artifact -
 * so this script rebuilds it by composition instead of by parsing.
 *
 *   llms-full.txt = every generated page EXCEPT the multi-framework ones
 *
 * A multi-framework page declares itself: it includes parts/agents-versions.md at the bottom.
 * Its framework content lives on the agents/<framework> pages,
 * which carry no include and therefore stay in - the artifacts are a plain sum of the generated files,
 * nothing is parsed or rewritten.
 *
 * A page that grows a `:::tabs` group without the include is excluded too,
 * with a warning, so the invariant heals instead of leaking.
 *
 * Usage: node compose-llms.mjs [distDir]     default: .vitepress/dist
 * */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { redirects } from "./redirects.mjs";

const AGENTS_INCLUDE_PATTERN = /<!--\s*@include:\s*\S*agents-versions\.md#/;
const TABS_PATTERN = /^:::\s*tabs\b.*key:(frontend|backend)/m;

const srcDir = resolve(import.meta.dirname, "..");

const skipDirs = new Set([
  ".vitepress",
  "node_modules",
  "public",
  "scripts",
  "parts",
]);

const skipFiles = new Set([
  // skip landing page
  "index.md",
]);

/** Recursively collect page paths under `dir`, relative to `srcDir`. */
const collectPages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (skipDirs.has(entry.name) || skipFiles.has(entry.name)) {
      return [];
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectPages(path);
    }
    return entry.name.endsWith(".md") ? [relative(srcDir, path)] : [];
  });

export const compose = (dist) => {
  const stubs = new Set(
    redirects.map(([from]) =>
      from.replace(/^\//, "").replace(/\.html$/, ".md"),
    ),
  );

  const corpus = [];

  for (const path of collectPages(srcDir)) {
    if (stubs.has(path)) {
      continue;
    }

    const source = readFileSync(join(srcDir, path), "utf8");

    if (AGENTS_INCLUDE_PATTERN.test(source)) {
      continue;
    }

    if (TABS_PATTERN.test(source)) {
      console.warn(
        `  WARN ${path}: has a :::tabs group but no @include:agents-versions - excluded`,
      );
      continue;
    }

    if (!existsSync(join(dist, path))) {
      console.warn(
        `  WARN ${path}: not in ${dist.replace(srcDir, ".")} - skipped`,
      );
      continue;
    }

    corpus.push(path);
  }

  writeFileSync(
    join(dist, "llms-full.txt"),
    corpus
      .map((path) => readFileSync(join(dist, path), "utf8").trim())
      .join("\n\n"),
  );

  console.log(`  llms-full.txt - ${corpus.length} pages`);
};

const dist = process.argv[2] ?? join(srcDir, ".vitepress/dist");

if (!existsSync(dist)) {
  console.error(`compose-llms: ${dist} does not exist - run the build first`);
  process.exit(1);
}

compose(dist);
console.log("compose-llms: done");
