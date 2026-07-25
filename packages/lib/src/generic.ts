import { mergeConfig, type UserConfig } from "vite";

export const mergeConfigs = (
  ...configs: Array<UserConfig | undefined>
): UserConfig => {
  return [
    {
      configFile: false,
      define: {
        KOSMO_PRODUCTION_BUILD: "false",
        KOSMO_SERVERSIDE_FETCH: "false",
      },
    },
    ...configs,
  ].reduce<UserConfig>(
    (config, prev) => mergeConfig(config || {}, prev || {}),
    {},
  );
};

export const escapeTemplateLiterals = (origin: string) => {
  return [
    // Escape backticks for safe use in template literals
    [/(?<!\\)`/g, "\\`"],
    // Escape $ for safe use in template literals
    [/(?<!\\)\$\{/g, "\\${"],
  ].reduce((text, [a, b]) => text.replace(a, b as never), origin);
};
