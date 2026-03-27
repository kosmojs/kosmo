import type { DefineGenerator, DefineGeneratorFactory } from "./types";

export const defineGenerator: DefineGenerator = (f) => f as never;

export const defineGeneratorFactory: DefineGeneratorFactory = (f) => f;
