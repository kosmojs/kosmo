import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import crc from "crc/crc32";
import handlebars from "handlebars";

import { pathExists } from "./paths";

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
  formatters?: Array<Formatter>;
};

type Formatter = (content: string, file: string) => string;

export const render = <Context = object>(
  template: string,
  context: Context,
  options?: RenderOptions,
): string => {
  const { noEscape = true, renderer = handlebars } = { ...options };
  return renderer.compile(template, { noEscape })(context);
};

export const renderAsFile = <Context = object>(
  file: string,
  template: string,
  context: Context,
  options?: Omit<FactoryOptions, "overwrite">,
): string => {
  const { formatters, ...renderOpts } = { ...options };
  const content = render(template, context, renderOpts);
  return Array.isArray(formatters)
    ? formatters.reduce((c, f) => f(c, file), content)
    : content;
};

export const renderToFile = async <Context = object>(
  file: string,
  template: string,
  context: Context,
  options?: FactoryOptions,
): Promise<void> => {
  const content = renderAsFile(file, template, context, options);

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
  if (options?.partials) {
    renderer.registerPartial(options.partials as never);
  }
  if (options?.helpers) {
    renderer.registerHelper(options.helpers as never);
  }
  return {
    render<Context = object>(template: string, context: Context) {
      return render(template, context, { renderer, ...options });
    },
    async renderToFile<Context = object>(
      file: string,
      template: string,
      context: Context,
    ) {
      return renderToFile(
        options?.outdir ? join(options.outdir, file) : file,
        template,
        context,
        { renderer, ...options },
      );
    },
  };
};
