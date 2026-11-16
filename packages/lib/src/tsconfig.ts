import { defaults } from "@kosmojs/core";

export const generateTsconfig = (
  {
    dependencies,
    devDependencies,
  }: Record<"dependencies" | "devDependencies", Record<string, string>>,
  sourceFolder?: string,
) => {
  const { varDir, libDir, srcDir } = defaults;

  /**
   * Paths are relative to the generated file itself, not built on `${configDir}`.
   * An editor opens a file under the nearest tsconfig.json,
   * and for a file in var/lib that is this generated one, used as a project on its own.
   * `${configDir}` would then point at var/lib, not at the folder of the extending config.
   * Relative paths resolve against the file declaring them, so they hold either way.
   * */
  const rootDir = [varDir, libDir, ...(sourceFolder?.split("/") || [])]
    .map(() => "..")
    .join("/");

  const deps = Object.keys({ ...dependencies, ...devDependencies });

  const compilerOptions = {
    types: [
      "vite/client",
      ...["node", "deno", "bun"].flatMap((e) => {
        return deps.includes(`@types/${e}`) ? [`@types/${e}`] : [];
      }),
    ],
    moduleResolution: "bundler",
    module: "ESNext",
    target: "ESNext",
    strict: true,
    exactOptionalPropertyTypes: true,
    noImplicitAny: true,
    noImplicitThis: true,
    noImplicitOverride: true,
    noImplicitReturns: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    allowArbitraryExtensions: true,
    allowImportingTsExtensions: true,
    allowUnreachableCode: false,
    allowUnusedLabels: false,
    useUnknownInCatchVariables: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedSideEffectImports: true,
    resolveJsonModule: true,
    esModuleInterop: true,
    verbatimModuleSyntax: true,
    skipLibCheck: true,
    noEmit: true,
  };

  if (sourceFolder) {
    return {
      include: [
        "./",
        `${rootDir}/${srcDir}/${sourceFolder}/`,
        `${rootDir}/${varDir}/${libDir}/*.d.ts`,
      ],
      compilerOptions: {
        ...compilerOptions,
        types: [...compilerOptions.types],
        paths: {
          [`${defaults.appPrefix}/*`]: [`${rootDir}/*`],
          [`${defaults.srcPrefix}/*`]: [
            `${rootDir}/${srcDir}/${sourceFolder}/*`,
          ],
          [`${defaults.libPrefix}/*`]: ["./*"],
          [`${defaults.appSrcPrefix}/*`]: [`${rootDir}/${srcDir}/*`],
          [`${defaults.appLibPrefix}/*`]: [`${rootDir}/${varDir}/${libDir}/*`],
        },
      },
    };
  }

  return {
    compilerOptions: {
      ...compilerOptions,
      paths: {
        [`${defaults.appPrefix}/*`]: [`${rootDir}/*`],
        [`${defaults.appSrcPrefix}/*`]: [`${rootDir}/${srcDir}/*`],
        [`${defaults.appLibPrefix}/*`]: [`${rootDir}/${varDir}/${libDir}/*`],
      },
    },
  };
};
