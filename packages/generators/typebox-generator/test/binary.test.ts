import { describe, expect, test } from "vitest";

import { importSchema, MESSAGE_CODES } from ".";

describe("binary:Blob", async () => {
  const schema = await importSchema("binary", "raw.GET");

  test("valid Blob", () => {
    expect(schema?.check(new Blob())).toEqual(true);
  });

  test("invalid Blob", () => {
    const body = "";
    expect(schema?.check(body)).toEqual(false);
    const [error] = schema?.errors(body) || [];
    expect(error.code).toEqual(MESSAGE_CODES.TYPE_INVALID);
    expect(error.message).toMatch(/Blob/i);
  });
});

describe("binary:ArrayBuffer", async () => {
  const schema = await importSchema("binary", "raw.POST");

  test("valid ArrayBuffer", () => {
    expect(schema?.check(new ArrayBuffer())).toEqual(true);
  });

  test("invalid ArrayBuffer", () => {
    const body = "";
    expect(schema?.check(body)).toEqual(false);
    const [error] = schema?.errors(body) || [];
    expect(error.code).toEqual(MESSAGE_CODES.TYPE_INVALID);
    expect(error.message).toMatch(/ArrayBuffer/i);
  });
});
