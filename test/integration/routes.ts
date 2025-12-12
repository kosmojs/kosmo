export const routes = [
  // Static routes
  {
    name: "about",
    params: {},
    id: "link-about",
    href: "/about",
    label: "About",
  },
  {
    name: "blog/posts",
    params: {},
    id: "link-blog-posts",
    href: "/blog/posts",
    label: "Blog Posts",
  },
  {
    name: "blog/index.html",
    params: {},
    id: "link-blog-index",
    href: "/blog/index.html",
    label: "Blog Pages",
  },

  // Required parameters
  {
    name: "users/[id]",
    params: { id: "123" },
    id: "link-users-123",
    href: "/users/123",
    label: "User 123",
  },
  {
    name: "users/[id]",
    params: { id: "john-doe" },
    id: "link-users-john",
    href: "/users/john-doe",
    label: "User John Doe",
  },
  {
    name: "posts/[userId]/comments/[commentId]",
    params: { userId: "456", commentId: "789" },
    id: "link-post-comment",
    href: "/posts/456/comments/789",
    label: "Post Comment",
  },

  // Optional parameters - without
  {
    name: "products/[[category]]",
    params: {},
    id: "link-products-all",
    href: "/products",
    label: "All Products",
  },
  {
    name: "search/[[query]]/[[page]]",
    params: {},
    id: "link-search-empty",
    href: "/search",
    label: "Search",
  },

  // Optional parameters - with
  {
    name: "products/[[category]]",
    params: { category: "electronics" },
    id: "link-products-electronics",
    href: "/products/electronics",
    label: "Electronics",
  },
  {
    name: "search/[[query]]/[[page]]",
    params: { query: "laptops" },
    id: "link-search-laptops",
    href: "/search/laptops",
    label: "Search Laptops",
  },
  {
    name: "search/[[query]]/[[page]]",
    params: { query: "laptops", page: "2" },
    id: "link-search-laptops-page2",
    href: "/search/laptops/2",
    label: "Search Laptops Page 2",
  },

  // Rest parameters
  {
    name: "docs/[...path]",
    params: { path: "getting-started" },
    id: "link-docs-single",
    href: "/docs/getting-started",
    label: "Docs: Getting Started",
  },
  {
    name: "docs/[...path]",
    params: { path: ["api", "reference", "types"] },
    id: "link-docs-nested",
    href: "/docs/api/reference/types",
    label: "Docs: API Reference Types",
  },

  // Combined: required + optional
  {
    name: "shop/[category]/[[subcategory]]",
    params: { category: "electronics" },
    id: "link-shop-electronics",
    href: "/shop/electronics",
    label: "Shop Electronics",
  },
  {
    name: "shop/[category]/[[subcategory]]",
    params: { category: "electronics", subcategory: "laptops" },
    id: "link-shop-laptops",
    href: "/shop/electronics/laptops",
    label: "Shop Laptops",
  },

  // Combined: required + rest
  {
    name: "files/[bucket]/[...path]",
    params: { bucket: "my-bucket", path: ["folder", "file.txt"] },
    id: "link-files",
    href: "/files/my-bucket/folder/file.txt",
    label: "Files",
  },

  // Combined: required + optional + rest
  {
    name: "admin/[tenant]/resources/[[type]]/[...path]",
    params: { tenant: "acme", type: "users", path: ["verified", "active"] },
    id: "link-admin-with-type",
    href: "/admin/acme/resources/users/verified/active",
    label: "Admin Resources",
  },
  {
    name: "admin/[tenant]/resources/[[type]]/[...path]",
    params: { tenant: "acme", path: ["active"] },
    id: "link-admin-no-type",
    href: "/admin/acme/resources/active",
    label: "Admin Active",
  },

  // Route specificity
  {
    name: "priority/profile",
    params: {},
    id: "link-priority-static",
    href: "/priority/profile",
    label: "Priority Profile",
  },
  {
    name: "priority/[id]",
    params: { id: "123" },
    id: "link-priority-dynamic",
    href: "/priority/123",
    label: "Priority 123",
  },

  // Template test routes - landing
  {
    name: "landing",
    params: {},
    id: "link-landing",
    href: "/landing",
    label: "Landing Home",
  },
  {
    name: "landing/about",
    params: {},
    id: "link-landing-about",
    href: "/landing/about",
    label: "Landing About",
  },
  {
    name: "landing/features",
    params: {},
    id: "link-landing-features",
    href: "/landing/features",
    label: "Landing Features",
  },
  {
    name: "landing/[slug]",
    params: { slug: "promo" },
    id: "link-landing-slug",
    href: "/landing/promo",
    label: "Landing Promo",
  },
  {
    name: "landing/search/[[query]]",
    params: {},
    id: "link-landing-search-empty",
    href: "/landing/search",
    label: "Landing Search",
  },
  {
    name: "landing/search/[[query]]",
    params: { query: "deals" },
    id: "link-landing-search-query",
    href: "/landing/search/deals",
    label: "Landing Search Deals",
  },
  {
    name: "landing/docs/[...path]",
    params: { path: "guide" },
    id: "link-landing-docs",
    href: "/landing/docs/guide",
    label: "Landing Docs",
  },

  // Template test routes - marketing
  {
    name: "marketing/campaigns/summer",
    params: {},
    id: "link-marketing-summer",
    href: "/marketing/campaigns/summer",
    label: "Summer Campaign",
  },

  // Template test routes - products
  {
    name: "products/list",
    params: {},
    id: "link-products-list",
    href: "/products/list",
    label: "Products List",
  },

  // Link testing
  {
    name: "navigation",
    params: {},
    id: "link-navigation",
    href: "/navigation",
    label: "Navigation",
  },
];

export const nestedRoutes: Array<{
  name: string;
  file: "index" | "layout";
  params: Record<string, unknown>;
}> = [
  // about
  { name: "about", file: "index", params: {} },
  { name: "about", file: "layout", params: {} },
  { name: "about/team", file: "index", params: {} },
  { name: "about/careers", file: "layout", params: {} },
  {
    name: "about/careers/[jobId]",
    file: "index",
    params: { jobId: "job-123" },
  },

  // account
  { name: "account", file: "layout", params: {} },
  { name: "account/profile", file: "index", params: {} },

  // admin
  { name: "admin", file: "index", params: {} },
  { name: "admin", file: "layout", params: {} },
  { name: "admin/[tenant]", file: "index", params: { tenant: "acme" } },
  {
    name: "admin/[tenant]/users",
    file: "index",
    params: { tenant: "acme" },
  },
  {
    name: "admin/[tenant]/users",
    file: "layout",
    params: {},
  },
  {
    name: "admin/[tenant]/users/[userId]",
    file: "index",
    params: { tenant: "acme", userId: "user-456" },
  },
  {
    name: "admin/[tenant]/settings",
    file: "index",
    params: { tenant: "acme" },
  },
  {
    name: "admin/[tenant]/settings",
    file: "layout",
    params: {},
  },
  {
    name: "admin/[tenant]/settings/general",
    file: "index",
    params: { tenant: "acme" },
  },
  {
    name: "admin/[tenant]/settings/permissions",
    file: "index",
    params: { tenant: "acme" },
  },
  {
    name: "admin/[tenant]/resources",
    file: "index",
    params: { tenant: "acme" },
  },
  {
    name: "admin/[tenant]/resources",
    file: "layout",
    params: {},
  },
  {
    name: "admin/[tenant]/resources/[[type]]",
    file: "index",
    params: { tenant: "acme", type: "posts" },
  },
  {
    name: "admin/[tenant]/resources/[[type]]",
    file: "index",
    params: { tenant: "acme" },
  },
  {
    name: "admin/[tenant]/resources/[[type]]",
    file: "layout",
    params: {},
  },
  {
    name: "admin/[tenant]/resources/[[type]]/[...path]",
    file: "index",
    params: { tenant: "acme", type: "posts", path: ["edit", "123"] },
  },

  // blog
  { name: "blog", file: "index", params: {} },
  { name: "blog", file: "layout", params: {} },
  {
    name: "blog/[[category]]",
    file: "index",
    params: { category: "tech" },
  },
  { name: "blog/[[category]]", file: "index", params: {} },
  {
    name: "blog/[[category]]/[[tag]]",
    file: "index",
    params: { category: "dev", tag: "typescript" },
  },
  {
    name: "blog/[[category]]/[[tag]]",
    file: "index",
    params: { category: "dev" },
  },
  {
    name: "blog/[[category]]/[[tag]]",
    file: "index",
    params: {},
  },
  {
    name: "blog/post/[slug]",
    file: "index",
    params: { slug: "my-article" },
  },
  {
    name: "blog/post/[slug]",
    file: "layout",
    params: {},
  },

  // contact
  { name: "contact", file: "index", params: {} },
  { name: "contact", file: "layout", params: {} },

  // dashboard
  { name: "dashboard", file: "index", params: {} },
  { name: "dashboard", file: "layout", params: {} },
  {
    name: "dashboard/[view]",
    file: "index",
    params: { view: "overview" },
  },
  {
    name: "dashboard/analytics",
    file: "index",
    params: {},
  },
  { name: "dashboard/settings", file: "index", params: {} },
  { name: "dashboard/settings", file: "layout", params: {} },
  {
    name: "dashboard/settings/profile",
    file: "index",
    params: {},
  },
  {
    name: "dashboard/settings/notifications",
    file: "index",
    params: {},
  },
  {
    name: "dashboard/settings/billing",
    file: "index",
    params: {},
  },
  {
    name: "dashboard/settings/security",
    file: "index",
    params: {},
  },
  {
    name: "dashboard/settings/security",
    file: "layout",
    params: {},
  },

  // docs
  { name: "docs", file: "index", params: {} },
  { name: "docs", file: "layout", params: {} },
  {
    name: "docs/[...path]",
    file: "index",
    params: { path: ["guide"] },
  },
  {
    name: "docs/[...path]",
    file: "index",
    params: { path: ["guide", "getting-started"] },
  },

  // files
  {
    name: "files/[...filePath]",
    file: "index",
    params: { filePath: ["documents"] },
  },
  {
    name: "files/[...filePath]",
    file: "index",
    params: { filePath: ["documents", "report.pdf"] },
  },
  {
    name: "files/[...filePath]",
    file: "layout",
    params: {},
  },

  // legal
  { name: "legal", file: "layout", params: {} },
  { name: "legal/privacy", file: "index", params: {} },
  { name: "legal/terms", file: "index", params: {} },

  // news
  {
    name: "news/[category]",
    file: "layout",
    params: {},
  },
  {
    name: "news/[category]/articles/[...articlePath]",
    file: "index",
    params: { category: ["world"] },
  },
  {
    name: "news/[category]/articles/[...articlePath]",
    file: "index",
    params: { category: "nature", articlePath: ["cruises", "islands"] },
  },

  // portal
  { name: "portal", file: "layout", params: {} },
  {
    name: "portal/[clientId]",
    file: "layout",
    params: {},
  },
  {
    name: "portal/[clientId]/reports",
    file: "layout",
    params: {},
  },
  {
    name: "portal/[clientId]/reports/[reportType]",
    file: "layout",
    params: {},
  },
  {
    name: "portal/[clientId]/reports/[reportType]/data/[dataView]",
    file: "index",
    params: { clientId: "client-42", reportType: "sales", dataView: "monthly" },
  },
  {
    name: "portal/[clientId]/reports/[reportType]/data/[dataView]",
    file: "layout",
    params: {},
  },

  // products
  { name: "products", file: "index", params: {} },
  { name: "products/[id]", file: "index", params: { id: "prod-789" } },

  // profile
  {
    name: "profile/[username]",
    file: "layout",
    params: {},
  },
  {
    name: "profile/[username]/posts/[postId]",
    file: "layout",
    params: {},
  },
  {
    name: "profile/[username]/posts/[postId]/comments/[...thread]",
    file: "index",
    params: { username: "john", postId: "post-123", thread: ["reply", "123"] },
  },

  // projects
  { name: "projects", file: "index", params: {} },
  { name: "projects", file: "layout", params: {} },
  {
    name: "projects/[projectId]",
    file: "index",
    params: { projectId: "proj-100" },
  },
  {
    name: "projects/[projectId]",
    file: "layout",
    params: {},
  },
  {
    name: "projects/[projectId]/files",
    file: "index",
    params: { projectId: "proj-100" },
  },
  {
    name: "projects/[projectId]/files",
    file: "layout",
    params: {},
  },
  {
    name: "projects/[projectId]/files/[...path]",
    file: "index",
    params: { projectId: "proj-100", path: ["docs", "README.md"] },
  },
  {
    name: "projects/[projectId]/tasks",
    file: "index",
    params: { projectId: "proj-100" },
  },
  {
    name: "projects/[projectId]/tasks",
    file: "layout",
    params: {},
  },
  {
    name: "projects/[projectId]/tasks/[taskId]",
    file: "index",
    params: { projectId: "proj-100", taskId: "task-5" },
  },
  {
    name: "projects/[projectId]/tasks/[taskId]",
    file: "layout",
    params: {},
  },
  {
    name: "projects/[projectId]/tasks/[taskId]/comments",
    file: "index",
    params: { projectId: "proj-100", taskId: "task-5" },
  },
  {
    name: "projects/[projectId]/tasks/[taskId]/comments",
    file: "layout",
    params: {},
  },
  {
    name: "projects/[projectId]/tasks/[taskId]/comments/[commentId]",
    file: "index",
    params: { projectId: "proj-100", taskId: "task-5", commentId: "comment-8" },
  },
  {
    name: "projects/[projectId]/team",
    file: "index",
    params: { projectId: "proj-100" },
  },
  {
    name: "projects/[projectId]/team",
    file: "layout",
    params: {},
  },
  {
    name: "projects/[projectId]/team/[userId]",
    file: "index",
    params: { projectId: "proj-100", userId: "user-22" },
  },

  // search
  { name: "search", file: "index", params: {} },
  { name: "search/[[query]]", file: "layout", params: {} },
  { name: "search/[[query]]", file: "index", params: {} },
  { name: "search/[[query]]", file: "index", params: { query: "vue" } },
  {
    name: "search/[[query]]/[[page]]",
    file: "index",
    params: { query: "react", page: "2" },
  },
  {
    name: "search/[[query]]/[[page]]",
    file: "index",
    params: { query: "solid" },
  },
  {
    name: "search/[[query]]/[[page]]",
    file: "index",
    params: {},
  },

  // shop
  { name: "shop", file: "index", params: {} },
  { name: "shop", file: "layout", params: {} },
  { name: "shop/cart", file: "index", params: {} },
  { name: "shop/checkout", file: "layout", params: {} },
  {
    name: "shop/checkout/shipping",
    file: "index",
    params: {},
  },
  {
    name: "shop/checkout/shipping",
    file: "layout",
    params: {},
  },
  {
    name: "shop/checkout/payment",
    file: "index",
    params: {},
  },
  {
    name: "shop/checkout/confirm",
    file: "index",
    params: {},
  },
  { name: "shop/orders", file: "index", params: {} },
  { name: "shop/orders", file: "layout", params: {} },
  {
    name: "shop/orders/[orderId]",
    file: "index",
    params: { orderId: "order-999" },
  },
  {
    name: "shop/product/[id]",
    file: "index",
    params: { id: "prod-555" },
  },
  {
    name: "shop/product/[id]",
    file: "layout",
    params: {},
  },
  {
    name: "shop/product/[id]/reviews",
    file: "index",
    params: { id: "prod-555" },
  },
  { name: "shop/products", file: "index", params: {} },
  { name: "shop/products", file: "layout", params: {} },
  {
    name: "shop/products/[[category]]",
    file: "index",
    params: { category: "electronics" },
  },
  {
    name: "shop/products/[[category]]",
    file: "index",
    params: {},
  },
  {
    name: "shop/[category]/[productId]",
    file: "index",
    params: { category: "furniture", productId: "chair-77" },
  },
  {
    name: "shop/[category]/[productId]",
    file: "layout",
    params: {},
  },

  // signup
  { name: "signup", file: "index", params: {} },

  // store
  { name: "store", file: "layout", params: {} },
  {
    name: "store/[category]/filters/[...filters]",
    file: "index",
    params: { category: "books", filters: ["fiction", "science"] },
  },
  {
    name: "store/[category]/sort",
    file: "layout",
    params: {},
  },
  {
    name: "store/[category]/sort/[sortBy]",
    file: "index",
    params: { category: "books", sortBy: "price" },
  },

  // users
  { name: "users", file: "index", params: {} },
  { name: "users", file: "layout", params: {} },
  {
    name: "users/[username]",
    file: "index",
    params: { username: "alice" },
  },
  {
    name: "users/[username]",
    file: "layout",
    params: {},
  },
  {
    name: "users/[username]/followers",
    file: "index",
    params: { username: "alice" },
  },
  {
    name: "users/[username]/following",
    file: "index",
    params: { username: "alice" },
  },
  {
    name: "users/[username]/posts",
    file: "index",
    params: { username: "alice" },
  },
  {
    name: "users/[username]/posts",
    file: "layout",
    params: {},
  },
  {
    name: "users/[username]/posts/[postId]",
    file: "index",
    params: { username: "alice", postId: "post-44" },
  },
  {
    name: "users/[username]/posts/[postId]",
    file: "layout",
    params: {},
  },

  // workspace
  {
    name: "workspace/[workspaceId]/analytics",
    file: "index",
    params: { workspaceId: "ws-7" },
  },
  {
    name: "workspace/[workspaceId]/analytics",
    file: "layout",
    params: {},
  },
  {
    name: "workspace/[workspaceId]/analytics/[range]",
    file: "index",
    params: { workspaceId: "ws-7", range: "monthly" },
  },
  {
    name: "workspace/[workspaceId]/analytics/[range]",
    file: "layout",
    params: {},
  },
  {
    name: "workspace/[workspaceId]/team",
    file: "layout",
    params: {},
  },
  {
    name: "workspace/[workspaceId]/team/[memberId]/permissions/[...permissionPath]",
    file: "index",
    params: {
      workspaceId: "ws-7",
      memberId: "member-3",
      permissionPath: ["admin", "manager"],
    },
  },
];

export const apiRoutes: Array<{
  name: string;
  file: "index" | "use";
  params: Record<string, unknown>;
}> = nestedRoutes.map(({ file, ...route }) => {
  return {
    ...route,
    file: file === "layout" ? "use" : file,
  };
});
