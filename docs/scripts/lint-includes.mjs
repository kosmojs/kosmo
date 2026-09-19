#!/usr/bin/env node
/**
 * Validate every `<!--@include: -->` in the docs tree.
 *
 * Both expanders fail quietly when a region goes missing, and they fail differently:
 * VitePress looks for a heading with that id, then falls back to slicing the file with undefined bounds -
 * the whole partial, silently, no warning.
 *
 * The llms plugin logs a warning and also returns the whole file.
 * So a renamed or misspelled region does not break the build;
 * it pastes every framework's snippet into one tab pane and ships.
 *
 * This runs before the build and turns those into errors:
 *
 *   - the include target does not exist
 *   - the named region is not in the target file
 *   - a region is declared twice in one file (the first one silently wins)
 *   - a region is opened and never closed (it runs to the end of the file)
 *   - a line range points outside the file
 *
 * It also reports what nothing includes - a region or a whole partial left behind by an edit -
 * as warnings, which is the reference index as a side effect.
 *
 * Usage: node lint-includes.mjs [--quiet]
 * */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const srcDir = resolve(import.meta.dirname, "..");

const skipDirs = new Set([".vitepress", "node_modules", "public", "scripts"]);

// the same forms VitePress and the llms plugin accept
const REGION_MARKERS = [
  {
    start: /^\s*\/\/\s*#?region\b\s*(.*?)\s*$/,
    end: /^\s*\/\/\s*#?endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*<!--\s*#?region\b\s*(.*?)\s*-->/,
    end: /^\s*<!--\s*#?endregion\b\s*(.*?)\s*-->/,
  },
  {
    start: /^\s*\/\*\s*#region\b\s*(.*?)\s*\*\//,
    end: /^\s*\/\*\s*#endregion\b\s*(.*?)\s*\*\//,
  },
  {
    start: /^\s*#pragma\s+region\b\s*(.*?)\s*$/,
    end: /^\s*#pragma\s+endregion\b\s*(.*?)\s*$/,
  },
];

const INCLUDE_PATTERN = /<!--\s*@include:\s*(.*?)\s*-->/g;
const REGION_SPEC = /(#[^\s{]+)/;
const RANGE_SPEC = /\{(\d*),(\d*)\}$/;

/** Recursively collect markdown paths under `dir`, relative to `srcDir`. */
const collectFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (skipDirs.has(entry.name)) {
      return [];
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(path);
    }
    return entry.name.endsWith(".md") ? [relative(srcDir, path)] : [];
  });

/**
 * Every region declared in a file, as name -> list of declarations. A name with more
 * than one entry is ambiguous, and a declaration with no `closed` never terminates.
 * */
const declaredRegions = (lines) => {
  const regions = new Map();
  const open = [];
  for (const [index, line] of lines.entries()) {
    for (const marker of REGION_MARKERS) {
      const started = marker.start.exec(line);
      if (started) {
        const name = started[1];
        const declaration = { line: index + 1, closed: false };
        regions.set(name, [...(regions.get(name) ?? []), declaration]);
        open.push({ name, marker, declaration });
        break;
      }
      const ended = marker.end.exec(line);
      if (ended) {
        // an unnamed endregion closes the innermost open region
        const at = ended[1]
          ? open.findLastIndex((entry) => entry.name === ended[1])
          : open.length - 1;
        if (at >= 0) {
          open[at].declaration.closed = true;
          open.splice(at, 1);
        }
        break;
      }
    }
  }
  return regions;
};

/** Resolve an include path the way both expanders do: `@/` from the root. */
const resolveTarget = (rawPath, file) => {
  return rawPath.startsWith("@")
    ? join(srcDir, rawPath.slice(rawPath[1] === "/" ? 2 : 1))
    : join(dirname(join(srcDir, file)), rawPath);
};

const files = collectFiles(srcDir);
const errors = [];
const regionsOf = new Map();
const usedRegions = new Set();
const usedFiles = new Set();

/** Regions of a target file, read once and reused across every include of it. */
const targetRegions = (path) => {
  if (!regionsOf.has(path)) {
    const lines = readFileSync(path, "utf8").split(/\r?\n/);
    regionsOf.set(path, { lines, regions: declaredRegions(lines) });
  }
  return regionsOf.get(path);
};

for (const file of files) {
  const source = readFileSync(join(srcDir, file), "utf8");
  for (const [, spec] of source.matchAll(INCLUDE_PATTERN)) {
    if (!spec.length) {
      continue;
    }
    const range = spec.match(RANGE_SPEC);
    const region = spec.match(REGION_SPEC);
    const metaLength = (region?.[0].length ?? 0) + (range?.[0].length ?? 0);
    const rawPath = metaLength ? spec.slice(0, -metaLength) : spec;
    const target = resolveTarget(rawPath, file);

    if (!statSync(target, { throwIfNoEntry: false })?.isFile()) {
      errors.push(`${file}: include target not found: ${rawPath}`);
      continue;
    }

    usedFiles.add(target);

    const { lines, regions } = targetRegions(target);

    if (region) {
      const name = region[0].slice(1);
      const declarations = regions.get(name);
      const where = relative(srcDir, target);
      if (!declarations) {
        errors.push(
          `${file}: region #${name} not found in ${where}` +
            " - both expanders would inline the whole file",
        );
        continue;
      }
      usedRegions.add(`${target}#${name}`);
      if (declarations.length > 1) {
        const at = declarations.map((entry) => entry.line).join(", ");
        errors.push(
          `${file}: region #${name} declared ${declarations.length} times in` +
            ` ${where} (lines ${at}) - the first one silently wins`,
        );
      }
      const unclosed = declarations.find((entry) => !entry.closed);
      if (unclosed) {
        errors.push(
          `${file}: region #${name} in ${where} (line ${unclosed.line})` +
            " is never closed - it runs to the end of the file",
        );
      }
    }

    if (range) {
      const [, start, end] = range;
      const first = start ? Number(start) : 1;
      const last = end ? Number(end) : lines.length;
      if (first > lines.length || last > lines.length || first > last) {
        errors.push(
          `${file}: line range {${start},${end}} is outside` +
            ` ${relative(srcDir, target)} (${lines.length} lines)`,
        );
      }
    }
  }
}

const warnings = [];

for (const [path, { regions }] of regionsOf) {
  for (const name of regions.keys()) {
    if (!usedRegions.has(`${path}#${name}`)) {
      warnings.push(
        `${relative(srcDir, path)}: region #${name} is never included`,
      );
    }
  }
}

for (const file of files) {
  if (!file.startsWith("parts/")) {
    continue;
  }
  if (!usedFiles.has(join(srcDir, file))) {
    warnings.push(`${file}: partial is never included`);
  }
}

if (!process.argv.includes("--quiet")) {
  for (const warning of warnings) {
    console.warn(`  WARN ${warning}`);
  }
}

if (errors.length) {
  console.error(`lint-includes: ${errors.length} problem(s)\n`);
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log(
  `lint-includes: OK - ${usedRegions.size} region includes across` +
    ` ${usedFiles.size} partials, ${warnings.length} warning(s)`,
);
