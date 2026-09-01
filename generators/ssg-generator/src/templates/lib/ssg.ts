import { join } from "node:path";

import { compile } from "path-to-regexp";

import type { PageRoute } from "@kosmojs/core";

import routes from "{{ createImport 'lib' 'ssg:routes' }}";
import { base } from "{{ createImport 'libCore' }}";

type StaticParams = Array<Array<string | number | Array<string | number>>>;

/**
 * Where a page declares the parameter sets to pre-render:
 *   - a `staticParams` named export - React/Solid page modules,
 *     a plain `<script>` block in Vue, a `<script module>` block in Svelte
 *   - `staticParams` in MDX frontmatter
 * Each entry is positional, in the route's parameter order.
 * */
const staticParamsOf = (module: unknown): StaticParams | undefined => {
  const { staticParams, frontmatter } = (module ?? {}) as {
    staticParams?: unknown;
    frontmatter?: { staticParams?: unknown };
  };
  const value = staticParams ?? frontmatter?.staticParams;
  return Array.isArray(value) ? (value as StaticParams) : undefined;
};

const paramsMapper = (
  params: PageRoute["params"],
  value: StaticParams[number],
) => {
  return params.schema.reduce<Record<string, unknown>>(
    (map, { name, kind }, i) => {
      if (kind === "splat") {
        if (Array.isArray(value[i]) && value[i].length) {
          map[name] = value[i].map(String);
        }
      } else if (value[i] !== undefined) {
        map[name] = String(value[i]);
      }
      return map;
    },
    {},
  );
};

export default Object.entries(routes)
  .flatMap(([name, { module, pathPattern, params }]) => {
    if (!params.schema.length) {
      // static route
      return [pathPattern.replace(/^index\/?/, "")];
    }

    const staticParams = staticParamsOf(module);

    // a dynamic route without staticParams has nothing to pre-render
    if (!staticParams) {
      return [];
    }

    const toPath = compile(pathPattern);

    return staticParams.flatMap((entry) => {
      try {
        return [toPath(paramsMapper(params, entry) as never)];
      } catch (error) {
        console.error(`❗SSG: Failed building path for ${name}`);
        console.error(error);
        return [];
      }
    });
  })
  .map((path) => join(base, path));
