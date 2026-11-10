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

type Renderer = typeof handlebars;

// Precompiled template specs, shared by every Handlebars instance.
// Precompiling (parse + codegen) is the bulk of render() time,
// and the same few templates are rendered once per route.
// Keyed by template text, so the cache is bounded by the templates shipped,
// not by the number of routes.
const specCache = new Map<string, TemplateSpecification>();

// specs bound to a given instance, so its own helpers and partials apply
const boundCache = new WeakMap<
  Renderer,
  Map<string, HandlebarsTemplateDelegate>
>();

const compileTemplate = (
  renderer: Renderer,
  template: string,
  noEscape: boolean,
): HandlebarsTemplateDelegate => {
  const key = `${noEscape ? 1 : 0}:${template}`;

  let bound = boundCache.get(renderer);

  if (!bound) {
    bound = new Map();
    boundCache.set(renderer, bound);
  }

  let compiled = bound.get(key);

  if (!compiled) {
    let spec = specCache.get(key);
    if (!spec) {
      // precompile returns the spec as JS source, despite its typing
      const source = handlebars.precompile(template, {
        noEscape,
      }) as unknown as string;
      spec = new Function(`return ${source}`)() as TemplateSpecification;
      specCache.set(key, spec);
    }
    compiled = renderer.template(spec);
    bound.set(key, compiled);
  }

  return compiled;
};

export const render = <Context = object>(
  template: string,
  context: Context,
  options?: RenderOptions,
): string => {
  const { noEscape = true, renderer = handlebars } = { ...options };
  return compileTemplate(renderer, template, noEscape)(context);
};

export const renderToFile = async <Context = object>(
  file: string,
  template: string,
  context: Context,
  options?: RenderOptions &
    Pick<FactoryOptions, "overwrite"> & {
      render?: typeof render;
    },
): Promise<void> => {
  const content = options?.render
    ? options.render(template, context, options)
    : render(template, context, options);

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

  // one instance for the factory, so its partials compile once
  // and its templates stay bound; calls bringing their own partials
  // or helpers get an instance of their own
  let factoryRenderer: Renderer | undefined;

  const resolveRenderer = (selfOoptions?: FactoryOptions) => {
    if (selfOoptions?.partials || selfOoptions?.helpers) {
      return createRenderer(selfOoptions);
    }
    factoryRenderer ??= createRenderer();
    return factoryRenderer;
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
        renderer: resolveRenderer(selfOoptions),
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
          renderer: resolveRenderer(selfOoptions),
        },
      );
    },
  };
};
