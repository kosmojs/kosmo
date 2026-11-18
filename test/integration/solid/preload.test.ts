import type { Page } from "playwright";
import { describe, expect, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { setupTestProject } from "../setup";

/**
 * A page's `preload` export is run by Solid Router with its own arguments -
 * on render, on client-side navigation and on link hover.
 *
 * The page renders what its preload returned, which the router hands over
 * as `props.data`, and records every call in the browser,
 * so both the call and its arguments are visible.
 * */
describe("preload", async ({ afterAll }) => {
  const {
    //
    bootstrapProject,
    createPageRoutes,
    withPageContent,
    withBrowserPage,
  } = await setupTestProject({ frontend: "solid" });

  const teardown = await bootstrapProject(async () => {
    await createPageRoutes(
      [{ name: "preload" }, { name: "preload/[id]" }],
      async ({ name }) => {
        return () => {
          if (name === "preload") {
            return `
              import Link from "${defaults.srcPrefix}/components/Link";

              export default function Page() {
                return (
                  <div data-testid="index">
                    <Link to={["preload/[id]", 2]} data-testid="to-2">2</Link>
                    <Link to={["preload/[id]", 3]} data-testid="to-3">3</Link>
                  </div>
                );
              }
            `;
          }
          return `
            import { Suspense } from "solid-js";
            import {
              createAsync,
              type RoutePreloadFuncArgs,
              type RouteSectionProps,
            } from "@solidjs/router";

            export const preload = ({ params, intent }: RoutePreloadFuncArgs) => {
              const entry = params.id + ":" + intent;
              if (typeof window !== "undefined") {
                const calls = ((window as any).__preloads ??= []);
                calls.push(entry);
              }
              return entry;
            };

            export default function Page(props: RouteSectionProps<Promise<string>>) {
              const data = createAsync(() => props.data);
              return (
                <Suspense>
                  <div data-testid="preloaded">{data()}</div>
                </Suspense>
              );
            }
          `;
        };
      },
    );
  });

  afterAll(teardown);

  const getPreloads = (page: Page) => {
    return page.evaluate(() => {
      return (window as { __preloads?: Array<string> }).__preloads ?? [];
    });
  };

  // the server-rendered HTML under SSR, the client render under CSR
  test("runs on render, with the router's arguments", async () => {
    const { content } = await withPageContent(["preload/[id]", { id: "7" }]);
    expect(content).toMatch(/data-testid="preloaded">7:initial</);
  });

  test("runs on client-side navigation", async () => {
    await withBrowserPage(async ({ page, url, errors }) => {
      await page.goto(url("preload"));
      await page.waitForLoadState("networkidle");

      await page.click('[data-testid="to-2"]');
      await page.waitForSelector(
        '[data-testid="preloaded"]:has-text("2:navigate")',
      );

      expect(await getPreloads(page)).toContain("2:navigate");
      expect(errors).toEqual([]);
    });
  });

  test("runs on link hover, before any navigation", async () => {
    await withBrowserPage(async ({ page, url, errors }) => {
      await page.goto(url("preload"));
      await page.waitForLoadState("networkidle");
      await page.hover('[data-testid="to-3"]');

      await page.waitForFunction(() => {
        const calls = (window as { __preloads?: Array<string> }).__preloads;
        return calls?.includes("3:preload");
      });

      expect(new URL(page.url()).pathname).toMatch(/\/preload$/);
      expect(await page.locator('[data-testid="index"]').count()).toBe(1);
      expect(errors).toEqual([]);
    });
  });
});
