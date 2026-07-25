import type { DefineGenerator, DefineGeneratorFactory } from "@kosmojs/core";

export const defineGenerator: DefineGenerator = (f) => f as never;

export const defineGeneratorFactory: DefineGeneratorFactory = (f) => f;
