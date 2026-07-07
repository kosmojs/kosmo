import Type from "typebox";

/**
 * Custom types for JavaScript constructs that have no JSON Schema
 * representation (Date, File, Blob, Buffer, ArrayBuffer).
 *
 * Each entry is a factory so every use site gets a fresh schema instance,
 * matching the previous behaviour of `new TDate()` etc.
 * */

const customType = <T>(
  check: (value: unknown) => value is T,
  message: string,
) => Type.Refine(Type.Unsafe<T>({}), check, () => message);

export const TDate = () => {
  return customType(
    (value): value is Date => value instanceof Date,
    "must be Date",
  );
};

export const TFile = () => {
  return customType(
    (value): value is File => value instanceof File,
    "must be File",
  );
};

export const TBlob = () => {
  return customType(
    (value): value is Blob => value instanceof Blob,
    "must be Blob",
  );
};

export const TBuffer = () => {
  return customType(
    (value): value is Buffer =>
      typeof Buffer !== "undefined" && Buffer.isBuffer(value),
    "must be Buffer",
  );
};

export const TArrayBuffer = () => {
  return customType(
    (value): value is ArrayBuffer => value instanceof ArrayBuffer,
    "must be ArrayBuffer",
  );
};

export default {
  Date: TDate(),
  File: TFile(),
  Blob: TBlob(),
  Buffer: TBuffer(),
  ArrayBuffer: TArrayBuffer(),
};
