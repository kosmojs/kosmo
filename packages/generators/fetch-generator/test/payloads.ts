import mimeTypes from "mime-types";

import type { HTTPMethod } from "@kosmojs/api";

import type { RouteName } from "./@fixtures/routes";

export type PayloadVariant = Partial<{
  headers: Record<string, unknown>;
  query: Record<string, unknown>;
  json: unknown;
  form: Record<string, unknown>;
  multipart: FormData;
  raw: string | Buffer | ArrayBuffer | Blob;
}>;

export type PayloadMap = Record<
  RouteName,
  {
    params?: Array<[...a: Array<unknown>]>;
  } & Partial<Record<HTTPMethod, Array<PayloadVariant>>>
>;

const formDataFactory = (
  fields: Record<string, string>,
  files?: Array<string> | Array<{ name: string; type?: string; blob?: Blob }>,
) => {
  const formData = new FormData();
  for (const [key, val] of Object.entries(fields)) {
    formData.append(key, val);
  }
  for (const file of files || []) {
    const [name, type, blob] =
      typeof file === "string" //
        ? [file]
        : [file.name, file.type, file.blob];
    formData.append(
      "file",
      blob
        ? blob
        : new Blob([Buffer.from(name)], {
            type: type
              ? mimeTypes.lookup(type) || type
              : mimeTypes.lookup(name) || "text/plain",
          }),
      name,
    );
  }
  return formData;
};

export const payloadMap: PayloadMap = {
  // ── Auth ──────────────────────────────────────────────

  "auth/register": {
    POST: [
      {
        json: {
          email: "alice@example.com",
          password: "P@ssw0rd!",
          name: "Alice Johnson",
          acceptTerms: true,
        },
      },
    ],
  },

  "auth/login": {
    POST: [
      {
        json: { email: "alice@example.com", password: "P@ssw0rd!" },
        headers: { "x-device-id": "device-001" },
      },
    ],
  },

  "auth/refresh": {
    POST: [{ json: { refreshToken: "rt_abc123" } }],
  },

  "auth/forgot-password": {
    POST: [{ form: { email: "alice@example.com" } }],
  },

  // ── Users ─────────────────────────────────────────────

  users: {
    GET: [
      { query: {} },
      { query: { page: "1" } },
      { query: { search: "alice", role: "admin" } },
      {
        query: {
          page: "2",
          limit: "10",
          search: "bob",
          role: "user",
          sortBy: "createdAt",
          order: "desc",
        },
      },
    ],
  },

  "users/:id": {
    params: [["42"], ["usr_abc"]],
    GET: [{ query: {} }, { query: { include: "posts" } }],
    PUT: [
      { json: { name: "Alice Updated" } },
      {
        json: {
          name: "Alice Full",
          email: "alice@new.com",
          bio: "Engineer",
          timezone: "Europe/London",
        },
      },
    ],
    DELETE: [{}],
  },

  "users/:id/profile": {
    params: [["42"]],
    GET: [{}],
    PATCH: [
      { json: { displayName: "Alice Dev" } },
      {
        json: {
          socialLinks: {
            twitter: "@alice",
            github: "alicegh",
            linkedin: "alice-j",
          },
        },
      },
      {
        json: {
          displayName: "Full Profile",
          avatar: "https://cdn.example.com/a.jpg",
          website: "https://alice.dev",
          location: "NYC",
          socialLinks: { twitter: "@alice" },
        },
      },
    ],
  },

  "users/:id/avatar": {
    params: [["42"]],
    POST: [
      {
        multipart: formDataFactory({}, ["avatar001.png"]),
      },
      {
        multipart: formDataFactory({ cropX: "100", cropY: "100" }, [
          "avatar002.png",
        ]),
      },
    ],
  },

  "users/:id/posts/{:page}": {
    params: [["42"], ["42", "2"], ["usr_abc", "latest"]],
    GET: [
      { query: {} },
      { query: { status: "published" } },
      { query: { tag: "typescript" } },
      { query: { status: "draft", tag: "node" } },
    ],
  },

  "users/:id/settings/{:section}": {
    params: [["42"], ["42", "privacy"], ["usr_abc", "notifications"]],
    GET: [{}],
    PUT: [
      { json: { theme: "dark" } },
      { json: { notifications: { email: true, push: false, sms: false } } },
      { json: { privacy: { profileVisible: true, showEmail: false } } },
      {
        json: {
          notifications: { email: true, push: true, sms: true },
          privacy: { profileVisible: false, showEmail: true },
          theme: "light",
        },
      },
    ],
  },

  // ── Posts / Blog ──────────────────────────────────────

  posts: {
    GET: [
      { query: {} },
      { query: { limit: "10" } },
      { query: { category: "tech", published: "true" } },
      {
        query: {
          cursor: "post_20",
          limit: "5",
          category: "general",
          author: "alice",
          published: "true",
        },
      },
    ],
    POST: [
      {
        json: {
          title: "Hello World",
          content: "First post",
          category: "general",
          tags: ["intro"],
          published: true,
        },
      },
      {
        json: {
          title: "Advanced TS",
          content: "Deep dive",
          category: "tech",
          tags: ["typescript", "node"],
          published: false,
          slug: "advanced-ts",
        },
      },
    ],
  },

  "posts/:id": {
    params: [["post_1"], ["post_abc"]],
    GET: [{}],
    PUT: [
      {
        json: {
          title: "Updated Title",
          content: "New content",
          category: "tech",
          tags: ["updated"],
          published: true,
        },
      },
    ],
    PATCH: [
      { json: { published: true } },
      { json: { pinned: true } },
      { json: { featured: true } },
      { json: { published: false, pinned: true, featured: true } },
    ],
    DELETE: [{}],
  },

  "posts/:id/comments": {
    params: [["post_1"]],
    GET: [
      { query: {} },
      { query: { sort: "newest" } },
      { query: { page: "1", limit: "20" } },
      { query: { page: "2", limit: "10", sort: "top" } },
    ],
    POST: [
      {
        json: { body: "Great article!" },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        json: { body: "I agree with the parent", parentId: "c1" },
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
  },

  // ── Products / Shop ───────────────────────────────────

  products: {
    GET: [
      { query: {} },
      { query: { q: "widget" } },
      { query: { category: "electronics", inStock: "true" } },
      { query: { minPrice: "10", maxPrice: "100", sort: "price-asc" } },
      {
        query: {
          q: "gadget",
          category: "electronics",
          minPrice: "5",
          maxPrice: "200",
          inStock: "true",
          sort: "rating",
          page: "1",
          limit: "20",
        },
      },
    ],
  },

  "products/:id": {
    params: [["prod_1"], ["prod_abc"]],
    GET: [
      { query: {} },
      { query: { currency: "USD" } },
      { query: { includeReviews: "true" } },
      { query: { currency: "EUR", includeReviews: "true" } },
    ],
  },

  "products/:id/reviews": {
    params: [["prod_1"]],
    GET: [
      { query: {} },
      { query: { page: "1" } },
      { query: { rating: "5" } },
      { query: { page: "2", rating: "4" } },
    ],
    POST: [
      {
        json: { rating: 5, title: "Amazing!", body: "Love this product" },
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
  },

  // ── Cart & Checkout ───────────────────────────────────

  cart: {
    GET: [{ headers: { authorization: "Bearer tok_abc123" } }],
    POST: [
      {
        json: { productId: "prod_1", quantity: 2 },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        json: { productId: "prod_2", quantity: 1, variant: "blue-xl" },
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
    DELETE: [{ headers: { authorization: "Bearer tok_abc123" } }],
  },

  "cart/items/:itemId": {
    params: [["ci_1"], ["ci_abc"]],
    PATCH: [{ json: { quantity: 3 } }],
    DELETE: [{}],
  },

  checkout: {
    POST: [
      {
        json: {
          shippingAddress: {
            street: "123 Main St",
            city: "Springfield",
            state: "IL",
            zip: "62704",
            country: "US",
          },
          paymentMethod: "card",
        },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        json: {
          shippingAddress: {
            street: "456 Oak Ave",
            city: "Portland",
            state: "OR",
            zip: "97201",
            country: "US",
          },
          paymentMethod: "paypal",
          couponCode: "SAVE10",
        },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        json: {
          shippingAddress: {
            street: "789 Elm Blvd",
            city: "Seattle",
            state: "WA",
            zip: "98101",
            country: "US",
          },
          billingAddress: {
            street: "321 Pine St",
            city: "Seattle",
            state: "WA",
            zip: "98101",
            country: "US",
          },
          paymentMethod: "bank_transfer",
          couponCode: "VIP20",
          notes: "Leave at door",
        },
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
  },

  // ── Uploads & Media ───────────────────────────────────

  uploads: {
    POST: [
      {
        multipart: formDataFactory({}, ["report.pdf"]),
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        multipart: formDataFactory({ folder: "images" }, ["photo.png"]),
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        multipart: formDataFactory(
          {
            folder: "documents",
            description: "Q4 report",
          },
          ["data.csv"],
        ),
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
  },

  "uploads/batch": {
    POST: [
      {
        multipart: formDataFactory({}, ["a.jpg", "b.jpg"]),
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        multipart: formDataFactory({ folder: "gallery" }, [
          "a.jpg",
          "b.jpg",
          "c.jpg",
        ]),
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
  },

  "uploads/raw": {
    POST: [
      {
        raw: "...",
      },
      {
        raw: Buffer.from("..."),
      },
    ],
  },

  "uploads/:fileId": {
    params: [["file_001"], ["file_abc"]],
    GET: [
      { query: {} },
      { query: { format: "webp" } },
      { query: { width: "200", height: "200" } },
      { query: { width: "800", height: "600", quality: "80", format: "png" } },
    ],
    DELETE: [{ headers: { authorization: "Bearer tok_abc123" } }],
  },

  // ── Search ────────────────────────────────────────────

  search: {
    GET: [
      { query: { q: "typescript" } },
      { query: { q: "alice", type: "users" } },
      { query: { q: "widget", type: "products", page: "1" } },
      { query: { q: "everything", type: "all", page: "1", limit: "10" } },
    ],

    POST: [
      { json: { query: "basic search", filters: {} } },
      { json: { query: "typed search", filters: { type: ["posts"] } } },
      {
        json: {
          query: "tagged search",
          filters: { tags: ["typescript", "node"] },
        },
      },
      {
        json: {
          query: "date search",
          filters: { dateRange: { from: "2025-01-01", to: "2025-06-30" } },
        },
      },
      {
        json: {
          query: "full search",
          filters: {
            type: ["posts", "users"],
            dateRange: { from: "2025-01-01", to: "2025-12-31" },
            tags: ["ai"],
          },
          facets: true,
        },
      },
    ],
  },

  // ── Admin ─────────────────────────────────────────────

  "admin/stats": {
    GET: [
      { query: {}, headers: { authorization: "Bearer tok_admin" } },
      {
        query: { period: "month" },
        headers: { authorization: "Bearer tok_admin" },
      },
    ],
  },

  "admin/users/:id/ban": {
    params: [["usr_99"], ["usr_bad"]],
    POST: [
      {
        json: { reason: "Spam" },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        json: { reason: "Abuse", duration: 7 },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        json: { reason: "Repeat offender", permanent: true },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        json: { reason: "Harassment", duration: 30, permanent: false },
        headers: { authorization: "Bearer tok_admin" },
      },
    ],
    DELETE: [{ headers: { authorization: "Bearer tok_admin" } }],
  },

  "admin/import": {
    POST: [
      {
        multipart: formDataFactory({ type: "users" }, ["users.csv"]),
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        multipart: formDataFactory({ type: "products", overwrite: "true" }, [
          "products.csv",
        ]),
        headers: { authorization: "Bearer tok_admin" },
      },
    ],
  },

  // ── Webhooks ──────────────────────────────────────────

  "webhooks/github": {
    POST: [
      {
        json: {
          action: "push",
          repository: { full_name: "acme/app" },
          sender: { login: "alice" },
        },
        headers: {
          "x-hub-signature-256": "sha256=abc123",
          "x-github-event": "push",
        },
      },
    ],
  },

  // ── Docs ──────────────────────────────────────────────

  "docs/{...path}": {
    params: [
      [["getting-started"]],
      [["api", "reference"]],
      [["guides", "deployment", "production"]],
    ],
    GET: [
      { query: {} },
      { query: { version: "2.0" } },
      { query: { lang: "en" } },
      { query: { version: "1.5", lang: "de" } },
    ],
  },

  // ── Notifications ─────────────────────────────────────

  notifications: {
    GET: [
      { query: {}, headers: { authorization: "Bearer tok_abc123" } },
      {
        query: { unreadOnly: "true" },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        query: { type: "mention" },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        query: { limit: "5" },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        query: { unreadOnly: "true", type: "reply", limit: "20" },
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
    PATCH: [
      {
        json: { markAllRead: true },
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
  },

  "notifications/:id": {
    params: [["n_1"], ["n_abc"]],
    PATCH: [{ json: { read: true } }],
    DELETE: [{}],
  },

  // ── Contact ───────────────────────────────────────────

  contact: {
    POST: [
      {
        form: {
          name: "Alice",
          email: "alice@example.com",
          subject: "Hello",
          message: "Just reaching out!",
        },
      },
      {
        form: {
          name: "Bob",
          email: "bob@test.org",
          subject: "Support",
          message: "Need help",
          honeypot: "",
        },
      },
    ],
  },

  // ── Health / Meta ─────────────────────────────────────

  health: {
    GET: [{}],
  },

  version: {
    GET: [{}],
  },

  // ── Organizations ─────────────────────────────────────

  orgs: {
    GET: [
      { query: {} },
      { query: { page: "1" } },
      { query: { limit: "10" } },
      { query: { page: "2", limit: "5" } },
    ],
    POST: [
      {
        json: { name: "NewCo", slug: "newco", plan: "free" },
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
  },

  "orgs/:orgId": {
    params: [["org_1"], ["org_acme"]],
    GET: [{}],
    PATCH: [
      {
        json: { name: "Acme Renamed" },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        json: { logo: "https://cdn.example.com/acme.png" },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        json: { settings: { defaultRole: "editor", ssoEnabled: true } },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        json: {
          name: "Acme Full",
          logo: "https://cdn.example.com/acme2.png",
          settings: { defaultRole: "viewer", ssoEnabled: false },
        },
        headers: { authorization: "Bearer tok_admin" },
      },
    ],
    DELETE: [{ headers: { authorization: "Bearer tok_admin" } }],
  },

  "orgs/:orgId/members": {
    params: [["org_1"]],
    GET: [{ query: {} }, { query: { role: "admin" } }],
    POST: [
      {
        json: { email: "charlie@acme.com", role: "member" },
        headers: { authorization: "Bearer tok_admin" },
      },
    ],
  },

  "orgs/:orgId/members/:memberId": {
    params: [
      ["org_1", "m_2"],
      ["org_acme", "m_abc"],
    ],
    PATCH: [
      {
        json: { role: "admin" },
        headers: { authorization: "Bearer tok_admin" },
      },
    ],
    DELETE: [{ headers: { authorization: "Bearer tok_admin" } }],
  },

  "orgs/:orgId/projects/{...path}": {
    params: [
      ["org_1", ["frontend-app"]],
      ["org_1", ["frontend-app", "src"]],
      ["org_acme", ["api", "v2", "handlers"]],
    ],
    GET: [
      { query: {}, headers: { authorization: "Bearer tok_abc123" } },
      {
        query: { branch: "main" },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        query: { ref: "abc123f" },
        headers: { authorization: "Bearer tok_abc123" },
      },
      {
        query: { branch: "develop", ref: "def456" },
        headers: { authorization: "Bearer tok_abc123" },
      },
    ],
  },

  // ── Events (array query params) ───────────────────────

  events: {
    GET: [
      { query: {} },
      { query: { status: "upcoming" } },
      { query: { tags: ["conference"] } },
      { query: { tags: ["workshop", "typescript"] } },
      { query: { tags: ["meetup"], status: "live", page: "1" } },
      {
        query: {
          tags: ["conference", "ai", "web"],
          status: "past",
          page: "1",
          limit: "10",
        },
      },
    ],
  },

  "events/:id": {
    params: [["evt_1"], ["evt_abc"]],
    GET: [
      { query: {} },
      { query: { fields: ["title"] } },
      { query: { fields: ["title", "date", "location", "speakers"] } },
    ],
  },

  // ── Reports (array query params) ──────────────────────

  reports: {
    GET: [
      {
        query: { metrics: ["revenue"] },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        query: { metrics: ["revenue", "signups", "churn"] },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        query: { metrics: ["revenue"], groupBy: ["month"] },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        query: { metrics: ["revenue"], from: "2025-01-01" },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        query: { metrics: ["revenue"], to: "2025-06-30" },
        headers: { authorization: "Bearer tok_admin" },
      },
      {
        query: {
          metrics: ["revenue", "signups"],
          groupBy: ["month", "region"],
          from: "2025-01-01",
          to: "2025-12-31",
        },
        headers: { authorization: "Bearer tok_admin" },
      },
    ],
  },
};
