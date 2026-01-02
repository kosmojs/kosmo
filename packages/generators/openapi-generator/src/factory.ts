import YAML from "yaml";

import {
  type GeneratorFactory,
  pathResolver,
  type ResolvedEntry,
  renderToFile,
} from "@kosmojs/dev";

import openapiFactory from "./openapi";
import type { Options } from "./types";

export const factory: GeneratorFactory<Options> = async (
  pluginOptions,
  openapiOptions: Options,
) => {
  const { appRoot, sourceFolder } = pluginOptions;
  const { outfile, ...baseSpec } = openapiOptions;

  const { createPath } = pathResolver({ appRoot, sourceFolder });

  const { generateOpenAPISchema } = openapiFactory(pluginOptions);

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
    async watch(entries) {
      await generateSchemas(entries);
    },
    async build(entries) {
      await generateSchemas(entries);
    },
  };
};
