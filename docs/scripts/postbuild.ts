#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import matter from "gray-matter";

import { redirects } from "../.vitepress/config.ts";

const FENCE_PATTERN = /^(`{3,}|~{3,})/;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*$/;
const CONTAINER_OPEN_PATTERN = /^:{3,}\s*(\S+)/;
const CONTAINER_CLOSE_PATTERN = /^:{3,}\s*$/;
// the plugin's stringifier escapes "=" at a line break, so both forms occur
const PANE_PATTERN = /^\\?==\s+(.+?)\s*$/;

// a root-relative markdown link, anchor kept apart; external links never match
const LINK_PATTERN = /\]\((\/[^)\s#]*)((?:#[^)\s]*)?)\)/g;

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
  ...redirects.map(([stub]) => stub.replace("/", "").replace(/\.html$/, ".md")),
]);

/** The text with fenced code removed - for checks that must not look inside fences. */
const withoutFences = (text: string) => {
  const out = [];
  let fence = null;

  for (const line of text.split("\n")) {
    const fenceMatch = line.match(FENCE_PATTERN);
    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length
      ) {
        fence = null;
      }
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      continue;
    }
    out.push(line);
  }

  return out.join("\n");
};

/** Recursively collect page paths under `dir`, relative to `srcDir`. */
const collectPages = async (dir: string) => {
  const pages: Array<string> = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const path = relative(srcDir, full);
    if (skipDirs.has(path) || skipFiles.has(path)) {
      continue;
    }
    if (entry.isDirectory()) {
      pages.push(...(await collectPages(full)));
    } else if (full.endsWith(".md")) {
      pages.push(path);
    }
  }
  return pages;
};

/**
 * Flatten every `:::tabs` group into headed sections:
 * each pane marker becomes a heading one level below the nearest preceding one -
 * `### <heading> - <Label>` - and the container lines are dropped.
 * Fenced code passes through untouched, and containers nested inside a pane
 * (tips, warnings) are kept as they are.
 * A page without tabs comes back unchanged.
 * */
const flattenTabs = (text: string, title: string | undefined) => {
  const out = [];

  // innermost-last stack of open containers; `true` marks a tabs group
  const containers: Array<boolean> = [];

  let fence = null;
  let heading = null;
  let swallowBlank = false;

  for (const line of text.split("\n")) {
    const fenceMatch = line.match(FENCE_PATTERN);

    if (fence) {
      out.push(line);
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length
      ) {
        fence = null;
      }
      continue;
    }

    if (swallowBlank) {
      swallowBlank = false;
      if (!line.trim() && out.length && !out[out.length - 1].trim()) {
        continue;
      }
    }

    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(line);
      continue;
    }

    const headingMatch = line.match(HEADING_PATTERN);

    if (headingMatch) {
      heading = { level: headingMatch[1].length, text: headingMatch[2] };
      out.push(line);
      continue;
    }

    if (CONTAINER_CLOSE_PATTERN.test(line)) {
      if (containers.pop() === true) {
        swallowBlank = true;
        continue;
      }
      out.push(line);
      continue;
    }

    const containerMatch = line.match(CONTAINER_OPEN_PATTERN);

    if (containerMatch) {
      const isTabs = /^tabs$/i.test(containerMatch[1]);
      containers.push(isTabs);
      if (isTabs) {
        swallowBlank = true;
        continue;
      }
      out.push(line);
      continue;
    }

    const paneMatch = containers.includes(true) && line.match(PANE_PATTERN);

    if (paneMatch) {
      if (out.length && out[out.length - 1].trim()) {
        out.push("");
      }
      const level = Math.min((heading?.level ?? 2) + 1, 6);
      const header = heading
        ? [title, heading.text, paneMatch[1]].filter(Boolean).join(" | ")
        : paneMatch[1];
      out.push(`${"#".repeat(level)} ${header}`);
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
};

/**
 * Point every internal link at the page's `.md` form:
 * /backend/middleware -> /backend/middleware.md
 * /backend/middleware.html -> /backend/middleware.md
 * */
const linksToMarkdown = (text: string, pages: Set<string>) => {
  return text.replace(LINK_PATTERN, (whole, path, anchor) => {
    const page = `${path.replace(/\.html$/, "").replace(/^\//, "")}.md`;
    return pages.has(page) ? `](/${page}${anchor})` : whole;
  });
};

export const run = async (dist: string) => {
  const pages = new Set(await collectPages(srcDir));
  const llmsPages: Array<string> = [];

  for (const path of pages) {
    const content = await readFile(join(srcDir, path), "utf8");
    const { data } = matter(content);

    const file = join(dist, path);
    const generated = await readFile(file, "utf8");

    const rewritten = linksToMarkdown(
      flattenTabs(generated, data?.title),
      pages,
    );

    if (/^:{3,}\s*tabs/im.test(withoutFences(rewritten))) {
      throw new Error(`postbuild: a tabs group survived flattening in ${path}`);
    }

    if (rewritten !== generated) {
      await writeFile(file, rewritten);
    }

    llmsPages.push(rewritten);
  }

  const llmsFile = join(dist, "llms.txt");
  const llmsText = await readFile(llmsFile, "utf8");

  await writeFile(llmsFile, linksToMarkdown(llmsText, pages), "utf8");
  await writeFile(join(dist, "llms-full.txt"), llmsPages.join("\n\n"), "utf8");
};

run(join(srcDir, ".vitepress/dist"));
