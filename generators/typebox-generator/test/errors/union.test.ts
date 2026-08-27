import { describe, expect, test } from "vitest";

import { importSchema, MESSAGE_CODES } from "..";

describe("errors/union", async () => {
  const schema = await importSchema("errors/union", "json.POST");

  const validPayload = {
    schedule: "immediate",
    level: 2,
    mode: "auto",
    wide: "c",
    target: "none",
  };

  test("valid payload", () => {
    expect(schema?.check(validPayload)).toEqual(true);
  });

  test("valid payload variants", () => {
    for (const [name, value] of [
      ["schedule", "after_review"],
      ["level", 3],
      ["mode", 0],
      ["mode", true],
      ["wide", "f"],
      ["target", { id: "abc" }],
    ] as const) {
      expect(
        schema?.check({ ...validPayload, [name]: value }),
        `valid ${name}: ${JSON.stringify(value)}`,
      ).toEqual(true);
    }
  });

  test("invalid payload properties", () => {
    for (const [name, value, errorCode, errorParams] of [
      // A failed literal union reports the whole value set,
      // not the first variant
      [
        "schedule",
        "nope",
        MESSAGE_CODES.ENUM_MISMATCH,
        { allowedValues: ["immediate", "after_review"] },
      ],
      [
        "schedule",
        "",
        MESSAGE_CODES.ENUM_MISMATCH,
        { allowedValues: ["immediate", "after_review"] },
      ],

      // Numeric literal union
      ["level", 4, MESSAGE_CODES.ENUM_MISMATCH, { allowedValues: [1, 2, 3] }],
      ["level", 0, MESSAGE_CODES.ENUM_MISMATCH, { allowedValues: [1, 2, 3] }],

      // More than 5 variants: generic message text,
      // params still carry every allowed value
      [
        "wide",
        "z",
        MESSAGE_CODES.ENUM_MISMATCH,
        { allowedValues: ["a", "b", "c", "d", "e", "f"] },
      ],
    ] as const) {
      const data = { ...validPayload, [name]: value };
      const [error] = schema?.errors(data) || [];

      expect(
        schema?.check(data),
        `invalid ${name}: ${JSON.stringify(value)}`,
      ).toEqual(false);

      expect(
        error?.code,
        `invalid ${name}: ${JSON.stringify(value)} - ${JSON.stringify(error, null, 2)}`,
      ).toEqual(errorCode);

      expect(
        error?.params,
        `invalid ${name}: ${JSON.stringify(value)} - ${JSON.stringify(error, null, 2)}`,
      ).toMatchObject(errorParams);
    }
  });

  test("small literal union lists every variant in the message", () => {
    const [error] = schema?.errors({ ...validPayload, schedule: "nope" }) || [];
    expect(error?.message).toContain('"immediate"');
    expect(error?.message).toContain('"after_review"');
  });

  test("mixed union (literal | object) is not collapsed", () => {
    const data = { ...validPayload, target: 5 };
    const [error] = schema?.errors(data) || [];

    expect(schema?.check(data)).toEqual(false);
    // the object branch contributes non-const errors, so the group
    // keeps its regular prioritized reporting
    expect(error?.code).not.toEqual(MESSAGE_CODES.ENUM_MISMATCH);
  });

  test("cross-primitive literal union is not collapsed", () => {
    // branches of another primitive type fail with `type` errors,
    // which carry no allowedValue - the full value set cannot be
    // reconstructed from the error stream alone
    const data = { ...validPayload, mode: "manual" };
    const [error] = schema?.errors(data) || [];

    expect(schema?.check(data)).toEqual(false);
    expect(error?.code).not.toEqual(MESSAGE_CODES.ENUM_MISMATCH);
  });
});
