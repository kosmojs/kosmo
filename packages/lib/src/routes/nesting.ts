import { posix } from "node:path";

import type { NestedRouteEntry, RouteEntry } from "@kosmojs/core";

import { isPageFile, isPageLayout, sortRoutes } from "./base";

export const nestedRoutesFactory = (routeEntries: Array<RouteEntry>) => {
  const entryStack = structuredClone(routeEntries).sort(sortRoutes);

  /**
   * Group entries by name (at the same level, both layout and index share same name).
   *
   * Handle 3 cases:
   *    - both page and layout exists
   *    - only page exists
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

      const page = nameEntries.find((e) => isPageFile(e.file)) as RouteEntry;
      const layout = nameEntries.find((e) => isPageLayout(e.file));

      if (page || layout) {
        return [
          {
            page: page
              ? {
                  ...page,
                  pathTokens: page.pathTokens.slice(
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
              findDescendantEntries(page || layout),
              page || layout,
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
   * Example: blog/post/[slug]/index.ts is a direct child of blog/index.ts
   * even though "post" segment exists (it has no index.ts).
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
      if (!entry.name.startsWith(posix.join(name, "/"))) {
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
        return child.name.startsWith(posix.join(intermediate.name, "/"));
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
      return entry.name.startsWith(posix.join(potential.name, "/"));
    });

    return !hasParent;
  });

  return transformEntries(rootEntries);
};
