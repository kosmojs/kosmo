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
export const PAGE_INDEX_PATTERN = `${PAGE_INDEX_BASENAME}.{tsx,vue}`;

export const PAGE_LAYOUT_BASENAME = "layout";
export const PAGE_LAYOUT_PATTERN = `${PAGE_LAYOUT_BASENAME}.{tsx,vue}`;

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
 * Sort routes so that more specific (static) paths come before dynamic ones.
 *
 * This is important because dynamic segments are more general,
 * and can match values that should be routed to more specific static paths.
 *
 * For example, given:
 *   - `/users/account`
 *   - `/users/[id]`
 *
 * If `/users/[id]` comes first, visiting `/users/account` would incorrectly match it,
 * treating "account" as an `id`. So static routes must take precedence.
 *
 * Specificity is calculated per segment with fixed weights:
 *   - static segment:   4 (most specific, exact match)
 *   - mixed segment:    3 (has both static and dynamic parts)
 *   - required param:   2 (matches any single segment)
 *   - optional param:   1 (may or may not match)
 *   - splat param:      0 (matches anything, least specific)
 *
 * Fixed per-segment weights ensure that deeply nested mixed segments
 * never outscore multiple static segments.
 * */
export const sortRoutes = (
  a: Pick<RouteEntry, "name" | "pathTokens">,
  b: Pick<RouteEntry, "name" | "pathTokens">,
): number => {
  const aSpecificity = routeSpecificity(a.pathTokens);
  const bSpecificity = routeSpecificity(b.pathTokens);

  // higher specificity = higher priority
  if (aSpecificity !== bSpecificity) {
    return bSpecificity - aSpecificity;
  }

  // at equal specificity, shallower = higher priority
  if (a.pathTokens.length !== b.pathTokens.length) {
    return a.pathTokens.length - b.pathTokens.length;
  }

  // deterministic tiebreaker
  return a.name.localeCompare(b.name);
};

/**
 * Weight of a single param part, used for pure param segments.
 * */
const paramWeight = (part: PathTokenParamPart): number => {
  return {
    required: 2,
    optional: 1,
    splat: 0,
  }[part.kind];
};

const mixedSegmentWeight = (parts: PathToken["parts"]): number => {
  const hasSplat = parts.some((p) => {
    return p.type === "param" ? p.kind === "splat" : false;
  });
  return hasSplat ? 0.5 : 3;
};

/**
 * Weight of a single path segment.
 *
 * Uses fixed values per segment kind to prevent
 * complex mixed segments from outscoring multiple statics.
 * */
const segmentWeight = (token: PathToken): number => {
  return {
    static: 4,
    mixed: mixedSegmentWeight(token.parts),
    param: paramWeight(token.parts[0] as PathTokenParamPart),
  }[token.kind];
};

/**
 * Total route specificity: sum of all segment weights.
 * */
const routeSpecificity = (pathTokens: Array<PathToken>): number => {
  return pathTokens.reduce((sum, token) => sum + segmentWeight(token), 0);
};
