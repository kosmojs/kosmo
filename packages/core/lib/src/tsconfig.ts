import { defaults } from "./defaults";

export const generateTsconfig = (sourceFolder?: string) => {
  // biome-ignore lint: noTemplateCurlyInString
  const rootDir = "${configDir}";

  const compilerOptions = {
    types: ["@types/node", "@types/deno", "@types/bun"],
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
        `${rootDir}/`,
        `${rootDir}/../../${defaults.libDir}/${sourceFolder}/`,
        `${rootDir}/../../${defaults.libDir}/env.d.ts`,
        `${rootDir}/../../**/*.d.ts`,
      ],
      compilerOptions: {
        ...compilerOptions,
        jsx: "preserve",
        types: [...compilerOptions.types, "vite/client"],
        paths: {
          [`${defaults.appPrefix}/*`]: [`${rootDir}/../../*`],
          [`${defaults.srcPrefix}/*`]: [`${rootDir}/*`],
          [`${defaults.libPrefix}/*`]: [
            `${rootDir}/../../${defaults.libDir}/${sourceFolder}/*`,
          ],
        },
      },
    };
  }

  return {
    include: [`${rootDir}/`, `${rootDir}/${defaults.libDir}/**/*.d.ts`],
    exclude: [
      `${rootDir}/${defaults.srcDir}/`,
      `${rootDir}/${defaults.libDir}/`,
    ],
    compilerOptions: {
      ...compilerOptions,
      paths: {
        [`${defaults.appPrefix}/*`]: [`${rootDir}/*`],
      },
    },
  };
};
