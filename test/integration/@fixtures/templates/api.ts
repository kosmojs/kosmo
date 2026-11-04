import { markerFor } from ".";

export type ApiCase = {
  name: string;
  file: "index" | "use";
  // marker the seeded file should carry, undefined for the built-in template
  expected: string | undefined;
  // written before the build, so seeding must leave the file alone
  content?: { marker: string };
};

export type ResponseCase = {
  route: string;
  params?: Record<string, string | Array<string>>;
  // markers in the response body, middleware first; undefined for the built-in route
  body: Array<string> | undefined;
};

export const STRING_ROUTE_MARKER = "string-route";

export const stringPattern = "status/**";

// served by the function template; it returns undefined for skipped names
export const functionPattern = "crud/**";
export const functionSkipped = ["crud/legacy"];

export const apiCases: Array<ApiCase> = [
  // a string template seeds the routes it matches
  { name: "status", file: "index", expected: STRING_ROUTE_MARKER },
  { name: "status/[code]", file: "index", expected: STRING_ROUTE_MARKER },

  // a string template never seeds a use.ts, even one whose name matches
  { name: "status", file: "use", expected: undefined },

  // a file that already has content is never seeded over
  {
    name: "status/kept",
    file: "index",
    expected: "user-kept",
    content: { marker: "user-kept" },
  },

  // a function template is called for use.ts as well as routes,
  // and receives the resolved entry: the kind and the name
  { name: "crud", file: "use", expected: markerFor("apiUse", "crud") },
  {
    name: "crud/users",
    file: "use",
    expected: markerFor("apiUse", "crud/users"),
  },
  {
    name: "crud/users",
    file: "index",
    expected: markerFor("apiRoute", "crud/users"),
  },
  {
    name: "crud/users/[id]",
    file: "index",
    expected: markerFor("apiRoute", "crud/users/[id]"),
  },

  // a function returning undefined keeps the built-in template
  { name: "crud/legacy", file: "index", expected: undefined },

  // no pattern matches
  { name: "health", file: "index", expected: undefined },
];

export const responseCases: Array<ResponseCase> = [
  { route: "status", body: [STRING_ROUTE_MARKER] },
  {
    route: "status/[code]",
    params: { code: "404" },
    body: [STRING_ROUTE_MARKER],
  },
  { route: "status/kept", body: ["user-kept"] },
  {
    route: "crud/users",
    body: [
      markerFor("apiUse", "crud"),
      markerFor("apiUse", "crud/users"),
      markerFor("apiRoute", "crud/users"),
    ],
  },
  {
    route: "crud/users/[id]",
    params: { id: "7" },
    body: [
      markerFor("apiUse", "crud"),
      markerFor("apiUse", "crud/users"),
      markerFor("apiRoute", "crud/users/[id]"),
    ],
  },
  { route: "crud/legacy", body: undefined },
  { route: "health", body: undefined },
];
