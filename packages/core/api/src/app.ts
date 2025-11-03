import Koa from "koa";

import withQueryparser from "@kosmojs/api/queryparser";

import type { CreateApp } from "./types";

export const createApp: CreateApp = (options) => {
  return withQueryparser(new Koa(options));
};
