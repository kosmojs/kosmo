import { resolve } from "node:path";

import {
  DEFAULT_DIST,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";

import coreGenerator from "@kosmojs/core-generator";

import openapiGenerator from "#/index";

export { defineRoute } from "@kosmojs/koa-generator/lib";

export const openapiOptions = {
  openapi: "3.1.0",
  info: {
    title: "test",
    version: "0.0.0",
  },
  servers: [{ url: "http://localhost:8080" }],
};

export const sourceFolder: SourceFolder = {
  name: "test",
  config: {},
  generators: [
    coreGenerator(),
    openapiGenerator({
      outfile: "",
      openapi: "3.1.0",
      info: {
        title: "",
        version: "",
      },
      servers: [],
    }),
  ],
};

export const project: ProjectSettings = {
  root: resolve(import.meta.dirname, "@fixtures/app"),
  sourceFolders: [sourceFolder],
  devHost: "",
  previewHost: "",
  distDir: DEFAULT_DIST,
};
