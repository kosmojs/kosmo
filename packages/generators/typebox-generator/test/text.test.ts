import { describe, expect, test } from "vitest";

import { importSchema, MESSAGE_CODES } from ".";

describe("text", async () => {
  const schema = await importSchema("text", "raw.GET");

  test("valid text", () => {
    expect(schema?.check("")).toEqual(true);
  });

  test("invalid text", () => {
    const body = 0;
    expect(schema?.check(body)).toEqual(false);
    const [error] = schema?.errors(body) || [];
    expect(error.code).toEqual(MESSAGE_CODES.TYPE_INVALID);
    expect(error.message).toMatch(/string/i);
  });
});

describe("text with refinements", async () => {
  const schema = await importSchema("text", "raw.POST");

  test("valid text", () => {
    expect(schema?.check("whatever")).toEqual(true);
  });

  test("invalid text", () => {
    const body = "";
    expect(schema?.check(body)).toEqual(false);
    const [error] = schema?.errors(body) || [];
    expect(error.code).toEqual(MESSAGE_CODES.STRING_MIN_LENGTH);
    expect(error.message).toMatch(/5 char/i);
  });
});
