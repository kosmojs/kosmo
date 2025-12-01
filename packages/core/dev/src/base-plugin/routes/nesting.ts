import { basename } from "node:path";

import {
  type NestedRouteEntry,
  type RouteEntry,
  sortRoutes,
} from "@kosmojs/devlib";

import { PAGE_INDEX_BASENAME, PAGE_LAYOUT_BASENAME } from "./resolve";

/**
 * Build a nested route tree from flat route entries.
 * */
export const nestedRoutesFactory = (routeEntries: Array<RouteEntry>) => {
  const entryStack = structuredClone(routeEntries).sort(sortRoutes);

  /**
   * Group entries by name (at the same level, both layout and index share same name).
   *
   * Handle 3 cases:
   *    - both index and layout exists
   *    - only index exists
   *    - only layout exists
   *
   * */
  const transformEntries = (
    entries: Array<RouteEntry>,
    parent?: RouteEntry,
  ): Array<NestedRouteEntry> => {
    return [...new Set(entries.map((e) => e.name))].flatMap((name) => {
      const nameEntries = entryStack.flatMap(({ fileFullpath, ...entry }) => {
        return entry.name === name ? [entry] : [];
      });

      const index = nameEntries.find((e) =>
        basename(e.file).startsWith(PAGE_INDEX_BASENAME),
      ) as RouteEntry;

      const layout = nameEntries.find((e) =>
        basename(e.file).startsWith(PAGE_LAYOUT_BASENAME),
      ) as RouteEntry;

      if (index || layout) {
        return [
          {
            index: index
              ? {
                  ...index,
                  pathTokens: index.pathTokens.slice(
                    parent?.pathTokens.length || 0,
                  ),
                }
              : undefined,
            layout: layout
              ? {
                  ...layout,
                  pathTokens: layout.pathTokens.slice(
                    parent?.pathTokens.length || 0,
                  ),
                }
              : undefined,
            parent: parent?.name,
            children: transformEntries(
              findDescendantEntries(index || layout),
              index || layout,
            ),
          },
        ];
      }

      return [];
    });
  };

  /**
   * Recursively finds direct descendant routes.
   *
   * "Direct" means the next existing route in the path hierarchy,
   * skipping intermediate path segments that don't have index/layout files.
   *
   * Example: blog/post/[slug]/index.tsx is a direct child of blog/index.tsx
   * even though "post" segment exists (it has no index.tsx).
   * */
  const findDescendantEntries = ({
    name,
    pathTokens,
  }: RouteEntry): Array<RouteEntry> => {
    // Find all potential children - BOTH indexes AND layouts
    const potentialChildren = entryStack.filter((entry) => {
      // Must be deeper than current entry
      if (entry.pathTokens.length <= pathTokens.length) {
        return false;
      }
      // Must be a descendant path
      if (!entry.name.startsWith(`${name}/`)) {
        return false;
      }
      return true;
    });

    // Filter to direct children (no intermediate route between parent and child)
    return potentialChildren.filter((child) => {
      // Check if any route exists between parent and child
      const hasIntermediateRoute = potentialChildren.some((intermediate) => {
        if (intermediate === child) {
          return false;
        }
        // Intermediate must be between parent and child in depth
        if (intermediate.pathTokens.length <= pathTokens.length) {
          return false;
        }
        if (intermediate.pathTokens.length >= child.pathTokens.length) {
          return false;
        }
        // Child must be descendant of intermediate
        return child.name.startsWith(`${intermediate.name}/`);
      });

      return !hasIntermediateRoute;
    });
  };

  // Find root entries - entries that have no parent route
  const rootEntries = entryStack.filter((entry) => {
    // Check if any other entry could be its parent
    const hasParent = entryStack.some((potential) => {
      if (potential === entry) {
        return false;
      }
      if (potential.pathTokens.length >= entry.pathTokens.length) {
        return false;
      }
      return entry.name.startsWith(`${potential.name}/`);
    });

    return !hasParent;
  });

  return transformEntries(rootEntries);
};
