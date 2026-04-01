import type { RouteSource } from "@kosmojs/core/api";

export type RouteMap = Record<
  string,
  {
    paramsDefaults: Array<unknown>;
    paramsMappings: Array<[string, unknown, boolean]>;
  }
>;

export const routeSources: Array<RouteSource<never>> = [];
