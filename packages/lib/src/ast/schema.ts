import type { JsonSchema, ResolvedTypeSignature } from "@kosmojs/core";

type Position = "closed" | "member";

const isObject = (value: unknown): value is JsonSchema => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

/**
 * Closes the objects of a schema against undeclared properties.
 *
 *   an object (records included)  ->  additionalProperties: false
 *   an intersection (allOf)       ->  unevaluatedProperties: false
 *
 * An intersection is closed as a whole: `unevaluatedProperties` sees the properties of every constituent,
 * while a constituent closed with `additionalProperties` would reject the properties of the others -
 * so its constituents stay open, through unions, down to their own property types, which are closed again.
 *
 * Property types, array and tuple elements, record values and `$defs` are closed;
 * what a VRefine adds as a JSON Schema fragment the user wrote - `prefixItems`,
 * `contains`, `not` and the like - is left as written.
 * A keyword already set wins, so `VRefine<{ ... }, { additionalProperties: true }>`
 * reopens an object, and `unevaluatedProperties: true` an intersection.
 *
 * `Record<string, T>` still takes any key, as its pattern matches every one;
 * literal, numeric and template keys accept only their own.
 * */
export const closeSchema = (schema: JsonSchema): JsonSchema => {
  const visit = (node: unknown, position: Position): unknown => {
    if (Array.isArray(node)) {
      return node.map((e) => visit(e, position));
    }
    if (!isObject(node)) {
      return node;
    }

    const out: JsonSchema = { ...node };

    for (const key of ["properties", "patternProperties", "$defs"]) {
      const value = out[key];
      if (isObject(value)) {
        out[key] = Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, visit(v, "closed")]),
        );
      }
    }

    // a single schema for array elements, a list for tuple elements
    if (out.items && typeof out.items === "object") {
      out.items = visit(out.items, "closed");
    }

    if (Array.isArray(out.allOf)) {
      out.allOf = out.allOf.map((e) => visit(e, "member"));
      if (position === "closed" && !("unevaluatedProperties" in out)) {
        out.unevaluatedProperties = false;
      }
    }

    for (const key of ["anyOf", "oneOf"]) {
      const value = out[key];
      if (Array.isArray(value)) {
        out[key] = value.map((e) => visit(e, position));
      }
    }

    if (
      [
        out.type === "object",
        position === "closed",
        "additionalProperties" in out === false,
      ].every(Boolean)
    ) {
      out.additionalProperties = false;
    }

    return out;
  };

  return visit(schema, "closed") as JsonSchema;
};

/**
 * The `$ref`s of a schema that point nowhere: no `$defs` entry in scope,
 * and not one of the `known` names the runtime supplies.
 * Each is a type Script could not resolve - and a schema rejecting every value.
 * */
export const unresolvedRefs = (
  schema: JsonSchema,
  known: ReadonlySet<string> = new Set(),
): Array<string> => {
  const refs = new Set<string>();

  const visit = (node: unknown, scope: ReadonlySet<string>) => {
    if (Array.isArray(node)) {
      for (const e of node) {
        visit(e, scope);
      }
      return;
    }

    if (!isObject(node)) {
      return;
    }

    const defs = isObject(node.$defs)
      ? new Set([...scope, ...Object.keys(node.$defs)])
      : scope;

    if (
      typeof node.$ref === "string" &&
      !defs.has(node.$ref) &&
      !known.has(node.$ref)
    ) {
      refs.add(node.$ref);
    }

    if (node.type === "generic" || node.type === "call") {
      refs.add(`<unevaluated ${node.type}>`);
    }

    for (const value of Object.values(node)) {
      visit(value, defs);
    }
  };

  visit(schema, new Set());

  return [...refs];
};

/**
 * Whether a schema validates numbers only:
 * a number, a numeric literal, a union of those, or an array of those.
 * Query and params values arrive as strings, so these are coerced first.
 * */
export const isNumericSchema = (schema: unknown): boolean => {
  if (!isObject(schema)) {
    return false;
  }
  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.length > 0 && schema.anyOf.every(isNumericSchema);
  }
  if (schema.type === "array") {
    return isObject(schema.items) && isNumericSchema(schema.items);
  }
  return schema.type === "number" || schema.type === "integer";
};

/**
 * Whether a schema validates booleans only:
 * a boolean, a boolean literal, a union of those, or an array of those.
 * */
export const isBooleanSchema = (schema: unknown): boolean => {
  if (!isObject(schema)) {
    return false;
  }
  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.length > 0 && schema.anyOf.every(isBooleanSchema);
  }
  if (schema.type === "array") {
    return isObject(schema.items) && isBooleanSchema(schema.items);
  }
  return schema.type === "boolean";
};

/**
 * A resolved type from its schema: the top-level properties of an object,
 * and which of them hold numbers or booleans only.
 * */
export const resolvedTypeOf = (
  name: string,
  jsonSchema: JsonSchema,
): ResolvedTypeSignature => {
  const properties: NonNullable<ResolvedTypeSignature["properties"]> = [];
  const numericProperties: Array<string> = [];
  const booleanProperties: Array<string> = [];

  if (jsonSchema.type === "object" && isObject(jsonSchema.properties)) {
    const required = new Set(
      Array.isArray(jsonSchema.required) ? jsonSchema.required : [],
    );
    for (const [propName, propSchema] of Object.entries(
      jsonSchema.properties,
    )) {
      if (!isObject(propSchema)) {
        continue;
      }
      properties.push({
        name: propName,
        optional: !required.has(propName),
        jsonSchema: propSchema,
      });
      if (isNumericSchema(propSchema)) {
        numericProperties.push(propName);
      }
      if (isBooleanSchema(propSchema)) {
        booleanProperties.push(propName);
      }
    }
  }

  return {
    name,
    jsonSchema,
    properties,
    numericProperties,
    booleanProperties,
  };
};
