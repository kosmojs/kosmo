import { compile } from "path-to-regexp";

import type { ApiRoute } from "@kosmojs/dev";

export const fetchClientFactory = <ParamsT extends Array<unknown>>(
  route: Pick<ApiRoute, "name" | "pathPattern" | "params">,
) => {
  const toPath = compile(route.pathPattern);

  const paramsMapper = (params: ParamsT) => {
    return route.params.schema.reduce<Record<string, unknown>>(
      (map, { name, kind }, i) => {
        if (kind === "splat") {
          if (Array.isArray(params[i]) && params[i].length) {
            map[name] = params[i].map(String);
          }
        } else if (params[i] !== undefined) {
          map[name] = String(params[i]);
        }
        return map;
      },
      {},
    );
  };

  return {
    paramsMapper,
    parametrize(params: ParamsT) {
      try {
        return toPath(paramsMapper(params) as never);
      } catch (error: any) {
        console.error(`❗ERROR: Failed building path for ${route.name}`);
        console.error(error);
        return "";
      }
    },
  };
};
