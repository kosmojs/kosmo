import zlib from "node:zlib";

import Formidable, { type Options as FormidableOptions } from "formidable";
import rawParser from "raw-body";

import {
  parseCookies,
  parseSearchParams,
  type RequestBodyTarget,
  type RequestMetadataParser,
} from "@kosmojs/core";
import { createParamsNormalizers, type RouteSource } from "@kosmojs/core/api";

import type {
  DefaultContext,
  DefaultState,
  ParameterizedContext,
} from "../api";

import type { ParameterizedMiddleware } from "{{ createImport 'libApi' }}";

type Ctx = ParameterizedContext<
  Record<string, string>,
  DefaultState,
  DefaultContext
>;

export const createMetaparsers: (
  routeSource: RouteSource<ParameterizedMiddleware>,
  ctx: Ctx,
) => Record<RequestMetadataParser, () => unknown> = (routeSource, ctx) => {
  const {
    //
    normalizeParams,
    normalizeSearchParams,
  } = createParamsNormalizers<ParameterizedMiddleware>(routeSource);

  return {
    method() {
      return ctx.method;
    },

    pathname() {
      return ctx.path;
    },

    params() {
      return normalizeParams(ctx.path);
    },

    query() {
      return normalizeSearchParams(
        parseSearchParams(ctx.req.url ?? ""),
        ctx.method,
      );
    },

    headers() {
      return ctx.req.headers;
    },

    cookies() {
      return parseCookies(ctx.req.headers);
    },
  };
};

type JsonOptions = {
  limit?: number;
};

/**
 * Controls whether parsed field values are unwrapped from arrays.
 *
 * By default, all field values are returned as arrays (formidable v3 behavior),
 * since forms can submit multiple values under the same field name.
 *
 * - `false` (default) - no unwrapping, all values remain as arrays
 * - `true` - unwrap all fields; single-element arrays become scalars
 * - `{ only: string[] }` - unwrap only the specified fields
 * - `{ except: string[] }` - unwrap all fields except the specified ones
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
  form: FormOptions | MultipartOptions;
  raw: RawOptions;
} = {
  json: {
    limit: 1024 ** 2,
  },
  form: {
    limit: 1024 ** 2,
  },
  raw: {
    limit: 1024 ** 2,
  },
};

export type BodyparserOptions = {
  json: JsonOptions;
  form: FormOptions | MultipartOptions;
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
      if (opt === false) {
        return [k, v];
      }
      if (opt === undefined || opt === true) {
        return [k, v[0]];
      }
      const { only, except } = { ...opt } as Exclude<UnwrapControl, boolean>;
      if (only?.includes(k)) {
        return [k, v[0]];
      }
      return [k, !except || except.includes(k) ? v : v[0]];
    }),
  );
};

export const createBodyparsers: (
  routeSource: RouteSource<ParameterizedMiddleware>,
  ctx: Ctx,
) => {
  [T in RequestBodyTarget]: (opt?: BodyparserOptions[T]) => Promise<unknown>;
} = (_routeSource, ctx) => {
  const raw = async (opt: any): Promise<unknown> => {
    const { chunkSize, ...rawParserOptions } = { ...defaults.raw, ...opt };

    const encoding = ctx.request.headers["content-encoding"];
    const compressed = encoding ? encoding !== "identity" : false;

    const stream = compressed
      ? ctx.request.req.pipe(zlib.createUnzip({ chunkSize }))
      : ctx.request.req;

    // raw-body v4 returns a Promise if no callback provided
    return rawParser(stream, rawParserOptions);
  };

  return {
    async json(opt) {
      const body = await raw({
        ...opt,
        encoding: "utf-8",
      });
      return body ? JSON.parse(body as never) : undefined;
    },

    async form(opt) {
      const form = Formidable({
        maxFieldsSize: opt?.limit || defaults.form.limit,
        maxFileSize: opt?.limit || defaults.form.limit,
        ...opt,
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

    raw,
  };
};
