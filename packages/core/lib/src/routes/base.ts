import { dirname, join, resolve } from "node:path";
import { styleText } from "node:util";

import crc from "crc/crc32";
import picomatch from "picomatch";
import { glob } from "tinyglobby";

import type {
  PathToken,
  PathTokenParamPart,
  ResolvedEntry,
  RouteEntry,
  SourceFolder,
} from "@kosmojs/core";

import { defaults } from "../defaults";
import { pathResolver } from "../paths";
import {
  createHonoPattern,
  createPathPattern,
  pathTokensFactory,
} from "./paths";

export type ResolverSignature = {
  name: string;
  handler: (updatedFile?: string) => Promise<ResolvedEntry>;
};

export const API_INDEX_BASENAME = "index";
export const API_INDEX_PATTERN = `${API_INDEX_BASENAME}.ts`;

export const API_USE_BASENAME = "use";
export const API_USE_PATTERN = `${API_USE_BASENAME}.ts`;

export const PAGE_INDEX_BASENAME = "index";
export const PAGE_INDEX_PATTERN = `${PAGE_INDEX_BASENAME}.{tsx,vue,mdx,md}`;

export const PAGE_LAYOUT_BASENAME = "layout";
export const PAGE_LAYOUT_PATTERN = `${PAGE_LAYOUT_BASENAME}.{tsx,vue,mdx}`;

const ROUTE_FILE_PATTERNS = [
  // match index files in api dir
  `${defaults.apiDir}/**/${API_INDEX_PATTERN}`,
  // match use files in api dir
  `${defaults.apiDir}/**/${API_USE_PATTERN}`,
  // match index files in pages dir
  `${defaults.pagesDir}/**/${PAGE_INDEX_PATTERN}`,
  // match layout files in pages dir
  `${defaults.pagesDir}/**/${PAGE_LAYOUT_PATTERN}`,
];

export const scanRoutes = async (sourceFolder: SourceFolder) => {
  const { createPath } = pathResolver(sourceFolder);
  return glob(ROUTE_FILE_PATTERNS, {
    cwd: createPath.src(),
    absolute: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: [
      // ignore top-level matches, routes resides in folders, even index route
      `${defaults.apiDir}/${API_INDEX_PATTERN}`,
      `${defaults.apiDir}/${API_USE_PATTERN}`,
      `${defaults.pagesDir}/${PAGE_INDEX_PATTERN}`,
      `${defaults.pagesDir}/${PAGE_LAYOUT_PATTERN}`,
    ],
  });
};

export const isRouteFile = (
  file: string,
  sourceFolder: SourceFolder,
):
  | [
      // Either `apiDir` or `pagesDir`
      folder: string,
      // Path to a file within the folder, nested at least one level deep
      file: string,
    ]
  | false => {
  const [
    // source folder name
    _sourceFolder,
    // route folder, api or pages
    _folder,
    ...rest
  ] = resolve(sourceFolder.root, file)
    .replace(`${sourceFolder.root}/${defaults.srcDir}/`, "")
    .split("/");

  /**
   * Ensure the file:
   * - is under the correct source root
   * - belongs to a known route folder (`api/` or `pages/`)
   * - is nested at least one level deep (not a direct child of the folder)
   * */
  if (!_folder || _sourceFolder !== sourceFolder.name || rest.length < 2) {
    return false;
  }

  return picomatch.isMatch(join(_folder, ...rest), ROUTE_FILE_PATTERNS)
    ? [_folder, rest.join("/")]
    : false;
};

export const isApiRoute = (file: string) => {
  return picomatch.matchBase(file, `**/${API_INDEX_PATTERN}`);
};

export const isApiUse = (file: string) => {
  return picomatch.matchBase(file, `**/${API_USE_PATTERN}`);
};

export const isPageRoute = (file: string) => {
  return picomatch.matchBase(file, `**/${PAGE_INDEX_PATTERN}`);
};

export const isPageLayout = (file: string) => {
  return picomatch.matchBase(file, `**/${PAGE_LAYOUT_PATTERN}`);
};

export const createRouteEntry = (
  fileFullpath: string,
  sourceFolder: SourceFolder,
): RouteEntry | undefined => {
  // scanner already is doing a great job on matching only relevant files
  // but doing a double check here to make sure only needed files added to stack
  const resolvedPaths = isRouteFile(fileFullpath, sourceFolder);

  if (!resolvedPaths) {
    return;
  }

  const [folder, file] = resolvedPaths;

  const id = `${file.replace(/\W+/g, "_")}_${crc(file)}`;
  const name = dirname(file);

  try {
    const pathTokens = pathTokensFactory(dirname(file));
    return {
      id,
      name,
      folder,
      file,
      fileFullpath,
      pathTokens,
      pathPattern: createPathPattern(pathTokens),
      honoPattern: createHonoPattern(pathTokens),
    };
  } catch (
    // biome-ignore lint: any
    error: any
  ) {
    console.error(
      `❗${styleText("red", "ERROR")}: Failed parsing path for "${styleText("cyan", file)}"`,
    );
    console.error(error);
    return;
  }
};

/**
 * Weight of a single path segment.
 *
 * Fixed values per kind prevent complex mixed segments
 * from outscoring multiple statics.
 *
 *   static:   4  (exact match, most specific)
 *   mixed:    3+ (static + param parts; more statics = slightly higher)
 *   required: 2  (matches any single segment)
 *   optional: 1  (may or may not match)
 *   splat:    0  (matches anything, least specific)
 * */
const segmentWeight = (token: PathToken): number => {
  if (token.kind === "static") {
    return 4;
  }

  if (token.kind === "mixed") {
    let statics = 0;
    let optionals = 0;

    for (const part of token.parts) {
      if (part.type === "static") {
        statics += 1;
      } else if (part.kind === "optional" || part.kind === "splat") {
        optionals += 1;
      }
    }

    // unconditional statics contribute positively,
    // optionals penalize to avoid beating fully-static mixed routes
    return 3 + statics * 0.01 - optionals * 0.005;
  }

  const part = token.parts[0] as PathTokenParamPart;

  switch (part.kind) {
    case "required":
      return 2;
    case "optional":
      return 1;
    case "splat":
      return 0;
  }
};

/**
 * Compare two route entries for registration order.
 *
 * More specific routes sort first (higher priority).
 * Segments are compared left-to-right; first difference wins.
 *
 * When one route is a prefix of the other, the trailing segment
 * determines order: a trailing splat loses (shorter sibling first),
 * anything else wins (longer route is more specific).
 *
 * At equal weight and length, lexicographic tiebreak ensures
 * deterministic ordering across JS engines.
 * */
export const sortRoutes = (a: RouteEntry, b: RouteEntry): number => {
  const pairs = Array.from(
    { length: Math.max(a.pathTokens.length, b.pathTokens.length) },
    (_, i) => [a.pathTokens[i], b.pathTokens[i]] as const,
  );

  for (const [at, bt] of pairs) {
    if (!at || !bt) {
      // one route ran out of segments - check what the extra segment is
      const extra = at ?? bt;

      const isSplat =
        extra?.kind === "param"
          ? (extra.parts[0] as PathTokenParamPart).kind === "splat"
          : false;

      if (isSplat) {
        // trailing splat: shorter sibling registers first
        return at ? 1 : -1;
      }

      // trailing non-splat: longer route is more specific, registers first
      return at ? -1 : 1;
    }

    const aw = segmentWeight(at);
    const bw = segmentWeight(bt);

    if (aw !== bw) {
      return bw - aw;
    }
  }

  // same weight profile, same length: deterministic tiebreak
  return a.pathPattern.localeCompare(b.pathPattern);
};
