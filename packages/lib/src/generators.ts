import type {
  GeneratorFactory,
  GeneratorMeta,
  SourceFolder,
} from "@kosmojs/core";

export const defineGenerator = <T extends object, R extends boolean = false>({
  meta,
  factory,
}: {
  meta: GeneratorMeta;
  factory: (
    f: SourceFolder,
    o: R extends true
      ? { meta: GeneratorMeta; options: T }
      : { meta: GeneratorMeta },
  ) => GeneratorFactory;
}): R extends true
  ? ((o: T) => {
      meta: GeneratorMeta;
      options: T;
      factory: (f: SourceFolder) => GeneratorFactory;
    }) & { meta: GeneratorMeta }
  : (() => {
      meta: GeneratorMeta;
      options?: T;
      factory: (f: SourceFolder) => GeneratorFactory;
    }) & { meta: GeneratorMeta } => {
  const wrapper = ((options?: T) => {
    return {
      meta,
      factory: (folder: SourceFolder) => {
        return options
          ? factory(folder, { meta, options } as never)
          : factory(folder, { meta } as never);
      },
      ...(options === undefined ? {} : { options }),
    };
  }) as never;

  Object.assign(wrapper, { meta });

  return wrapper;
};

export const defineGeneratorFactory = <
  T extends object,
  R extends boolean = false,
>(
  factory: (
    f: SourceFolder,
    o: R extends true
      ? { meta: GeneratorMeta; options: T }
      : { meta: GeneratorMeta; options?: T },
  ) => GeneratorFactory,
) => factory;
