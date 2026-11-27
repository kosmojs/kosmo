import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import type { DeepPartial, ProjectSettings, SourceFolder } from "@kosmojs/core";
import { createTemplateResolver } from "@kosmojs/lib";

const createSetup = (config: DeepPartial<SourceFolder["config"]>) => {
  const folder: SourceFolder = {
    name: "test",
    config: config as never,
    generators: [],
    envSources: [],
  };

  const project: ProjectSettings = {
    root: resolve(import.meta.dirname, "@fixtures/app"),
    mode: "test",
    sourceFolders: [folder],
    devHost: "",
    previewHost: "",
    distDir: "",
  };

  return [project, folder] as const;
};

const backendVariants = {
  "index-and-use": {
    index: "api/index-and-use/index.tpl\n",
    use: "api/index-and-use/use.tpl\n",
  },

  "index-only": {
    index: "api/index-only/index.tpl\n",
  },

  "use-only": {
    use: "api/use-only/use.tpl\n",
  },
} as const;

const frontendVariants = {
  "index-and-layout": {
    index: "pages/index-and-layout/index.tpl\n",
    layout: "pages/index-and-layout/layout.tpl\n",
  },

  "index-and-page": {
    index: "pages/index-and-page/index.tpl\n",
    page: "pages/index-and-page/page.tpl\n",
  },

  "index-and-page-with-layout": {
    index: "pages/index-and-page-with-layout/index.tpl\n",
    page: "pages/index-and-page-with-layout/page.tpl\n",
    layout: "pages/index-and-page-with-layout/layout.tpl\n",
  },

  "index-only": {
    index: "pages/index-only/index.tpl\n",
  },

  "layout-only": {
    layout: "pages/layout-only/layout.tpl\n",
  },

  "page-only": {
    page: "pages/page-only/page.tpl\n",
  },

  "page-with-layout": {
    page: "pages/page-with-layout/page.tpl\n",
    layout: "pages/page-with-layout/layout.tpl\n",
  },
} as const;

for (const [scope, variants] of [
  ["backend", Object.entries(backendVariants)],
  ["frontend", Object.entries(frontendVariants)],
] as const) {
  describe(`${scope}: exact match`, async () => {
    for (const [variant, files] of variants) {
      test(variant, async () => {
        const [project, folder] = createSetup({
          [scope]: {
            templates: {
              [variant]: `../../templates/${scope}/${variant}`,
            },
          },
        });

        const resolver = createTemplateResolver(project, folder, scope);
        const templates = await resolver(variant);

        expect(files).toEqual(templates);
      });
    }
  });

  describe(`${scope}: *`, () => {
    for (const [variant, files] of variants) {
      test(variant, async () => {
        const [project, folder] = createSetup({
          [scope]: {
            templates: {
              [`${variant}/*`]: `../../templates/${scope}/${variant}`,
            },
          },
        });

        const resolver = createTemplateResolver(project, folder, scope);
        const templates = await resolver(`${variant}/a`);

        expect(files).toEqual(templates);
      });

      test(`${variant}: too shallow`, async () => {
        const [project, folder] = createSetup({
          [scope]: {
            templates: {
              [`${variant}/*`]: `../../templates/${scope}/${variant}`,
            },
          },
        });

        const resolver = createTemplateResolver(project, folder, scope);
        const templates = await resolver(variant);

        expect({}).toEqual(templates);
      });

      test(`${variant}: too deep`, async () => {
        const [project, folder] = createSetup({
          [scope]: {
            templates: {
              [`${variant}/*`]: `../../templates/${scope}/${variant}`,
            },
          },
        });

        const resolver = createTemplateResolver(project, folder, scope);
        const templates = await resolver(`${variant}/a/b/c`);

        expect({}).toEqual(templates);
      });
    }
  });

  describe(`${scope}: **`, () => {
    for (const [variant, files] of variants) {
      test(variant, async () => {
        const [project, folder] = createSetup({
          [scope]: {
            templates: {
              [`${variant}/**`]: `../../templates/${scope}/${variant}`,
            },
          },
        });

        const resolver = createTemplateResolver(project, folder, scope);

        {
          const templates = await resolver(variant);
          expect(files).toEqual(templates);
        }

        {
          const templates = await resolver(`${variant}/a`);
          expect(files).toEqual(templates);
        }

        {
          const templates = await resolver(`${variant}/a/b/c`);
          expect(files).toEqual(templates);
        }
      });
    }
  });

  describe(`${scope}: priority`, () => {
    test("most specific first", async () => {
      const [project, folder] = createSetup({
        [scope]: {
          templates: {
            ["docs"]: `../../templates/${scope}/${variants[0][0]}`,
            ["docs/*"]: `../../templates/${scope}/${variants[1][0]}`,
            ["docs/**"]: `../../templates/${scope}/${variants[2][0]}`,
          },
        },
      });

      const resolver = createTemplateResolver(project, folder, scope);

      {
        const templates = await resolver("docs");
        expect(variants[0][1]).toEqual(templates);
      }

      {
        const templates = await resolver("docs/a");
        expect(variants[1][1]).toEqual(templates);
      }

      {
        const templates = await resolver("docs/a/b/c");
        expect(variants[2][1]).toEqual(templates);
      }
    });
  });
}
