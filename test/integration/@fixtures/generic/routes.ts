export type RouteName =
  | (typeof routes)[number]["name"]
  | (typeof nestedRoutes)[number]["name"];

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
    name: "products/{category}",
    params: {},
    id: "link-products-all",
    href: "/products",
    label: "All Products",
  },
  {
    name: "search/{query}/{page}",
    params: {},
    id: "link-search-empty",
    href: "/search",
    label: "Search",
  },

  // Optional parameters - with
  {
    name: "products/{category}",
    params: { category: "electronics" },
    id: "link-products-electronics",
    href: "/products/electronics",
    label: "Electronics",
  },
  {
    name: "search/{query}/{page}",
    params: { query: "laptops" },
    id: "link-search-laptops",
    href: "/search/laptops",
    label: "Search Laptops",
  },
  {
    name: "search/{query}/{page}",
    params: { query: "laptops", page: "2" },
    id: "link-search-laptops-page2",
    href: "/search/laptops/2",
    label: "Search Laptops Page 2",
  },

  // Splat parameters
  {
    name: "docs/{...path}",
    params: { path: ["getting-started"] },
    id: "link-docs-single",
    href: "/docs/getting-started",
    label: "Docs: Getting Started",
  },
  {
    name: "docs/{...path}",
    params: { path: ["api", "reference", "types"] },
    id: "link-docs-nested",
    href: "/docs/api/reference/types",
    label: "Docs: API Reference Types",
  },

  // Combined: required + optional
  {
    name: "shop/[category]/{subcategory}",
    params: { category: "electronics" },
    id: "link-shop-electronics",
    href: "/shop/electronics",
    label: "Shop Electronics",
  },
  {
    name: "shop/[category]/{subcategory}",
    params: { category: "electronics", subcategory: "laptops" },
    id: "link-shop-laptops",
    href: "/shop/electronics/laptops",
    label: "Shop Laptops",
  },

  // Combined: required + splat
  {
    name: "files/[bucket]/{...path}",
    params: { bucket: "my-bucket", path: ["folder", "file.txt"] },
    id: "link-files",
    href: "/files/my-bucket/folder/file.txt",
    label: "Files",
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
    name: "landing/search/{query}",
    params: {},
    id: "link-landing-search-empty",
    href: "/landing/search",
    label: "Landing Search",
  },
  {
    name: "landing/search/{query}",
    params: { query: "deals" },
    id: "link-landing-search-query",
    href: "/landing/search/deals",
    label: "Landing Search Deals",
  },
  {
    name: "landing/docs/{...path}",
    params: { path: ["guide"] },
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
] as const;

export const nestedRoutes = [
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
    name: "admin/[tenant]/resources/{type}",
    file: "index",
    params: { tenant: "acme", type: "posts" },
  },
  {
    name: "admin/[tenant]/resources/{type}",
    file: "index",
    params: { tenant: "acme" },
  },
  {
    name: "admin/[tenant]/resources/{type}",
    file: "layout",
    params: {},
  },
  {
    name: "admin/[tenant]/resources/{...path}",
    file: "index",
    params: { tenant: "acme", path: ["edit", "123"] },
  },

  // blog
  { name: "blog", file: "index", params: {} },
  { name: "blog", file: "layout", params: {} },
  {
    name: "blog/{category}",
    file: "index",
    params: { category: "tech" },
  },
  { name: "blog/{category}", file: "index", params: {} },
  {
    name: "blog/{category}/{tag}",
    file: "index",
    params: { category: "dev", tag: "typescript" },
  },
  {
    name: "blog/{category}/{tag}",
    file: "index",
    params: { category: "dev" },
  },
  {
    name: "blog/{category}/{tag}",
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
    name: "docs/{...path}",
    file: "index",
    params: { path: ["guide"] },
  },
  {
    name: "docs/{...path}",
    file: "index",
    params: { path: ["guide", "getting-started"] },
  },

  // files
  {
    name: "files/{...filePath}",
    file: "index",
    params: { filePath: ["documents"] },
  },
  {
    name: "files/{...filePath}",
    file: "index",
    params: { filePath: ["documents", "report.pdf"] },
  },
  {
    name: "files/{...filePath}",
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
    name: "news/[category]/articles/{...articlePath}",
    file: "index",
    params: { category: "world" },
  },
  {
    name: "news/[category]/articles/{...articlePath}",
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
    name: "profile/[username]/posts/[postId]/comments/{...thread}",
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
    name: "projects/[projectId]/files/{...path}",
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
  { name: "search/{query}", file: "layout", params: {} },
  { name: "search/{query}", file: "index", params: {} },
  { name: "search/{query}", file: "index", params: { query: "vue" } },
  {
    name: "search/{query}/{page}",
    file: "index",
    params: { query: "react", page: "2" },
  },
  {
    name: "search/{query}/{page}",
    file: "index",
    params: { query: "solid" },
  },
  {
    name: "search/{query}/{page}",
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
    name: "shop/products/{category}",
    file: "index",
    params: { category: "electronics" },
  },
  {
    name: "shop/products/{category}",
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
    name: "store/[category]/filters/{...filters}",
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
    name: "workspace/[workspaceId]/team/[memberId]/permissions/{...permissionPath}",
    file: "index",
    params: {
      workspaceId: "ws-7",
      memberId: "member-3",
      permissionPath: ["admin", "manager"],
    },
  },
] as const;

export const apiRoutes = {
  index: [{}],
  "index/static": [{}],
  "index/required/[param]": [{ param: "required" }],
  "index/optional/{param}": [{}, { param: "optional" }],

  "admin/[tenant]/resources/{type}": [
    { tenant: "acme", type: "posts" },
    { tenant: "acme" },
  ],
  "admin/[tenant]/resources/{...path}": [
    { tenant: "acme", path: ["edit", "123"] },
    // path with a single segment, e.g. ["edit"],
    // is matched by admin/[tenant]/resources/{type}
  ],

  // Underscore as a literal delimiter
  "user_[id]": [
    { id: "123" }, // "/user_123"
  ],

  "app/[name]{-v:version{-:pre}}": [
    { name: "widget", version: "2", pre: "beta" },
    { name: "widget", version: "2" },
    { name: "widget" },
  ],

  // Multiple optional groups in one segment (adjacent with different delimiters)
  "archive{.:format}{-:compression}": [
    {}, // "/archive"
    { format: "tar" }, // "/archive.tar"
    { compression: "gz" }, // "/archive-gz"
    { format: "tar", compression: "gz" }, // "/archive.tar-gz"
  ],

  "blog/{category}": [{ category: "tech" }, {}],
  "blog/{category}/{...page}": [
    { category: "dev", page: ["2024", "01", "hello-world"] },
  ],

  "docs/{...path}": [
    { path: ["api", "reference", "types"] },
    { path: ["getting-started"] },
    {},
  ],

  "files/report{.:format}": [{ format: "pdf" }, {}],
  "files/[name]{@:version{.:min}}.js": [
    { name: "react", version: "18", min: "min" },
    { name: "react", version: "18" },
    { name: "react" },
  ],
  "files/{...dir}/[name]": [
    // { name: "readme.md" }, // dir empty → files/readme.md
    { dir: ["docs"], name: "readme.md" }, // files/docs/readme.md
    // { dir: ["projects", "2024"], name: "plan.pdf" }, // files/projects/2024/plan.pdf
  ],

  // Multiple optional groups after a required parameter within a segment
  "item-[id]{-:color}{.:format}": [
    { id: "42" }, // "/item-42"
    { id: "42", color: "red" }, // "/item-42-red"
    { id: "42", format: "json" }, // "/item-42.json"
    { id: "42", color: "red", format: "json" }, // "/item-42-red.json"
  ],

  // Optional parameter in the middle of a segment
  "book{-:id}-info": [
    {}, // "/book-info"
    { id: "123" }, // "/book-123-info"
  ],

  // Two wildcards separated by a static segment
  "file-manager/{...before}/static/{...after}": [
    // { after: ["page"] },
    { before: ["assets"], after: ["css"] },
    { before: ["cdn"], after: ["minified", "logo.png"] },
  ],

  "locale{-:lang{-:country}}": [
    {}, // "/locale"
    { lang: "en" }, // "/locale-en"
    { lang: "en", country: "US" }, // "/locale-en-US"
  ],

  "landing/search/{query}": [{ query: "deals" }, {}],
  "landing/docs/{...path}": [{ path: ["guide"] }, {}],

  "logs/[year]-[month]-[day]": [{ year: "2024", month: "01", day: "15" }],

  "[id]-details": [{ id: "42" }],
  "item-[id]-info": [{ id: "42" }],
  "results.[ext]": [{ ext: "html" }],

  "changelog/v[version].html": [{ version: "3" }],

  "pages/[name]-v[version]/[resource].[ext]": [
    { name: "docs", version: "2", resource: "readme", ext: "md" },
  ],

  "news/[category]/articles/{...articlePath}": [
    { category: "nature", articlePath: ["cruises", "islands"] },
    { category: "world" },
  ],

  "products/{...path}.[ext]": [
    { path: ["electronics", "phones"], ext: "json" },
  ],

  "profile/[username]/posts/[postId]/comments/{...thread}": [
    { username: "john", postId: "post-123", thread: ["reply", "123"] },
    { username: "john", postId: "post-123" },
  ],

  "projects/[projectId]/files/{...path}": [
    { projectId: "proj-100", path: ["docs", "README.md"] },
    { projectId: "proj-100" },
  ],

  "search/{query}/{page}": [
    { query: "laptops", page: "2" },
    { query: "laptops" },
    {},
  ],

  "shop/[category]/{subcategory}": [
    { category: "electronics", subcategory: "laptops" },
    { category: "electronics" },
  ],
  "shop/products/{category}": [{ category: "electronics" }, {}],

  "store/[category]/{...filters}": [
    { category: "books", filters: ["fiction", "science"] },
    { category: "books" },
  ],

  "v1/products/book-[id]/{{:category-}reviews}": [
    { id: "1", category: "top-rated" },
    { id: "1" },
  ],

  "workspace/[workspaceId]/team/[memberId]/permissions/{...permissionPath}": [
    {
      workspaceId: "ws-7",
      memberId: "member-3",
      permissionPath: ["admin", "manager"],
    },
    { workspaceId: "ws-7", memberId: "member-3" },
  ],
} as const;
