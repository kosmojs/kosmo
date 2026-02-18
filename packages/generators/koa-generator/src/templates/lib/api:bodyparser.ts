import zlib from "node:zlib";

import Formidable, {
  type Options as FormidableOptions,
  // until this merged: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/74513
  // @ts-expect-error
  multipart as multipartPlugin,
  // @ts-expect-error
  querystring as querystringPlugin,
} from "formidable";
import type { ParameterizedContext } from "koa";
import rawParser from "raw-body";

import type { RequestBodyTarget } from "@kosmojs/api";

type JsonOptions = {
  limit?: number;
};

/**
 * Controls whether parsed field values are unwrapped from arrays.
 *
 * By default, all field values are returned as arrays (formidable v3 behavior),
 * since forms can submit multiple values under the same field name.
 *
 * - `false` (default) — no unwrapping, all values remain as arrays
 * - `true` — unwrap all fields; single-element arrays become scalars
 * - `{ only: string[] }` — unwrap only the specified fields
 * - `{ except: string[] }` — unwrap all fields except the specified ones
 *
 * Fields with multiple values are always kept as arrays regardless of this option.
 * If both `only` and `except` are provided, `only` takes precedence.
 *
 * @example
 * // all fields unwrapped: { username: 'john', role: 'admin' }
 * unwrap: true
 *
 * @example
 * // keep tags as array: { username: 'john', tags: ['a', 'b'] }
 * unwrap: { except: ['tags'] }
 *
 * @default false
 * */
type UnwrapControl =
  | boolean
  | {
      // unwrap only these keys
      only?: Array<string>;
      // unwrap all keys xcept these ones
      except?: Array<string>;
    };

type FormOptions = Pick<FormidableOptions, "encoding" | "maxFields"> &
  Partial<{
    // alias for maxFieldsSize
    limit: number;
    unwrap: UnwrapControl | undefined;
  }>;

type MultipartOptions = Omit<FormOptions, "enabledPlugins"> &
  Partial<{
    // alias for maxFieldsSize and maxFileSize
    limit: number;
    unwrap: UnwrapControl | undefined;
  }>;

type RawOptions = Partial<{
  /**
   * The byte limit of the body.
   * If the body ends up being larger than this limit, a 413 error code is returned.
   * */
  limit: number;

  /**
   * The length of the stream.
   * If the contents of the stream do not add up to this length,
   * an 400 error code is returned
   * */
  length: number;

  /**
   * The encoding to use to decode the body into a string.
   * By default, a Buffer instance will be returned when no encoding is specified.
   * utf-8 would decode as plain text.
   * use any encoding supported by iconv-lite.
   * */
  encoding: string;

  /**
   * zlib options
   * */
  chunkSize: number; // Default: 16 * 1024
}>;

export const defaults: {
  json: JsonOptions;
  form: FormOptions;
  multipart: MultipartOptions;
  raw: RawOptions;
} = {
  json: {
    limit: 1024 ** 2,
  },
  form: {
    limit: 1024 ** 2,
  },
  multipart: {
    limit: 1024 ** 2,
  },
  raw: {
    limit: 1024 ** 2,
  },
};

export type BodyparserOptions = {
  json: JsonOptions;
  form: FormOptions;
  multipart: MultipartOptions;
  raw: RawOptions;
};

const unwrap = (
  obj: Record<string, unknown | Array<unknown>>,
  opt: UnwrapControl | undefined,
) => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (!Array.isArray(v) || v.length > 1) {
        return [k, v];
      }
      if (opt === undefined || opt === false) {
        return [k, v];
      }
      if (opt === true) {
        return [k, v[0]];
      }
      const { only, except } = opt as Exclude<UnwrapControl, boolean>;
      if (only?.includes(k)) {
        return [k, v[0]];
      }
      return [k, !except || except.includes(k) ? v : v[0]];
    }),
  );
};

export const bodyparsers: {
  [T in RequestBodyTarget]: (
    ctx: ParameterizedContext,
    opt?: BodyparserOptions[T],
  ) => Promise<unknown>;
} = {
  async json(ctx, opt) {
    const body = await bodyparsers.raw(ctx, {
      ...opt,
      encoding: "utf-8",
    });
    return body ? JSON.parse(body as never) : undefined;
  },

  async form(ctx, opt) {
    const form = Formidable({
      maxFieldsSize: opt?.limit || defaults.form.limit,
      ...opt,
      // "querystring" is the name of plugin that parses urlencoded
      enabledPlugins: [querystringPlugin],
    });
    return new Promise((resolve, reject) => {
      form.parse(ctx.request.req, (err, fields) => {
        if (err) {
          return reject(err);
        }
        resolve(unwrap(fields, opt?.unwrap));
      });
    });
  },

  async multipart(ctx, opt) {
    const form = Formidable({
      maxFieldsSize: opt?.limit || defaults.multipart.limit,
      maxFileSize: opt?.limit || defaults.multipart.limit,
      ...opt,
      enabledPlugins: [multipartPlugin],
    });
    return new Promise((resolve, reject) => {
      form.parse(ctx.request.req, (err, fields, files) => {
        if (err) {
          return reject(err);
        }
        resolve(
          unwrap(
            // files should go last to override fields in case of name conflicting
            { ...fields, ...files },
            opt?.unwrap,
          ),
        );
      });
    });
  },

  async raw(ctx, opt) {
    const { chunkSize, ...rawParserOptions } = { ...defaults.raw, ...opt };

    const encoding = ctx.request.headers["content-encoding"];
    const compressed = encoding ? encoding !== "identity" : false;

    const stream = compressed
      ? ctx.request.req.pipe(zlib.createUnzip({ chunkSize }))
      : ctx.request.req;

    return rawParser(stream, rawParserOptions);
  },
};
