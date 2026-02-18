import { describe, expect, test } from "vitest";

import { importSchema, MESSAGE_CODES } from ".";

describe("date", async () => {
  const schema = await importSchema("date", "json.POST");

  test("valid date", () => {
    expect(schema?.check({ date: new Date() })).toEqual(true);
  });

  test("invalid date", () => {
    const body = { date: "" };
    expect(schema?.check(body)).toEqual(false);
    const [error] = schema?.errors(body) || [];
    expect(error.code).toEqual(MESSAGE_CODES.TYPE_INVALID);
    expect(error.message).toMatch(/date/i);
  });
});
