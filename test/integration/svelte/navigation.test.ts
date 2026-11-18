import { describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createNavigationTests } from "../navigation-factory";

const use = `${defaults.libPrefix}/use`;
const Link = `${defaults.srcPrefix}/components/Link.svelte`;

describe("navigation", async ({ afterAll }) => {
  const { tests, teardown } = await createNavigationTests("svelte", {
    layout: () => `
      <script lang="ts">
        import type { Snippet } from "svelte";
        import { useParams, useRoute, useSearchParams } from "${use}";

        let { children }: { children: Snippet } = $props();

        // live views - this layout stays mounted across navigations
        const route = useRoute();
        const params = useParams<"nav/[id]">();
        const search = useSearchParams();

        let clicks = $state(0);
      </script>

      <div>
        <button data-testid="layout-inc" onclick={() => clicks++}>inc</button>
        <span data-testid="layout-clicks">{clicks}</span>
        <span data-testid="layout-route">{route.name}</span>
        <span data-testid="layout-id">{params.id ?? "none"}</span>
        <span data-testid="layout-q">{search.q ?? "none"}</span>
        {@render children()}
      </div>
    `,

    index: ({ missingHref }) => `
      <script lang="ts">
        import Link from "${Link}";
      </script>

      <div data-testid="index">
        <Link to={["nav/[id]", 1]} data-testid="to-1">1</Link>
        <Link to={["nav/[id]", 2]} data-testid="to-2">2</Link>
        <Link to={["nav/[id]", "slow"]} data-testid="to-slow">slow</Link>
        <Link to={["nav/[id]", 1]} data-reload data-testid="to-1-reload">reload</Link>
        <a href="${missingHref}" data-testid="to-missing">missing</a>
      </div>
    `,

    item: () => `
      <script module lang="ts">
        export const loader = async (
          { params }: { params: Record<string, unknown> },
        ) => {
          if (params.id === "slow") {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
          return { id: params.id };
        };
      </script>

      <script lang="ts">
        import Link from "${Link}";
        import { navigate, useLoaderData, useParams } from "${use}";

        // snapshots - fine in a page, mounted anew on every navigation
        const { id } = useParams<"nav/[id]">();
        const data = useLoaderData<{ id: string }>();

        let clicks = $state(0);
      </script>

      <div data-testid="item">
        <span data-testid="item-id">{id}</span>
        <span data-testid="item-loaded">{data?.id}</span>
        <button data-testid="item-inc" onclick={() => clicks++}>inc</button>
        <span data-testid="item-clicks">{clicks}</span>
        <Link to={["nav/[id]", 2]} data-testid="to-2">2</Link>
        <button
          data-testid="go-3"
          onclick={() => navigate(["nav/[id]", 3], { query: { q: "x" } })}
        >go</button>
        <button
          data-testid="go-3-y"
          onclick={() => navigate(["nav/[id]", 3], { query: { q: "y" } })}
        >go</button>
      </div>
    `,
  });

  afterAll(teardown);

  for (const [name, runner] of tests) {
    test(name, runner);
  }
});
