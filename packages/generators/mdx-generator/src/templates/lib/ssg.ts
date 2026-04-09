import { join } from "node:path";

import { compile } from "path-to-regexp";

import type { PageRoute } from "@kosmojs/core";

import { baseurl } from "{{ createImport 'config' }}";
import routes from "{{ createImport 'lib' 'ssg:routes' }}";

const paramsMapper = (params: PageRoute["params"], value: Array<unknown>) => {
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
  .flatMap(([name, { pathPattern, params, frontmatter }]) => {
    if (!params.schema.length || Array.isArray(frontmatter?.staticParams)) {
      if (params.schema.length) {
        const toPath = compile(pathPattern);
        return Array.from(frontmatter?.staticParams || []).flatMap((entry) => {
          try {
            return [toPath(paramsMapper(params, entry) as never)];
          } catch (error: any) {
            console.error(`❗SSG: Failed building path for ${name}`);
            console.error(error);
            return [];
          }
        });
      }
      // static route
      return [pathPattern.replace(/^index\/?/, "")];
    }
    return [];
  })
  .map((path) => join(baseurl, path));
