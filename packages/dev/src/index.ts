import { styleText } from "node:util";

import type {
  FolderConfig,
  GeneratorSignature,
  SourceFolder,
} from "@kosmojs/core";
import { containsPathTraversalPatterns } from "@kosmojs/lib";

import coreGenerator from "@kosmojs/core-generator";
import fetchGenerator from "@kosmojs/fetch-generator";
import h3Generator from "@kosmojs/h3-generator";
import honoGenerator from "@kosmojs/hono-generator";
import koaGenerator from "@kosmojs/koa-generator";
import mdxGenerator from "@kosmojs/mdx-generator";
import openapiGenerator from "@kosmojs/openapi-generator";
import reactGenerator from "@kosmojs/react-generator";
import solidGenerator from "@kosmojs/solid-generator";
import ssgGenerator from "@kosmojs/ssg-generator";
import ssrGenerator from "@kosmojs/ssr-generator";
import svelteGenerator from "@kosmojs/svelte-generator";
import typeboxGenerator from "@kosmojs/typebox-generator";
import vueGenerator from "@kosmojs/vue-generator";

export {
  coreGenerator,
  fetchGenerator,
  h3Generator,
  honoGenerator,
  koaGenerator,
  mdxGenerator,
  openapiGenerator,
  reactGenerator,
  solidGenerator,
  ssgGenerator,
  ssrGenerator,
  svelteGenerator,
  typeboxGenerator,
  vueGenerator,
};

const frontendGenerators = {
  react: reactGenerator,
  solid: solidGenerator,
  vue: vueGenerator,
  svelte: svelteGenerator,
  mdx: mdxGenerator,
};

const backendGenerators = {
  hono: honoGenerator,
  h3: h3Generator,
  koa: koaGenerator,
};

export const defineConfig = (
  origConfig: FolderConfig,
): SourceFolder["config"] => {
  const config = { ...origConfig };
  const { frontend, backend, validation } = config;

  for (const key of ["frontend", "backend"] as const) {
    if (config[key]) {
      const { base } = config[key];
      let error: string | undefined;

      if (!base?.trim()) {
        error = `no base or invalid value provided`;
      } else if (!base.startsWith("/")) {
        error = `base should start with a slash`;
      } else if (containsPathTraversalPatterns(base)) {
        error = `base should not contain path traversal patterns`;
      }

      if (error) {
        throw new Error(styleText(["red"], `Invalid ${key} config - ${error}`));
      }

      config[key].base = base.replace(/\/+/g, "/").replace(/(.+)\/$/, "$1");
    }
  }

  const generators: Array<GeneratorSignature> = [];

  // core generator should run first
  generators.push(coreGenerator());

  // then backend-related generators
  if (backend) {
    const stack =
      typeof backend.stack === "object" //
        ? backend.stack.name
        : backend.stack;

    if (backend.generator) {
      generators.push(backend.generator);
    } else {
      generators.push(backendGenerators[stack](backend as never) as never);
    }

    // validation is relevent only if backend enabled
    if (validation) {
      if (validation === true) {
        generators.push(typeboxGenerator());
      } else if ("generator" in validation) {
        generators.push(validation.generator);
      } else {
        generators.push(typeboxGenerator(validation as never));
      }
    }

    if (backend.openapi) {
      "generator" in backend.openapi
        ? generators.push(backend.openapi.generator as never)
        : generators.push(openapiGenerator(backend.openapi as never) as never);
    }
  }

  // then frontend-related generators
  if (frontend) {
    const stack =
      typeof frontend.stack === "object" //
        ? frontend.stack.name
        : frontend.stack;

    // fetch generator should run before frontend
    if (frontend.fetch) {
      if (frontend.fetch === true) {
        generators.push(fetchGenerator());
      } else if (frontend.fetch.generator) {
        generators.push(frontend.fetch.generator);
      }
    }

    if (frontend.generator) {
      generators.push(frontend.generator);
    } else {
      generators.push(frontendGenerators[stack](frontend as never) as never);
    }

    if (frontend.ssr) {
      if (frontend.ssr === true) {
        generators.push(ssrGenerator());
      } else if ("generator" in frontend.ssr) {
        generators.push(frontend.ssr.generator);
      } else {
        generators.push(ssrGenerator(frontend.ssr as never));
      }
    }

    if (frontend.ssg) {
      if (frontend.ssg === true) {
        generators.push(ssgGenerator());
      } else if (frontend.ssg.generator) {
        generators.push(frontend.ssg.generator);
      }
    }
  }

  return {
    ...config,
    generators,
  };
};
