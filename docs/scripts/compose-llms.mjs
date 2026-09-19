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
 * Includes are expanded here, not by the plugin. The plugin's remark visitor only matches `html` nodes,
 * so an `<!--@include: -->` written inside a fence lives in a `code` node and is never seen -
 * the generated page ships the comment instead of the snippet.
 * VitePress itself replaces on raw text, which is why the website is correct and the artifacts were not.
 * Every page is expanded before it is used, and the run fails if any include survives.
 *
 * Usage: node compose-llms.mjs [distDir]     default: .vitepress/dist
 * */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { redirects } from "./redirects.mjs";

const AGENTS_INCLUDE_PATTERN = /<!--\s*@include:\s*\S*agents-versions\.md#/;
const TABS_PATTERN = /^:::\s*tabs\b.*key:(frontend|backend)/m;

// website-only code annotations - they highlight a line in the browser and are noise in a text artifact.
// Order matters: the whole comment goes when it carries nothing but the marker,
// otherwise only the marker appended to a real comment
const MARKER_PATTERNS = [
  /[ \t]*\/\/[ \t]*\[!code[^\]]*\][ \t]*$/gmu,
  /[ \t]*\[!code[^\]]*\]/gu,
];

const stripMarkers = (text) => {
  return MARKER_PATTERNS.reduce(
    (acc, pattern) => acc.replace(pattern, ""),
    text,
  );
};

const srcDir = resolve(import.meta.dirname, "..");

const INCLUDE_PATTERN = /<!--\s*@include:\s*(.*?)\s*-->/g;
const REGION_SPEC = /(#[^\s{]+)/;
const RANGE_SPEC = /\{(\d*),(\d*)\}$/;

// the region marker forms VitePress accepts
const REGION_MARKERS = [
  {
    end: /^\s*\/\/\s*#?endregion\b/,
    start: (name) => new RegExp(`^\\s*//\\s*#?region\\s+${name}\\b`),
  },
  {
    end: /^\s*<!--\s*#?endregion\b/,
    start: (name) => new RegExp(`^\\s*<!--\\s*#?region\\s+${name}\\b`),
  },
  {
    end: /^\s*\/\*\s*#endregion\b/,
    start: (name) => new RegExp(`^\\s*/\\*\\s*#region\\s+${name}\\b`),
  },
];

/** The lines of a named region, or null when it is not declared. */
const sliceRegion = (lines, name) => {
  for (const marker of REGION_MARKERS) {
    const open = lines.findIndex((line) => marker.start(name).test(line));
    if (open < 0) {
      continue;
    }
    const rest = lines
      .slice(open + 1)
      .findIndex((line) => marker.end.test(line));
    return lines.slice(open + 1, rest < 0 ? lines.length : open + 1 + rest);
  }
  return null;
};

/**
 * Expand every `<!--@include: -->` the way VitePress does - on raw text, so an include
 * inside a code fence is expanded like any other. Nested includes resolve recursively.
 */
const expandIncludes = (text, file, depth = 0) => {
  if (depth > 10) {
    throw new Error(`compose-llms: include depth exceeded in ${file}`);
  }
  return text.replace(INCLUDE_PATTERN, (whole, spec) => {
    if (!spec.length) {
      return whole;
    }
    const range = spec.match(RANGE_SPEC);
    const region = spec.match(REGION_SPEC);
    const metaLength = (region?.[0].length ?? 0) + (range?.[0].length ?? 0);
    const rawPath = metaLength ? spec.slice(0, -metaLength) : spec;
    const target = rawPath.startsWith("@")
      ? join(srcDir, rawPath.slice(rawPath[1] === "/" ? 2 : 1))
      : join(srcDir, dirname(file), rawPath);

    if (!existsSync(target)) {
      throw new Error(
        `compose-llms: include not found: ${spec} (from ${file})`,
      );
    }

    let lines = readFileSync(target, "utf8").split(/\r?\n/);

    if (region) {
      const slice = sliceRegion(lines, region[0].slice(1));
      if (!slice) {
        throw new Error(
          `compose-llms: region ${region[0]} not found in ${target}`,
        );
      }
      lines = slice;
    }

    if (range) {
      const [, start, end] = range;
      lines = lines.slice(
        start ? Number(start) - 1 : 0,
        end ? Number(end) : lines.length,
      );
    }

    let content = lines.join("\n").trim();

    // parity with the plugin: a whole-file .md include drops the included frontmatter
    if (!region && !range && target.endsWith(".md")) {
      content = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
    }

    return expandIncludes(content, relative(srcDir, target), depth + 1);
  });
};

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

  // the per-page .md files are served as well - expand them in place,
  // so the "append .md to any page URL" contract carries the snippets too
  let expanded = 0;

  for (const path of collectPages(srcDir)) {
    const outfile = join(dist, path);
    if (!existsSync(outfile)) {
      continue;
    }
    const generated = readFileSync(outfile, "utf8");
    if (!generated.includes("@include:")) {
      continue;
    }
    writeFileSync(outfile, expandIncludes(generated, path));
    expanded += 1;
  }

  console.log(`  ${expanded} pages had includes expanded`);

  const composed = corpus
    .map((e) => stripMarkers(readFileSync(join(dist, e), "utf8")).trim())
    .join("\n\n");

  if (composed.includes("@include:")) {
    throw new Error(
      "compose-llms: unexpanded include survived into llms-full.txt",
    );
  }

  writeFileSync(join(dist, "llms-full.txt"), composed);

  console.log(`  llms-full.txt - ${corpus.length} pages`);
};

const dist = process.argv[2] ?? join(srcDir, ".vitepress/dist");

if (!existsSync(dist)) {
  console.error(`compose-llms: ${dist} does not exist - run the build first`);
  process.exit(1);
}

compose(dist);
console.log("compose-llms: done");
