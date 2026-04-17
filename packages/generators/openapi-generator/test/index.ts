import { resolve } from "node:path";

import type { SourceFolder } from "@kosmojs/core";

import coreGenerator from "@kosmojs/core-generator";

import openapiGenerator from "@src/index";

export { defineRoute } from "@kosmojs/koa-generator/lib";

export const appRoot = resolve(import.meta.dirname, "@fixtures/app");

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
  config: {
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
  },
  root: appRoot,
  baseurl: "",
  apiurl: "",
  distDir: "",
};
