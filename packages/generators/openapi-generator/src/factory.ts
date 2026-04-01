import YAML from "yaml";

import type { ResolvedEntry } from "@kosmojs/core";
import {
  defineGeneratorFactory,
  pathResolver,
  renderToFile,
} from "@kosmojs/lib";

import openapiFactory from "./openapi";
import type { Options } from "./types";

export default defineGeneratorFactory<Options>(
  (meta, sourceFolder, options) => {
    const { outfile, ...baseSpec } = { ...options };

    const { createPath } = pathResolver(sourceFolder);

    const { generateOpenAPISchema } = openapiFactory(sourceFolder);

    const generateSchemas = async (entries: Array<ResolvedEntry>) => {
      const apiRoutes = entries.flatMap(({ kind, entry }) =>
        kind === "apiRoute" //
          ? [entry]
          : [],
      );

      const { paths, components } = generateOpenAPISchema(apiRoutes);

      const spec = {
        ...JSON.parse(JSON.stringify(baseSpec)),
        paths,
        components,
      };

      const output = /ya?ml/.test(outfile)
        ? YAML.stringify(spec)
        : JSON.stringify(spec, null, 2);

      await renderToFile(createPath.src(outfile), output, {});
    };

    return {
      meta,
      options,
      async start() {},
      async watch(entries) {
        await generateSchemas(entries);
      },
      async build(entries) {
        await generateSchemas(entries);
      },
      plugins() {
        return [];
      },
    };
  },
);
