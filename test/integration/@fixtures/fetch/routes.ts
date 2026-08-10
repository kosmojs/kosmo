import type { HTTPMethod } from "@kosmojs/core/api";

type RouteName = keyof typeof routes;

export type PayloadMap = Record<
  RouteName,
  {
    params?: Array<[...a: Array<unknown>]>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } & Partial<Record<HTTPMethod, Array<Record<string, unknown>>>>
>;

// Minimal route set for exercising the fetch transport (CSR + SSR).
//
// The transport must correctly carry each validation target to the server and
// round-trip it back. Domain semantics are irrelevant here - routes are named
// by the target(s) they exercise, not by any business meaning.
//
// Meta targets (combinable): query, headers, cookies
// Body targets (mutually exclusive): json, form, raw
// Orthogonal: params (path), and no-payload GET.

export const routes = {
  none: {
    GET: `{}`,
  },
  query: {
    GET: `{
      query: {
        page?: number;
        search?: string;
      };
    }`,
  },
  headers: {
    GET: `{
      headers: {
        authorization: string;
      };
    }`,
  },
  cookies: {
    GET: `{
      cookies: {
        session: string;
      };
    }`,
  },
  meta: {
    GET: `{
      query: { page?: number };
      headers: { authorization: string };
      cookies: { session: string };
    }`,
  },
  json: {
    POST: `{
      json: {
        name: string;
        count?: number;
      };
    }`,
  },
  form: {
    POST: `{
      form: {
        file: File;
        label?: string;
      };
    }`,
  },
  raw: {
    POST: `{
      raw: string | Buffer;
    }`,
  },
  "json-with-meta": {
    PATCH: `{
      json: { value: string };
      query: { mode?: string };
      headers: { authorization: string };
    }`,
  },
  "params/[id]": {
    paramsRefinements: ["number"],
    GET: `{
      query: {
        currency?: string;
      };
    }`,
  },
  "params/[a]/[b]": {
    GET: `{}`,
  },
  "put-json": {
    PUT: `{
      json: { value: string };
    }`,
  },
  "delete-with-meta": {
    DELETE: `{
      headers: { authorization: string };
    }`,
  },
  "opt/{section}": {
    GET: `{}`,
  },
  "splat/{...path}": {
    GET: `{}`,
  },
  "mixed/[id]/{...path}": {
    paramsRefinements: ["number", "Array<string>"],
    GET: `{}`,
  },
} as const;

export const payloadMap: PayloadMap = {
  none: {
    GET: [{}],
  },
  query: {
    GET: [
      { query: {} },
      { query: { page: 1 } },
      { query: { page: 2, search: "alice" } },
    ],
  },
  headers: {
    headers: { authorization: "Bearer tok_abc" },
    GET: [{}],
  },
  cookies: {
    cookies: { session: "sess_abc" },
    GET: [{}],
  },
  meta: {
    headers: { authorization: "Bearer tok_abc" },
    cookies: { session: "sess_abc" },
    GET: [
      {
        query: { page: 1 },
      },
    ],
  },
  json: {
    POST: [
      { json: { name: "alice" } },
      { json: { name: "bob", count: 3 } },
    ],
  },
  form: {
    POST: [
      { form: [{ label: "x" }, { file: "a.txt" }] },
      { form: [{}, { file: "b.txt" }] },
    ],
  },
  raw: {
    POST: [{ raw: "hello" }],
  },
  "json-with-meta": {
    headers: { authorization: "Bearer tok_abc" },
    PATCH: [
      {
        json: { value: "v1" },
        query: { mode: "fast" },
      },
    ],
  },
  "params/[id]": {
    params: [[42], [-42], [4.2]],
    GET: [
      { query: {} },
      { query: { currency: "USD" } },
    ],
  },
  "params/[a]/[b]": {
    params: [["1", "2"], ["x", "y"]],
    GET: [{}],
  },
  "put-json": {
    PUT: [{ json: { value: "v1" } }],
  },
  "delete-with-meta": {
    headers: { authorization: "Bearer tok_abc" },
    DELETE: [{}],
  },
  // optional param: variants with the segment absent and present
  "opt/{section}": {
    params: [[], ["privacy"]],
    GET: [{}],
  },
  // splat param: the splat segment is a nested array of path parts
  "splat/{...path}": {
    params: [[], [["a"]], [["a", "b"]], [["a", "b", "c"]]],
    GET: [{}],
  },
  // required param followed by a splat
  "mixed/[id]/{...path}": {
    params: [
      [1],
      [2, ["x"]],
      [3, ["x", "y"]],
      [4, ["a", "b", "c"]],
    ],
    GET: [{}],
  },
} as const;
