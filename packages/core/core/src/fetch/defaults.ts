import type { Defaults } from "./types";
import { stringify } from "./utils";

export const defaults = {
  responseMode: "json",
  stringify,
  errorHandler: console.error,
} satisfies Defaults;
