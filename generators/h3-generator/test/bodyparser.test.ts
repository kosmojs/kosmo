import { describe, test } from "vitest";

import { defineRoute, middlewareStackBuilder, runMiddleware } from ".";

describe("bodyparser", () => {
  describe("json", () => {
    for (const json of [
      0,
      // "some string",
      ["some", "array"],
      { some: "object" },
    ]) {
      test(JSON.stringify(json), async ({ expect }) => {
        const stack = middlewareStackBuilder([
          {
            definitionItems: defineRoute(({ POST }) => [
              POST(async (ctx) => {
                return await ctx.bodyparser.json();
              }),
            ]) as never,
          },
        ]);

        const res = await runMiddleware(
          stack.flatMap((e) => e.middleware),
          { json },
        );

        expect(json).toEqual(await res.json());
      });
    }
  });

  test("form: URL-encoded", async ({ expect }) => {
    const form = { id: "0", page: "1" };

    const stack = middlewareStackBuilder([
      {
        definitionItems: defineRoute(({ POST }) => [
          POST(async (ctx) => {
            return await ctx.bodyparser.form();
          }),
        ]) as never,
      },
    ]);

    const res = await runMiddleware(
      stack.flatMap((e) => e.middleware),
      { form },
    );

    expect(form).toEqual(await res.json());
  });

  describe("form: Multipart", () => {
    test("fields only", async ({ expect }) => {
      const stack = middlewareStackBuilder([
        {
          definitionItems: defineRoute(({ POST }) => [
            POST(async (ctx) => {
              return await ctx.bodyparser.form<never>();
            }),
          ]) as never,
        },
      ]);

      const form = new FormData();

      form.append("id", "0");

      const res = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        { form },
      );

      expect({ id: "0" }).toEqual(await res.json());
    });

    test("fields and files", async ({ expect }) => {
      const stack = middlewareStackBuilder([
        {
          definitionItems: defineRoute(({ POST }) => [
            POST(async (ctx) => {
              const form = await ctx.bodyparser.form<{ file: never }>();
              const { name, type } = form.file;
              return { ...form, file: { name, type } };
            }),
          ]) as never,
        },
      ]);

      const form = new FormData();

      form.append("id", "0");

      form.append(
        "file",
        new File(["content"], "photo.png", { type: "image/png" }),
      );

      const res = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        { form },
      );

      const body = await res.json();

      expect("0").toEqual(body.id);
      expect({ name: "photo.png", type: "image/png" }).toEqual(body.file);
    });
  });

  describe("raw", () => {
    test("text", async ({ expect }) => {
      const stack = middlewareStackBuilder([
        {
          definitionItems: defineRoute(({ POST }) => [
            POST(async (ctx) => {
              return await ctx.bodyparser.raw<never>();
            }),
          ]) as never,
        },
      ]);

      const raw = "hello";

      const res = await runMiddleware(
        stack.flatMap((e) => e.middleware),
        { raw },
      );

      const body = await res.text();
      expect(body.toString()).toBe(raw);
    });
  });
});
