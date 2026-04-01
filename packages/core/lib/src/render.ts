import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import crc from "crc/crc32";
import handlebars from "handlebars";

import type { PageRoute } from "@kosmojs/core";

import { pathExists } from "./paths";

export type RenderOptions = {
  noEscape?: boolean;
  // handlebars instance
  renderer?: typeof handlebars;
};

export type FactoryOptions = RenderOptions & {
  partials?: Record<string, string>;
  helpers?: Record<string, (...a: Array<never>) => unknown>;
  outdir?: string;
  /**
   * Controls whether to overwrite an existing file.
   * - `false`: skip writing if the file already exists
   * - `true` (default): always overwrite
   * - function: custom logic to decide whether to overwrite, based on current file content
   * */
  overwrite?: boolean | ((fileContent: string) => boolean);
};

export const render = <Context = object>(
  template: string,
  context: Context,
  options?: RenderOptions,
): string => {
  const { noEscape = true, renderer = handlebars } = { ...options };
  return renderer.compile(template, { noEscape })(context);
};

export const renderToFile = async <Context = object>(
  file: string,
  template: string,
  context: Context,
  options?: RenderOptions & Pick<FactoryOptions, "overwrite">,
): Promise<void> => {
  const content = render(template, context, options);

  /**
   * Two fs calls (exists + read) are worth it to avoid touching the file
   * and triggering watchers unnecessarily.
   * */
  if (await pathExists(file)) {
    const { overwrite = true } = { ...options };
    if (overwrite === false) {
      return;
    }
    const fileContent = await readFile(file, "utf8");
    if (typeof overwrite === "function" && !overwrite(fileContent)) {
      return;
    }
    if (crc(content) === crc(fileContent)) {
      return;
    }
  }

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content, "utf8");
};

export const renderFactory = (options?: FactoryOptions) => {
  const createRenderer = (selfOoptions?: FactoryOptions) => {
    const renderer = handlebars.create();

    renderer.registerPartial({
      ...options?.partials,
      ...selfOoptions?.partials,
    } as never);

    renderer.registerHelper({
      ...options?.helpers,
      ...selfOoptions?.helpers,
    } as never);

    return renderer;
  };

  return {
    render<Context = object>(
      template: string,
      context: Context,
      selfOoptions?: FactoryOptions,
    ) {
      return render(template, context, {
        ...options,
        ...selfOoptions,
        renderer: createRenderer(selfOoptions),
      });
    },
    async renderToFile<Context = object>(
      file: string,
      template: string,
      context: Context,
      selfOoptions?: FactoryOptions,
    ) {
      return renderToFile(
        options?.outdir ? join(options.outdir, file) : file,
        template,
        context,
        {
          ...options,
          ...selfOoptions,
          renderer: createRenderer(selfOoptions),
        },
      );
    },
  };
};

export const renderHelpers = {
  createParamsLiteral: (params: PageRoute["params"]) => {
    return params.schema
      .map((p) => {
        return p.kind === "splat"
          ? `${p.const}?: Array<string | number>`
          : p.kind === "optional"
            ? `${p.const}?: string | number`
            : `${p.const}: string | number`;
      })
      .join(", ");
  },
};
