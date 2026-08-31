import type {
  ApiRoute,
  GeneratorFactory,
  GeneratorSignature,
  ResolvedEntry,
  SourceFolder,
  VirtualModule,
  WatcherEvent,
} from "@kosmojs/core";

export const defineGenerator = <O extends object, R extends boolean = false>({
  meta,
  factory,
  dependencies,
  devDependencies,
}: Omit<GeneratorSignature, "factory"> & {
  factory: (f: SourceFolder, o?: O) => GeneratorFactory;
}): [R] extends [true]
  ? ((o: O) => GeneratorSignature) &
      Pick<GeneratorSignature, "meta" | "dependencies" | "devDependencies">
  : ((o?: O) => GeneratorSignature) &
      Pick<GeneratorSignature, "meta" | "dependencies" | "devDependencies"> => {
  const wrapper = ((options?: O) => {
    return {
      meta,
      factory: (folder: SourceFolder) => factory(folder, options),
      dependencies,
      devDependencies,
      options,
    };
  }) as never;

  Object.assign(wrapper, { meta, dependencies, devDependencies });

  return wrapper;
};

export const defineGeneratorFactory = <O extends object>(
  factory: (f: SourceFolder, o?: O) => GeneratorFactory,
) => factory;

/**
 * Filter watched API routes by event.
 * Handle 3 cases:
 * - event is undefined (means initial call): process all routes.
 * - `create` event given: process newly added route.
 *   Files can arrive already containing content (git checkout, cp) -
 *   clients must generate on create, not only on a subsequent update.
 * - `update` event given: process the updated route,
 *    and any route referencing the updated file (shared types).
 * */
export const createWatchedApiRouteEntriesFilter = (
  event: WatcherEvent | undefined,
  eventsOfInterest: Array<WatcherEvent["kind"]>,
) => {
  return ({ kind, entry }: ResolvedEntry) => {
    if (!event) {
      // no event (initial call), process all routes
      return true;
    }
    if (!eventsOfInterest.includes(event.kind)) {
      return false;
    }
    if (kind === "apiRoute" || kind === "apiUse") {
      return entry.fileFullpath !== event.file
        ? (entry as ApiRoute).referencedFiles?.includes(event.file)
        : true;
    }
    return false;
  };
};
/**
 * Filter watched page routes by event.
 * Handle 3 cases:
 * - event is undefined (means initial call): process all routes.
 * - `create` event given: process newly added route.
 *   Files can arrive already containing content (git checkout, cp) -
 *   clients must generate on create, not only on a subsequent update.
 * - `update` event given: process the updated route,
 *    and any route referencing the updated file (shared types).
 * */
export const createWatchedPageRouteEntriesFilter = (
  event: WatcherEvent | undefined,
  eventsOfInterest: Array<WatcherEvent["kind"]>,
) => {
  return ({ kind, entry }: ResolvedEntry) => {
    if (!event) {
      // no event (initial call), process all routes
      return true;
    }
    if (!eventsOfInterest.includes(event.kind)) {
      return false;
    }
    return kind === "pageRoute" || kind === "pageLayout"
      ? entry.fileFullpath === event.file
      : false;
  };
};

/**
 * Gather virtual modules declared by a folder's generators.
 * Feed the result to `vitePlugins.virtualModules()`,
 * with `kind: "ssr"` on the SSR builds and `kind: "csr"` everywhere else.
 * */
export const collectVirtualModules = (
  sourceFolder: SourceFolder,
  generators: Array<GeneratorSignature>,
): Array<VirtualModule> => {
  return generators.flatMap(({ factory }) => {
    return factory(sourceFolder).virtualModules?.() || [];
  });
};
