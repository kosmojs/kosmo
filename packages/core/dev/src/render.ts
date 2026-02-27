import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import crc from "crc/crc32";
import handlebars from "handlebars";

import { pathExists } from "./fs";
import type { PageRoute } from "./types";

export type RenderOptions = {
  noEscape?: boolean;
  // handlebars instance
  renderer?: typeof handlebars;
};

export type FactoryOptions = RenderOptions & {
  /**
   * Controls whether to overwrite an existing file.
   * - `false`: skip writing if the file already exists
   * - `true` (default): always overwrite
   * - function: custom logic to decide whether to overwrite, based on current file content
   */
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
  options?: FactoryOptions,
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

export const renderFactory = (
  options?: FactoryOptions & {
    outdir?: string;
    partials?: Record<string, string>;
    helpers?: Record<string, (...a: Array<never>) => unknown>;
  },
) => {
  const renderer = handlebars.create();

  renderer.registerPartial({ ...options?.partials } as never);

  renderer.registerHelper({ ...options?.helpers } as never);

  return {
    render<Context = object>(
      template: string,
      context: Context,
      selfOoptions?: FactoryOptions,
    ) {
      return render(template, context, {
        renderer,
        ...options,
        ...selfOoptions,
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
        { renderer, ...options, ...selfOoptions },
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
