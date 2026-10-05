import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/**
 * Read the installed package.json at runtime to get the actual version.
 * A static import would be inlined by the bundler with the pre-bump version.
 *
 * INFO: For best compatibility, all packages should share the same version.
 * When bumping the version (even a patch) for a single package,
 * bump it for all packages to keep versions fully synchronized across the project.
 * */
export const { version: VERSION } = JSON.parse(
  readFileSync(
    createRequire(import.meta.url).resolve("@kosmojs/lib/package.json"),
    "utf-8",
  ),
);

export * from "./ast";
export * from "./format";
export * from "./generators";
export * from "./generic";
export * from "./paths";
export * from "./ports";
export * from "./render";
export * from "./routes";
export * from "./spinner";
export * from "./tsconfig";
export * from "./vite";
