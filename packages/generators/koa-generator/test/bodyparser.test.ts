import zlib from "node:zlib";

import FormData from "form-data";
import { describe, test } from "vitest";

import { middlewareStackBuilder, runMiddleware } from ".";

import { defineRouteFactory } from "@src/templates/lib/api:route";

describe("bodyparser", () => {
  describe("json", () => {
    for (const json of [
      0,
      "some string",
      ["some", "array"],
      { some: "object" },
    ]) {
      test(JSON.stringify(json), async ({ expect }) => {
        const stack = middlewareStackBuilder([
          {
            definitionItems: defineRouteFactory(({ POST }) => [
              POST(async (ctx) => {
                ctx.body = await ctx.bodyparser.json();
              }),
            ]),
          },
        ]);

        const ctx = await runMiddleware(
          stack.flatMap((e) => e.middleware),
          { json },
        );

        expect(json).toEqual(ctx.body);
      });
    }

    test("with options", async ({ expect }) => {
      const stack = middlewareStackBuilder([
        {
          definitionItems: defineRouteFactory(({ POST }) => [
            POST(async (ctx) => {
              ctx.body = await ctx.bodyparser.json({ limit: 1 });
            }),
          ]),
        },
      ]);

      const json = {
        language: "en",
        timezone: "UTC",
        updatedAt: new Date().toISOString(),
      };

      await expect(
        runMiddleware(
          stack.flatMap((e) => e.middleware),
          { json },
        ),
      ).rejects.toThrow("too large");
    });

    test("with compression", async ({ expect }) => {
      const stack = middlewareStackBuilder([
        {
          definitionItems: defineRouteFactory(({ POST }) => [
            POST(async (ctx) => {
              ctx.body = await ctx.bodyparser.json();
            }),
          ]),
        },
      ]);

      const json = {
        language: "en",
        timezone: "UTC",
        updatedAt: new Date().toISOString(),
      };

      const ctx = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        { json: zlib.gzipSync(Buffer.from(JSON.stringify(json))) },
      );

      expect(json).toEqual(ctx.body);
    });
  });

  describe("form: URL-Encoded", () => {
    const form = { id: "0", page: "1" };

    for (const [unwrap, body] of [
      [undefined, { id: ["0"], page: ["1"] }],
      [false, { id: ["0"], page: ["1"] }],
      [true, { id: "0", page: "1" }],
      [{ only: ["id"] }, { id: "0", page: ["1"] }],
      [{ except: ["id"] }, { id: ["0"], page: "1" }],
    ] as const) {
      test(`with unwrap set to ${JSON.stringify(unwrap)}`, async ({
        expect,
      }) => {
        const stack = middlewareStackBuilder([
          {
            definitionItems: defineRouteFactory(({ POST }) => [
              POST(async (ctx) => {
                ctx.body = await ctx.bodyparser.form({
                  unwrap: unwrap as never,
                });
              }),
            ]),
          },
        ]);

        const ctx = await runMiddleware(
          stack.flatMap((e) => e.middleware),
          { form },
        );

        expect(body).toEqual(ctx.body);
      });
    }
  });

  describe("form: Multipart", () => {
    test("fields only", async ({ expect }) => {
      const stack = middlewareStackBuilder([
        {
          definitionItems: defineRouteFactory(({ POST }) => [
            POST(async (ctx) => {
              ctx.body = await ctx.bodyparser.form({ unwrap: true });
            }),
          ]),
        },
      ]);

      const form = new FormData();

      form.append("id", 0);

      const ctx = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        { form },
      );

      expect({ id: "0" }).toEqual(ctx.body);
    });

    test("fields and files", async ({ expect }) => {
      const stack = middlewareStackBuilder([
        {
          definitionItems: defineRouteFactory(({ POST }) => [
            POST(async (ctx) => {
              ctx.body = await ctx.bodyparser.form({ unwrap: true });
            }),
          ]),
        },
      ]);

      const form = new FormData();

      form.append("id", 0);

      form.append("file", Buffer.from("..."), {
        filename: "a.png",
        contentType: "image/png",
      });

      const ctx = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        { form },
      );

      const { body } = ctx as { body: Record<string, never> };
      const { originalFilename, mimetype, size } = body.file;

      expect("0").toEqual(body.id);
      expect("a.png").toEqual(originalFilename);
      expect("image/png").toEqual(mimetype);
      expect(3).toEqual(size);
    });
  });

  describe("raw", () => {
    for (const compress of [false, true]) {
      test(`buffer compress:${compress}`, async ({ expect }) => {
        const stack = middlewareStackBuilder([
          {
            definitionItems: defineRouteFactory(({ POST }) => [
              POST(async (ctx) => {
                ctx.body = await ctx.bodyparser.raw();
              }),
            ]),
          },
        ]);

        const raw = compress
          ? Buffer.from("hello")
          : zlib.gzipSync(Buffer.from("hello"));

        const ctx = await runMiddleware(
          stack.flatMap((e) => e.middleware),
          { raw },
        );

        const { body } = ctx as { body: Record<string, never> };
        expect(body).toBeInstanceOf(Buffer);
        expect(body.toString()).toBe("hello");
      });
    }

    for (const encoding of [undefined, "utf8"]) {
      test(`string as ${encoding ? "utf8" : "Buffer"}`, async ({ expect }) => {
        const stack = middlewareStackBuilder([
          {
            definitionItems: defineRouteFactory(({ POST }) => [
              POST(async (ctx) => {
                ctx.body = await ctx.bodyparser.raw({
                  ...(encoding ? { encoding } : {}),
                });
              }),
            ]),
          },
        ]);

        const raw = "hello";

        const ctx = await runMiddleware(
          stack.flatMap((e) => e.middleware),
          { raw },
        );

        const { body } = ctx as { body: Record<string, never> };

        encoding
          ? expect(typeof body).toEqual("string")
          : expect(body).toBeInstanceOf(Buffer);

        expect(body.toString()).toBe("hello");
      });
    }
  });
});
