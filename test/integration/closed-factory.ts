import type { TestFunction } from "vitest";

import type { BACKENDS } from "@kosmojs/core";

import { setupTestProject } from "./setup";

type TestEntry = [name: string, runner: TestFunction];

export type TestGroup = {
  name: string;
  createHarness: () => Promise<{
    tests: Array<TestEntry>;
    teardown: () => Promise<void>;
  }>;
};

// a value only an over-sharing response carries; it must never reach the client
const LEAKED = "leaked-hash-9c41";

/**
 * Payload types covering every shape a closed position closes.
 * Named types are flattened before rendering, so an interface is closed like a literal.
 * */
const types = `
  type Base = { id: number };
  type Named = { name: string } | { title: string };
  type Address = { street: string; city: string };
  interface Profile { name: string }

  type Payload = {
    plain: { a: string };
    nested?: { inner: { x: number } };
    list?: Array<{ id: number }>;
    tuple?: [{ a: string }, number];
    merged?: Base & Named;
    partial?: Partial<Address>;
    omitted?: Omit<Address & { zip: string }, "zip">;
    profile?: Profile;
    meta?: Record<string, { v: string }>;
    keyed?: Record<"a" | "b", string>;
    numbered?: Record<number, string>;
    mapped?: { [K in "x" | "y"]?: boolean };
    reopened?: VRefine<{ a: string }, { additionalProperties: true }>;
    reopenedMember?: Base & VRefine<{ b?: string }, { additionalProperties: true }>;
    maybe?: { c: boolean } | null;
  };

  type User = { id: number; profile: { name: string } };
`;

const validPayload = {
  plain: { a: "x" },
  nested: { inner: { x: 1 } },
  list: [{ id: 1 }, { id: 2 }],
  tuple: [{ a: "x" }, 1],
  merged: { id: 1, name: "n" },
  partial: { city: "c" },
  omitted: { street: "s", city: "c" },
  profile: { name: "p" },
  meta: { k: { v: "v" } },
  keyed: { a: "a", b: "b" },
  numbered: { 1: "one" },
  mapped: { x: true },
  reopened: { a: "x" },
  reopenedMember: { id: 1, b: "b" },
  maybe: { c: true },
};

// json payloads with one undeclared property each, named by where it sits
const rejectedPayloads: Array<[name: string, payload: unknown]> = [
  ["a top-level property", { ...validPayload, role: "admin" }],
  ["a nested object", { ...validPayload, nested: { inner: { x: 1, y: 2 } } }],
  ["an array element", { ...validPayload, list: [{ id: 1, admin: true }] }],
  ["a tuple element", { ...validPayload, tuple: [{ a: "x", b: "y" }, 1] }],
  [
    "an intersection",
    { ...validPayload, merged: { id: 1, name: "n", role: "admin" } },
  ],
  [
    "the other union member inside an intersection",
    { ...validPayload, merged: { id: 1, title: "t", role: "admin" } },
  ],
  ["a Partial", { ...validPayload, partial: { city: "c", zip: "z" } }],
  [
    "the omitted property of an Omit",
    { ...validPayload, omitted: { street: "s", city: "c", zip: "z" } },
  ],
  ["an interface", { ...validPayload, profile: { name: "p", admin: true } }],
  ["a record value", { ...validPayload, meta: { k: { v: "v", w: "w" } } }],
  [
    "a record with literal keys",
    { ...validPayload, keyed: { a: "a", b: "b", role: "admin" } },
  ],
  [
    "a record with numeric keys",
    { ...validPayload, numbered: { 1: "one", role: "admin" } },
  ],
  ["a mapped type", { ...validPayload, mapped: { x: true, role: true } }],
  ["a nullable object", { ...validPayload, maybe: { c: true, d: false } }],
];

// json payloads with undeclared properties the type explicitly allows
const acceptedPayloads: Array<[name: string, payload: unknown]> = [
  ["a reopened object", { ...validPayload, reopened: { a: "x", extra: true } }],
  [
    "a reopened intersection member",
    { ...validPayload, reopenedMember: { id: 1, b: "b", extra: true } },
  ],
  [
    "any key in a Record<string, T>",
    { ...validPayload, meta: { a: { v: "1" }, b: { v: "2" } } },
  ],
  ["null for a nullable object", { ...validPayload, maybe: null }],
  // both members match, so both evaluate their properties - as TypeScript also allows
  [
    "properties of both union members inside an intersection",
    { ...validPayload, merged: { id: 1, name: "n", title: "t" } },
  ],
];

type Backend = keyof typeof BACKENDS;

// handler bodies per backend; `ctx` is the handler argument on all three
const respond: Record<Backend, (body: string) => string> = {
  hono: (body) => `return ctx.json(${body});`,
  h3: (body) => `return ${body};`,
  koa: (body) => `ctx.body = ${body};`,
};

const routeSources = (backend: Backend): Record<string, string> => {
  const echo = respond[backend];
  const user = (leak: string) => `{
    id: 1,
    profile: { name: "n", ...(${leak} === "nested" ? { hash: "${LEAKED}" } : {}) },
    ...(${leak} === "top" ? { hash: "${LEAKED}" } : {}),
  }`;
  return {
    "closed/json": `
      ${types}
      export default defineRoute(({ POST }) => [
        POST<{
          json: Payload;
          query: { page?: number };
          headers: { "x-trace"?: string };
        }>(async (ctx) => {
          ${echo("{ json: ctx.validated.json, query: ctx.validated.query }")}
        }),
      ]);
    `,
    "closed/intersection": `
      ${types}
      export default defineRoute(({ POST }) => [
        POST<{ json: Base & { extra: string } }>(async (ctx) => {
          ${echo("ctx.validated.json")}
        }),
      ]);
    `,
    "closed/form": `
      export default defineRoute(({ POST }) => [
        POST<{ form: { title: string } }>(async (ctx) => {
          ${echo("ctx.validated.form")}
        }),
      ]);
    `,
    // validates its response in production too
    "closed/response": `
      ${types}
      export default defineRoute(({ GET }) => [
        GET<
          { query: { leak?: "top" | "nested" }; response: [200, "json", User] },
          { response: { runtimeValidation: true } }
        >(async (ctx) => {
          ${echo(user("ctx.validated.query.leak"))}
        }),
      ]);
    `,
    // relies on the default: response validation in development only
    "closed/response-default": `
      ${types}
      export default defineRoute(({ GET }) => [
        GET<{ query: { leak?: "top" | "nested" }; response: [200, "json", User] }>(
          async (ctx) => {
            ${echo(user("ctx.validated.query.leak"))}
          },
        ),
      ]);
    `,
  };
};

/**
 * One project per server: the production build, where response validation needs an opt-in,
 * and the dev server, where it runs by default.
 * */
const servers = [
  { name: "production build", mode: "backend", validatesResponses: false },
  { name: "dev server", mode: "csr", validatesResponses: true },
] as const;

export const createTestGroups = (backend: Backend) => {
  return servers.map(({ name, mode, validatesResponses }): TestGroup => {
    const createHarness = async () => {
      const { bootstrapProject, createApiRoutes, withApiResponse } =
        await setupTestProject({ mode, backend });

      const sources = routeSources(backend);

      const teardown = await bootstrapProject(async () => {
        await createApiRoutes(
          Object.keys(sources).map((name) => ({ name })),
          async ({ name }) => {
            return () => `
              import { defineRoute } from "_/api";
              ${sources[name]}
            `;
          },
        );
      });

      const post = (
        route: string,
        body: { json?: unknown; form?: Record<string, string> },
      ) => {
        return withApiResponse(route, {
          method: "POST",
          headers: { accept: "application/json" },
          ...body,
        });
      };

      const errorOf = (body: unknown) => {
        return JSON.parse(body as string).error as string;
      };

      const tests: Array<TestEntry> = [
        [
          "json: accepts every declared property",
          async ({ expect }) => {
            const { response } = await post("closed/json", {
              json: validPayload,
            });
            expect(response.statusCode, response.body as string).toBe(200);
            expect(JSON.parse(response.body as string).json).toEqual(
              validPayload,
            );
          },
        ],

        ...rejectedPayloads.map(([name, json]): TestEntry => {
          return [
            `json: rejects an undeclared property in ${name}`,
            async ({ expect }) => {
              const { response } = await post("closed/json", { json });
              expect(response.statusCode, response.body as string).toBe(400);
              expect(errorOf(response.body)).toMatch(/^json: /);
            },
          ];
        }),

        [
          "json: the error names the undeclared property",
          async ({ expect }) => {
            const { response } = await post("closed/json", {
              json: { ...validPayload, role: "admin" },
            });
            expect(errorOf(response.body)).toMatch(/role/);
          },
        ],

        ...acceptedPayloads.map(([name, json]): TestEntry => {
          return [
            `json: accepts ${name}`,
            async ({ expect }) => {
              const { response } = await post("closed/json", { json });
              expect(response.statusCode, response.body as string).toBe(200);
            },
          ];
        }),

        [
          "json: an intersection at the top accepts every constituent, and nothing else",
          async ({ expect }) => {
            const ok = await post("closed/intersection", {
              json: { id: 1, extra: "e" },
            });
            expect(ok.response.statusCode, ok.response.body as string).toBe(
              200,
            );
            const extra = await post("closed/intersection", {
              json: { id: 1, extra: "e", role: "admin" },
            });
            expect(extra.response.statusCode).toBe(400);
          },
        ],

        [
          "query and headers stay open",
          async ({ expect }) => {
            const { response } = await withApiResponse("closed/json", {
              method: "POST",
              headers: { "x-trace": "t", "x-undeclared": "u" },
              searchParams: { page: 2, utm_source: "newsletter" },
              json: validPayload,
            });
            expect(response.statusCode, response.body as string).toBe(200);
            expect(JSON.parse(response.body as string).query.page).toBe(2);
          },
        ],

        [
          "form: accepts the declared fields",
          async ({ expect }) => {
            const { response } = await post("closed/form", {
              form: { title: "t" },
            });
            expect(response.statusCode, response.body as string).toBe(200);
          },
        ],

        [
          "form: rejects an undeclared field",
          async ({ expect }) => {
            const { response } = await post("closed/form", {
              form: { title: "t", role: "admin" },
            });
            expect(response.statusCode).toBe(400);
            expect(errorOf(response.body)).toMatch(/^form: /);
          },
        ],
      ];

      const responseCases = [
        // opted in: validated on every server
        { route: "closed/response", validated: true },
        // the default: validated on the dev server only
        { route: "closed/response-default", validated: validatesResponses },
      ];

      for (const { route, validated } of responseCases) {
        tests.push([
          `${route}: responds with the declared shape`,
          async ({ expect }) => {
            const { response } = await withApiResponse(route);
            expect(response.statusCode, response.body as string).toBe(200);
            expect(JSON.parse(response.body as string)).toEqual({
              id: 1,
              profile: { name: "n" },
            });
          },
        ]);

        for (const leak of ["top", "nested"]) {
          tests.push([
            validated
              ? `${route}: refuses an undeclared ${leak} property, never sending its value`
              : `${route}: sends an undeclared ${leak} property, response validation being off`,
            async ({ expect }) => {
              const { response } = await withApiResponse(route, {
                searchParams: { leak },
                headers: { accept: "application/json" },
              });
              if (validated) {
                expect(response.statusCode).not.toBe(200);
                expect(response.body as string).not.toContain(LEAKED);
                expect(errorOf(response.body)).toMatch(/^response: /);
              } else {
                expect(response.statusCode).toBe(200);
                expect(response.body as string).toContain(LEAKED);
              }
            },
          ]);
        }
      }

      return { tests, teardown };
    };

    return { name: `${backend}: ${name}`, createHarness };
  });
};
