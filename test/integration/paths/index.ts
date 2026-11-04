import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { load } from "cheerio";

import { defaults } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import type { setupTestProject } from "../setup";

export type Project = Awaited<ReturnType<typeof setupTestProject>>;

export const ROUTE = "mappings";

/**
 * Imports the route and page under test run, one per resolution case,
 * each binding a value echoed back in `mappings`:
 *
 *   app      @/ -> project root
 *   src      ~/ -> the folder's src dir
 *   lib      _/ -> the folder's derived code, the generated core module
 *   libRoot  $/ -> derived code of a folder by name, the same core module
 *   dir      a prefixed directory import, resolved to its index.ts
 *   explicit a prefixed import that already carries its .js extension
 * */
export const importsFor = (folder: string) => `
  import { value as app } from "${defaults.appPrefix}/shared/app";
  import { value as src } from "${defaults.srcPrefix}/shared/src";
  import { name as lib } from "${defaults.libPrefix}/${defaults.coreDir}";
  import { name as libRoot } from "${defaults.libRootPrefix}/${folder}/${defaults.coreDir}";
  import { value as dir } from "${defaults.srcPrefix}/shared/dir";
  import { value as explicit } from "${defaults.srcPrefix}/shared/explicit.js";
  const mappings = { app, src, lib, libRoot, dir, explicit };
`;

export const expectedFor = (folder: string) => ({
  app: "app-prefix",
  src: "src-prefix",
  lib: folder,
  libRoot: folder,
  dir: "dir-index",
  explicit: "explicit-extension",
});

// what an extensionless component import renders, keyed by the extension it must probe
export const WIDGET_TEXT = {
  vue: "widget-vue",
  svelte: "widget-svelte",
} as const;

const widgetSources: Record<keyof typeof WIDGET_TEXT, string> = {
  vue: `<template><span id="widget">${WIDGET_TEXT.vue}</span></template>\n`,
  svelte: `<span id="widget">${WIDGET_TEXT.svelte}</span>\n`,
};

// pages importing every case plus an extensionless component, rendered as #mappings and #widget
export const pageSources: Record<
  keyof typeof WIDGET_TEXT,
  (folder: string) => string
> = {
  vue: (folder) => `
    <script setup lang="ts">
      ${importsFor(folder)}
      import Widget from "${defaults.srcPrefix}/components/Widget";
    </script>
    <template>
      <div id="mappings">{{ JSON.stringify(mappings) }}</div>
      <Widget />
    </template>
  `,
  svelte: (folder) => `
    <script lang="ts">
      ${importsFor(folder)}
      import Widget from "${defaults.srcPrefix}/components/Widget";
    </script>
    <div id="mappings">{JSON.stringify(mappings)}</div>
    <Widget />
  `,
};

// hono route responding with the mappings
export const routeSource = (folder: string) => `
  import { defineRoute } from "${defaults.libPrefix}/api";
  ${importsFor(folder)}
  export default defineRoute<"${ROUTE}">(({ GET }) => [
    GET((ctx) => ctx.json(mappings)),
  ]);
`;

/**
 * Writes the modules the imports land on; _/ and $/ resolve to derived code.
 * The widget is written for the folder's frontend, if it is one that probes.
 * */
export const writeSharedModules = async (
  { project, sourceFolder }: Project,
  frontend?: keyof typeof WIDGET_TEXT,
) => {
  const { createPath } = pathResolver(project, sourceFolder);

  const files: Array<[file: string, content: string]> = [
    [
      resolve(project.root, "shared/app.ts"),
      `export const value = "app-prefix";`,
    ],
    [createPath.src("shared/src.ts"), `export const value = "src-prefix";`],
    [
      createPath.src("shared/dir/index.ts"),
      `export const value = "dir-index";`,
    ],
    [
      createPath.src("shared/explicit.js"),
      `export const value = "explicit-extension";`,
    ],
  ];

  if (frontend) {
    files.push([
      createPath.src(`components/Widget.${frontend}`),
      widgetSources[frontend],
    ]);
  }

  for (const [file, content] of files) {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
  }
};

// the #mappings and #widget a rendered page carries
export const readPage = (content: string) => {
  const $ = load(content);
  const text = $("#mappings").text();
  return {
    mappings: text ? JSON.parse(text) : undefined,
    widget: $("#widget").text(),
  };
};
