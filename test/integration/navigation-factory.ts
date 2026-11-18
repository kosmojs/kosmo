import { posix } from "node:path";

import type { Page } from "playwright";
import { expect, type TestFunction } from "vitest";

import { setupTestProject } from "./setup";

export type NavigationTemplates = {
  // wraps every page under nav/ - a click counter and live route reads
  layout: () => string;
  // links to the item pages, a link out of the app, a data-reload link
  index: (data: { missingHref: string }) => string;
  // nav/[id] - a loader echoing the id (slow for id "slow"), a click counter,
  // links to siblings and a navigate() button
  item: () => string;
};

/**
 * Client-side navigation: layouts persist, pages remount,
 * the document is never reloaded unless asked to.
 *
 * A window marker tells a client-side navigation from a full page load -
 * a full load starts a new window and drops it.
 * */
export const createNavigationTests = async (
  frontend: "svelte" | "mdx",
  templates: NavigationTemplates,
) => {
  const {
    //
    bootstrapProject,
    createPageRoutes,
    sourceFolder,
    withBrowserPage,
  } = await setupTestProject({ frontend });

  const base = sourceFolder.config.frontend?.base || "/";

  const teardown = await bootstrapProject(async () => {
    await createPageRoutes(
      [{ name: "nav", file: "layout" }, { name: "nav" }, { name: "nav/[id]" }],
      async ({ name, file }) => {
        return () => {
          if (file === "layout") {
            return templates.layout();
          }
          return name === "nav"
            ? templates.index({ missingHref: posix.join(base, "nav-missing") })
            : templates.item();
        };
      },
    );
  });

  const text = (page: Page, id: string) => {
    return page.locator(`[data-testid="${id}"]`).innerText();
  };

  const waitText = (page: Page, id: string, value: string) => {
    return page.waitForFunction(
      ([id, value]) => {
        const element = document.querySelector(`[data-testid="${id}"]`);
        return element?.textContent?.trim() === value;
      },
      [id, value],
    );
  };

  const setMarker = (page: Page) => {
    return page.evaluate(() => {
      (window as { __marker?: string }).__marker = "kept";
    });
  };

  const getMarker = (page: Page) => {
    return page.evaluate(() => (window as { __marker?: string }).__marker);
  };

  // hydration (SSR) or mount (CSR) is done and the listener registered
  // once lazy route chunks stop loading
  const open = async (page: Page, url: string) => {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await setMarker(page);
  };

  const tests: Array<[name: string, runner: TestFunction]> = [
    [
      "links navigate client-side, layout persists, page remounts",
      async () => {
        await withBrowserPage(async ({ page, url, errors }) => {
          await open(page, url("nav"));

          await page.click('[data-testid="layout-inc"]');
          await waitText(page, "layout-clicks", "1");

          await page.click('[data-testid="to-1"]');
          await waitText(page, "item-id", "1");

          expect(await getMarker(page)).toBe("kept");
          expect(await text(page, "item-loaded")).toBe("1");
          expect(await text(page, "layout-clicks")).toBe("1");
          expect(await text(page, "layout-id")).toBe("1");
          expect(await text(page, "layout-route")).toBe("nav/[id]");

          await page.click('[data-testid="item-inc"]');
          await waitText(page, "item-clicks", "1");

          // same page component, new params - mounted anew
          await page.click('[data-testid="to-2"]');
          await waitText(page, "item-id", "2");

          expect(await getMarker(page)).toBe("kept");
          expect(await text(page, "item-loaded")).toBe("2");
          expect(await text(page, "item-clicks")).toBe("0");
          expect(await text(page, "layout-clicks")).toBe("1");
          expect(await text(page, "layout-id")).toBe("2");

          expect(errors).toEqual([]);
        });
      },
    ],

    [
      "back and forward re-render client-side",
      async () => {
        await withBrowserPage(async ({ page, url, errors }) => {
          await open(page, url("nav"));

          await page.click('[data-testid="to-1"]');
          await waitText(page, "item-id", "1");
          await page.click('[data-testid="to-2"]');
          await waitText(page, "item-id", "2");

          await page.goBack();
          await waitText(page, "item-id", "1");
          expect(await text(page, "item-loaded")).toBe("1");

          await page.goBack();
          await page.waitForSelector('[data-testid="index"]');
          expect(await text(page, "layout-id")).toBe("none");

          await page.goForward();
          await waitText(page, "item-id", "1");

          expect(await getMarker(page)).toBe("kept");
          expect(errors).toEqual([]);
        });
      },
    ],

    [
      "navigate() with query, read live by the layout",
      async () => {
        await withBrowserPage(async ({ page, url, errors }) => {
          await open(page, url("nav/1"));

          await page.click('[data-testid="go-3"]');
          await waitText(page, "item-id", "3");

          expect(await text(page, "layout-q")).toBe("x");
          expect(new URL(page.url()).pathname).toBe(posix.join(base, "nav/3"));
          expect(new URL(page.url()).search).toBe("?q=x");
          expect(await getMarker(page)).toBe("kept");
          expect(errors).toEqual([]);
        });
      },
    ],

    [
      "a query-only change updates the layout, remounts the page",
      async () => {
        await withBrowserPage(async ({ page, url, errors }) => {
          await open(page, url("nav/3?q=x"));

          await page.click('[data-testid="layout-inc"]');
          await waitText(page, "layout-clicks", "1");
          await page.click('[data-testid="item-inc"]');
          await waitText(page, "item-clicks", "1");

          await page.click('[data-testid="go-3-y"]');
          await waitText(page, "layout-q", "y");

          expect(await text(page, "layout-id")).toBe("3");
          expect(await text(page, "layout-clicks")).toBe("1");
          expect(await text(page, "item-id")).toBe("3");
          expect(await text(page, "item-clicks")).toBe("0");
          expect(new URL(page.url()).search).toBe("?q=y");

          await page.goBack();
          await waitText(page, "layout-q", "x");

          expect(await getMarker(page)).toBe("kept");
          expect(errors).toEqual([]);
        });
      },
    ],

    [
      "a superseded navigation never renders",
      async () => {
        await withBrowserPage(async ({ page, url, errors }) => {
          await open(page, url("nav"));

          // the slow loader is still pending when the second click lands
          await page.click('[data-testid="to-slow"]');
          await page.click('[data-testid="to-2"]');
          await waitText(page, "item-id", "2");

          // past the slow loader's delay
          await page.waitForTimeout(1_200);

          expect(await text(page, "item-id")).toBe("2");
          expect(new URL(page.url()).pathname).toBe(posix.join(base, "nav/2"));
          expect(await getMarker(page)).toBe("kept");
          expect(errors).toEqual([]);
        });
      },
    ],

    [
      "unknown paths and data-reload links load from the server",
      async () => {
        await withBrowserPage(async ({ page, url }) => {
          await open(page, url("nav"));

          await Promise.all([
            page.waitForEvent("load"),
            page.click('[data-testid="to-1-reload"]'),
          ]);
          await page.waitForLoadState("networkidle");
          await waitText(page, "item-id", "1");
          expect(await getMarker(page)).toBeUndefined();

          await open(page, url("nav"));

          await Promise.all([
            page.waitForEvent("load"),
            page.click('[data-testid="to-missing"]'),
          ]);
          expect(await getMarker(page)).toBeUndefined();
        });
      },
    ],
  ];

  return { tests, teardown };
};
