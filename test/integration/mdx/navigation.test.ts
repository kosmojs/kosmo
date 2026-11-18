import { describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createNavigationTests } from "../navigation-factory";

const use = `${defaults.libPrefix}/use`;
const Link = `${defaults.srcPrefix}/components/Link`;

// components are declared as exports, so their markup is JSX, not markdown
describe("navigation", async ({ afterAll }) => {
  const { tests, teardown } = await createNavigationTests("mdx", {
    layout: () => `
import { useState } from "preact/hooks";
import { useParams, useRoute, useSearchParams } from "${use}";

export const Panel = ({ children }) => {
  // re-rendered on navigation, so hooks see the current route
  const route = useRoute();
  const params = useParams();
  const search = useSearchParams();
  const [clicks, setClicks] = useState(0);
  return (
    <div>
      <button data-testid="layout-inc" onClick={() => setClicks(clicks + 1)}>inc</button>
      <span data-testid="layout-clicks">{clicks}</span>
      <span data-testid="layout-route">{route.name}</span>
      <span data-testid="layout-id">{params.id ?? "none"}</span>
      <span data-testid="layout-q">{search.q ?? "none"}</span>
      {children}
    </div>
  );
};

<Panel>{props.children}</Panel>
`,

    index: ({ missingHref }) => `
import Link from "${Link}";

export const Index = () => (
  <div data-testid="index">
    <Link to={["nav/[id]", 1]} data-testid="to-1">1</Link>
    <Link to={["nav/[id]", 2]} data-testid="to-2">2</Link>
    <Link to={["nav/[id]", "slow"]} data-testid="to-slow">slow</Link>
    <Link to={["nav/[id]", 1]} data-reload data-testid="to-1-reload">reload</Link>
    <a href="${missingHref}" data-testid="to-missing">missing</a>
  </div>
);

<Index />
`,

    item: () => `
import { useState } from "preact/hooks";
import Link from "${Link}";
import { navigate, useLoaderData, useParams } from "${use}";

export const loader = async ({ params }) => {
  if (params.id === "slow") {
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return { id: params.id };
};

export const Item = () => {
  const { id } = useParams();
  const data = useLoaderData();
  const [clicks, setClicks] = useState(0);
  return (
    <div data-testid="item">
      <span data-testid="item-id">{id}</span>
      <span data-testid="item-loaded">{data?.id}</span>
      <button data-testid="item-inc" onClick={() => setClicks(clicks + 1)}>inc</button>
      <span data-testid="item-clicks">{clicks}</span>
      <Link to={["nav/[id]", 2]} data-testid="to-2">2</Link>
      <button
        data-testid="go-3"
        onClick={() => navigate(["nav/[id]", 3], { query: { q: "x" } })}
      >go</button>
      <button
        data-testid="go-3-y"
        onClick={() => navigate(["nav/[id]", 3], { query: { q: "y" } })}
      >go</button>
    </div>
  );
};

<Item />
`,
  });

  afterAll(teardown);

  for (const [name, runner] of tests) {
    test(name, runner);
  }
});
