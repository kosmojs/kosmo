import { defaults } from "./defaults";
import type { SourceFolder } from "./types";

export const typeboxLiteralText = (
  text: string,
  sourceFolder: SourceFolder,
) => {
  const { refineTypeName = defaults.refineTypeName } = sourceFolder.config;
  return [
    // Escape backticks for safe use in template literals
    [/(?<!\\)`/g, "\\`"],
    // Escape $ for safe use in template literals
    [/(?<!\\)\$\{/g, "\\${"],
    /**
     * TypeBox's built-in `Options` type is not configurable.
     * To allow a custom type name, exposing `refineTypeName` option,
     * defaulted to VRefine, then renaming it to `Options`.
     * */
    [new RegExp(`\\b${refineTypeName}\\s*<`, "g"), "Options<"],
  ].reduce((text, [a, b]) => text.replace(a, b as never), text);
};
