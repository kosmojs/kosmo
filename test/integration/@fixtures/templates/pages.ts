import { markerFor } from ".";

export type PageCase = {
  name: string;
  file: "index" | "layout";
  // test id the seeded file should carry, undefined for the built-in template
  expected: string | undefined;
  // written before the build, so seeding must leave the file alone
  content?: { id: string };
};

export type RenderCase = {
  route: string;
  params?: Record<string, string | Array<string>>;
  // test id of the rendered page, undefined for the built-in page
  page: string | undefined;
  // layout test ids, outermost first; the page must render inside all of them
  layouts?: Array<string>;
};

// templates keyed by pattern; insertion order is match order
export const stringTemplates = {
  "landing": "string-landing-exact",
  "landing/**/*": "string-landing-glob",
  "marketing/campaigns/summer": "string-marketing-specific",
  "marketing/**/*": "string-marketing-generic",
} as const;

// served by the function template; it returns undefined for skipped names
export const functionPattern = "admin/**";
export const functionSkipped = ["admin/legacy"];

export const pageCases: Array<PageCase> = [
  // a string template seeds the exact route it names
  { name: "landing", file: "index", expected: "string-landing-exact" },

  // a string template never seeds a layout, even one whose name matches
  { name: "landing", file: "layout", expected: undefined },

  // glob patterns reach static, required, optional and splat routes
  { name: "landing/about", file: "index", expected: "string-landing-glob" },
  { name: "landing/[slug]", file: "index", expected: "string-landing-glob" },
  {
    name: "landing/search/{query}",
    file: "index",
    expected: "string-landing-glob",
  },
  {
    name: "landing/docs/{...path}",
    file: "index",
    expected: "string-landing-glob",
  },

  // a file that already has content is never seeded over
  {
    name: "landing/kept",
    file: "index",
    expected: "user-kept",
    content: { id: "user-kept" },
  },

  // the first matching pattern wins
  {
    name: "marketing/campaigns/summer",
    file: "index",
    expected: "string-marketing-specific",
  },
  {
    name: "marketing/campaigns/winter",
    file: "index",
    expected: "string-marketing-generic",
  },

  // a function template is called for layouts as well as routes,
  // and receives the resolved entry: the kind and the name
  {
    name: "admin",
    file: "layout",
    expected: markerFor("pageLayout", "admin"),
  },
  {
    name: "admin/users",
    file: "layout",
    expected: markerFor("pageLayout", "admin/users"),
  },
  {
    name: "admin/users",
    file: "index",
    expected: markerFor("pageRoute", "admin/users"),
  },
  {
    name: "admin/users/[id]",
    file: "index",
    expected: markerFor("pageRoute", "admin/users/[id]"),
  },

  // a function returning undefined keeps the built-in template
  { name: "admin/legacy", file: "index", expected: undefined },

  // no pattern matches
  { name: "products/list", file: "index", expected: undefined },
];

export const renderCases: Array<RenderCase> = [
  { route: "landing", page: "string-landing-exact" },
  {
    route: "landing/[slug]",
    params: { slug: "promo" },
    page: "string-landing-glob",
  },
  { route: "landing/search/{query}", page: "string-landing-glob" },
  {
    route: "landing/search/{query}",
    params: { query: "shoes" },
    page: "string-landing-glob",
  },
  {
    route: "landing/docs/{...path}",
    params: { path: ["guide", "intro"] },
    page: "string-landing-glob",
  },
  { route: "marketing/campaigns/summer", page: "string-marketing-specific" },
  { route: "marketing/campaigns/winter", page: "string-marketing-generic" },
  {
    route: "admin/users",
    page: markerFor("pageRoute", "admin/users"),
    layouts: [
      markerFor("pageLayout", "admin"),
      markerFor("pageLayout", "admin/users"),
    ],
  },
  {
    route: "admin/users/[id]",
    params: { id: "42" },
    page: markerFor("pageRoute", "admin/users/[id]"),
    layouts: [
      markerFor("pageLayout", "admin"),
      markerFor("pageLayout", "admin/users"),
    ],
  },
  {
    route: "admin/legacy",
    page: undefined,
    layouts: [markerFor("pageLayout", "admin")],
  },
  { route: "products/list", page: undefined },
];
