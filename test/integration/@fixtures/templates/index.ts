import type { ResolvedEntry } from "@kosmojs/core";

export type EntryKind = ResolvedEntry["kind"];

// test id for a file seeded by a function template, e.g. "pageRoute-admin-users-id";
// embedded into the generated templates module via toString, so it must stay self-contained
export const markerFor = (kind: string, name: string) => {
  return `${kind}-${name}`.replace(/\W+/g, "-").replace(/-$/, "");
};

// passed as the templates option in place of the real map;
// the factories swap it for an import of the generated templates module,
// since a function cannot survive the JSON round trip into kosmo.config.ts
export const TEMPLATES_SENTINEL = "__KOSMO_TEST_TEMPLATES__";

export const TEMPLATES_MODULE = "kosmo.templates";
