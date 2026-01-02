import Koa from "koa";

import withQueryparser from "@/queryparser";

import type { AppOptions } from "./types";

export const createApp = (options?: AppOptions) => {
  return withQueryparser(new Koa(options));
};
