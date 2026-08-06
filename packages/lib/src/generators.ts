import type {
  GeneratorFactory,
  GeneratorSignature,
  SourceFolder,
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
