import { type FormatConfig, format } from "oxfmt";

export const formatCode = async (
  code: string,
  filename: string,
  config?: FormatConfig,
) => {
  return format(filename, code, {
    sortImports: true,
    ...config,
  }).then((e) => (e.errors.length ? code : e.code));
};
