#!/usr/bin/env node
/**
 * Flatten `:::tabs` containers in the generated LLM artifacts.
 *
 * The website keeps its tabs. This rewrites only the text artifacts, where a tab container has no equivalent:
 * a consumer sees one opaque block and keeps just the first pane, so every non-first framework example is lost.
 *
 * Each pane becomes a heading one level below its enclosing section,
 * which is what makes it independently retrievable:
 *
 *     ## Default Error Handler        ## Default Error Handler
 *     :::tabs key:backend        ->   ### Default Error Handler - Hono
 *     \== Hono                        ```ts ...
 *     ```ts ...                       ### Default Error Handler - H3
 *     \== H3                          ```ts ...
 *     ```ts ...                       ### Default Error Handler - Koa
 *     \== Koa                         ```ts ...
 *     ```ts ...
 *     :::
 *
 * Usage: node flatten-tabs.mjs [distDir]     default: .vitepress/dist
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const FENCE = /^(```+|~~~+)/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const TABS_OPEN = /^:::tabs\b/;
const CONTAINER_OPEN = /^:::\S/;
const CONTAINER_CLOSE = /^:::\s*$/;
// the llms plugin escapes pane markers as `\== Label`; accept both forms
const PANE = /^\\?==\s+(.+?)\s*$/;

// artifacts the plugin emits: per-page markdown plus the bundles
const TARGET = /\.md$|^llms(-full)?\.txt$/;

/** Recursively collect every artifact path under `dir`. */
const collect = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? collect(join(dir, entry.name))
      : TARGET.test(entry.name)
        ? [join(dir, entry.name)]
        : [],
  );

/** Where the current line lands: the open pane, or the document. */
const sink = (state) =>
  state.panes?.length ? state.panes[state.panes.length - 1].lines : state.out;

/** Render one collected container as a sequence of headed sections. */
const flush = (state) => {
  const level = Math.min(state.heading.level + 1, 6);
  const sections = state.panes.flatMap(({ label, lines }) => {
    const body = lines.join("\n").replace(/^\n+|\n+$/g, "");
    const title = state.heading.text
      ? `${state.heading.text} - ${label}`
      : label;
    return ["", `${"#".repeat(level)} ${title}`, "", ...(body ? [body] : [])];
  });
  state.out.push(...sections, "");
  state.groups += 1;
  state.panes = null;
  return state;
};

const step = (state, line) => {
  // inside a code fence nothing is markup - `:::` and `==` in a sample are safe
  if (state.fence) {
    sink(state).push(line);
    if (line.startsWith(state.fence)) state.fence = null;
    return state;
  }

  const fence = line.match(FENCE);
  if (fence) {
    sink(state).push(line);
    state.fence = fence[1];
    return state;
  }

  if (state.panes) {
    const pane = line.match(PANE);
    if (pane) {
      state.panes.push({ label: pane[1], lines: [] });
      return state;
    }
    if (CONTAINER_OPEN.test(line)) {
      state.depth += 1;
    } else if (CONTAINER_CLOSE.test(line)) {
      if (state.depth === 0) return flush(state);
      state.depth -= 1;
    }
    sink(state).push(line);
    return state;
  }

  const heading = line.match(HEADING);
  if (heading) {
    state.heading = { level: heading[1].length, text: heading[2].trim() };
    state.out.push(line);
    return state;
  }

  if (TABS_OPEN.test(line)) {
    state.panes = [];
    state.depth = 0;
    return state;
  }

  state.out.push(line);
  return state;
};

export const flattenTabs = (source) => {
  const state = source.split("\n").reduce(step, {
    out: [],
    panes: null,
    fence: null,
    depth: 0,
    heading: { level: 2, text: "" },
    groups: 0,
  });

  // an unterminated container is still emitted rather than dropped
  if (state.panes?.length) flush(state);

  return {
    text: state.out.join("\n").replace(/\n{3,}/g, "\n\n"),
    groups: state.groups,
  };
};

export const flattenDist = (dist) =>
  collect(dist)
    .map((file) => ({ file, ...flattenTabs(readFileSync(file, "utf8")) }))
    .filter(({ groups }) => groups > 0)
    .map(({ file, text, groups }) => {
      writeFileSync(file, text);
      return { file, groups };
    })
    .reduce(
      (acc, { file, groups }) => {
        console.log(`  ${file} - ${groups} tab groups flattened`);
        return { files: acc.files + 1, groups: acc.groups + groups };
      },
      { files: 0, groups: 0 },
    );

const dist = process.argv[2] ?? ".vitepress/dist";

if (!existsSync(dist)) {
  console.error(`flatten-tabs: ${dist} does not exist - run the build first`);
  process.exit(1);
}

const { groups, files } = flattenDist(dist);
console.log(
  `flatten-tabs: ${groups} tab groups across ${files} files in ${dist}`,
);
