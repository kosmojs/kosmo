import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import crc from "crc/crc32";

/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version; this external
 * import resolves to the actual published package.json.
 * */
import self from "@kosmojs/dev/package.json" with { type: "json" };
import {
  pathExists,
  pathResolver,
  type RouteResolverCache,
  type RouteResolverCacheFactory,
} from "@kosmojs/lib";

export const cacheFactory: RouteResolverCacheFactory = (
  route,
  sourceFolder,
  extraContext,
) => {
  const cacheFile = pathResolver(sourceFolder).createPath.libApi(
    dirname(route.file),
    "cache.json",
  );

  const validateCache = async (cache: RouteResolverCache) => {
    if (!cache?.hash) {
      return;
    }

    if (!cache.typeDeclarations || !cache.referencedFiles) {
      // incomplete cache
      return;
    }

    const hash = await generateFileHash(route.fileFullpath, {
      ...extraContext,
    });

    if (!identicalHashSum(cache.hash, hash)) {
      // route itself updated
      return;
    }

    for (const [file, hash] of Object.entries(cache.referencedFiles)) {
      if (
        !identicalHashSum(
          hash,
          await generateFileHash(resolve(sourceFolder.root, file)),
        )
      ) {
        // some referenced file updated
        return;
      }
    }

    return cache;
  };

  return {
    async get(opt?: { validate?: boolean }) {
      if (await pathExists(cacheFile)) {
        try {
          const cache = JSON.parse(await readFile(cacheFile, "utf8"));
          return opt?.validate //
            ? validateCache(cache)
            : cache;
        } catch (_e) {}
      }
      return undefined;
    },

    async set(cache) {
      const hash = await generateFileHash(route.fileFullpath, {
        ...extraContext,
      });

      const referencedFiles: Record<string, number> = {};

      for (const file of cache.referencedFiles) {
        referencedFiles[
          // Strip project root to ensure cached paths are relative
          // and portable across environments (CI, local, etc.)
          file.replace(`${sourceFolder.root}/`, "")
        ] = await generateFileHash(file);
      }

      const value = { ...cache, hash, referencedFiles };

      await mkdir(dirname(cacheFile), { recursive: true });
      await writeFile(cacheFile, JSON.stringify(value, null, 2), "utf8");

      return value;
    },
  };
};

const generateFileHash = async (
  file: string,
  extraContext?: object,
): Promise<number> => {
  let fileContent: string | undefined;
  try {
    fileContent = await readFile(file, "utf8");
  } catch (_e) {
    // file could be deleted since last build
    return 0;
  }
  return fileContent
    ? crc(
        JSON.stringify({
          ...extraContext,
          [self.cacheVersion]: fileContent,
        }),
      )
    : 0;
};

// return true if sums are identical
const identicalHashSum = (a: number, b: number) => {
  return a === b;
};
