---
title: Dynamic Route Parameters
description: Handle dynamic URL segments with required [id], optional {id} and splat {...path} parameters.
    SolidStart-inspired syntax that works identically for API routes and client pages.
head:
  - - meta
    - name: keywords
      content: route parameters, dynamic routes, url parameters, required parameters,
        optional parameters, splat parameters, bracket notation, path segments
---

Real applications need to handle dynamic segments in URLs - user IDs, post slugs, category names, and so on.

`KosmoJS` supports `[required]`, `{optional}` and `{...splat}` params
using a friendly, readable and memorable syntax.

The key benefit is that these patterns work identically for both API routes and client pages,
so you only need to learn the syntax once.

## [] Required Parameters

Required parameters use square brackets, like `[id]`.

A folder named `[id]` matches exactly one path segment in that position,
and the matched value is made available to your route handler or component.

```
users/
  [id]/
    index.ts   ➜ matches /users/123, /users/abc, /users/anything
```

This route matches `/users/123` or `/users/abc` but does not match `/users`
(missing the required segment) or `/users/123/posts`
(has an extra segment that isn't accounted for in the route structure).

The parameter name inside the brackets is significant. If you name it `[id]`,
your route handler will receive that segment as a parameter called `id`.

If you name it `[userId]`, it becomes `userId`. Choose names that make your code self-documenting.

## {} Optional Parameters

Optional parameters use curly braces, like `{id}`.

These routes match whether or not that segment is present in the URL,
giving you flexibility to handle both cases in a single route handler.

```
users/
  {id}/
    index.ts   ➜ matches both /users and /users/123
```

This is useful when you want a route that can show either a list view (when no ID is provided)
or a detail view (when an ID is present).

Rather than creating two separate routes, you handle both cases in one place
and branch your logic based on whether the parameter exists.

**Important constraint:** Optional parameters must not be folowed by required parameters!

Valid patterns:
- `users/posts/{postId}` ✅
- `users/{section}/{subsection}` ✅
- `users/{id}/posts` ⚠️ (static segment, works with a caveat, see below)

Invalid patterns:
- `users/{optional}/[required]` ❌ (required after optional)

This constraint ensures the path variations make logical sense
and prevents ambiguous routing scenarios.

### Optional Parameters with Static Conflicts

A common mistake when using optional parameters is creating ambiguous route structures:

```txt
properties/
└── {city}/
    └── filters/
        └── index.tsx
```

**What matches:**
- ✅ `/properties/NY/filters` ➜ `city = "NY"`, renders filters page
- ❌ `/properties/filters` ➜ **404 Not Found**

### Why It Fails

When visiting `/properties/filters`:

1. Router first tries static routes: `properties/filters` (doesn't exist)
2. Router then tries optional param: `properties/{city}` with `city = "filters"`
3. Router expects the next segment to be `filters`, but the path ends
4. **Result**: No match, 404 error

The router consumed `filters` as the `city` parameter, leaving nothing to match the `filters` segment!

### The Solution

Create an explicit static route for the ambiguous path:

```txt
properties/
├── filters/
│   └── index.tsx          🢀 Handles /properties/filters
└── {city}/
    └── filters/
        └── index.tsx      🢀 Handles /properties/NY/filters
```

**Now it works:**
- ✅ `/properties/filters` ➜ Matches static `properties/filters/index.tsx`
- ✅ `/properties/NY/filters` ➜ Matches dynamic `properties/{city}/filters/index.tsx`

**Static routes always win over dynamic/optional routes!**

### General Rule

**When using optional parameters, ensure static segments that follow the optional param
have dedicated routes.**

```txt [❌ Ambiguous]
blog/{category}/archive    🢀 /blog/archive will 404
```

```txt [✅ Good]
blog/
├── archive/index.tsx        🢀 Handles /blog/archive
└── {category}/
    └── archive/index.tsx    🢀 Handles /blog/tech/archive
```

### Summary

- **Optional params can create ambiguous routes** when followed by static segments
- **Static routes have priority** over dynamic/optional routes in all frameworks
- **Solution**: Create explicit static routes for potentially ambiguous paths

## {...} Splat Parameters

Splat parameters use the spread syntax `{...path}` and match any number of additional path segments.

This is particularly useful for documentation sites,
file browsers, or any situation where you need to handle arbitrarily nested paths.

```
docs/
  {...path}/
    index.ts   ➜ matches /docs/getting-started
               ➜ matches /docs/api/reference
               ➜ matches /docs/guides/deployment/production
```

The matched segments are provided to your handler as an array,
allowing you to process the full path structure however you need.

For example, in a documentation site, you might use this to look up content files based on the full path,
or in a file browser, you might navigate a directory structure.

## 💡 Understanding Required vs Optional

The `[param]` notation means **a value must be provided at this URL position**.
However, there are exceptions...

Let's consider this example:

```txt
careers/
└── [jobId]/
    └── index.tsx  🢀 Job detail
```

Here `[jobId]` is truly required to be present in the URL.
Otherwise the router would return `404` as no route matched.

But if you add a `careers/index.tsx` file, `[jobId]` becomes optional,
because there is a fallback to render when the param is missing - `careers/index.tsx`:

```txt
careers/
├── index.tsx      🢀 Job listings, rendered when no jobId provided
└── [jobId]/       🢀 This becomes optional
    └── index.tsx  🢀 Job detail
```

**Pro tip to avoid confusion:**

When a parent index exists, `[param]` effectively becomes `{param}` from a routing perspective.
In this case you can freely use `{param}` notation to avoid confusion:

```txt
careers/
├── index.tsx
└── {jobId}/     🢀 Optional syntax makes intent clearer
    └── index.tsx
```

This makes it explicit that the parameter is optional - users can visit `/careers` without it.
Both notations work identically when a parent index exists, but `{param}` communicates the intent better.

## 🔗 Mixed Segments

Until now, we've used only single-purpose segments: either a static segment like `users` or a parameter like `[id]`.

However, `KosmoJS` also supports mixed segments that combine static text with parameters.

### Examples

**Product categories with file extension:**

```
products/[category].html
```

- ✅ `/products/electronics.html` - Matches
- ✅ `/products/books.html` - Matches
- ❌ `/products/books` - NO match (.html extension required)
- ❌ `/products` - NO match (category parameter required)

**User profile data endpoints:**

```
profiles/[id]-[data].json
```

- ✅ `/profiles/1-posts.json` - Matches
- ✅ `/profiles/10-reviews.json` - Matches
- ❌ `/profiles/1-posts` - NO match (.json extension required)
- ❌ `/profiles/posts.json` - NO match (both id and data parameters required)

**Versioned API endpoints:**

```
api/v[version]/[endpoint].json
```

- ✅ `/api/v1/users.json` - Matches
- ✅ `/api/v2/products.json` - Matches
- ❌ `/api/v1/users` - NO match (.json extension required)
- ❌ `/api/v/users.json` - NO match (version parameter required)

**Monthly report archives:**

```
reports/[year]-[month]-summary.pdf
```

- ✅ `/reports/2024-03-summary.pdf` - Matches
- ✅ `/reports/2023-12-summary.pdf` - Matches
- ❌ `/reports/2024-03-summary` - NO match (.pdf extension required)
- ❌ `/reports/2024-summary.pdf` - NO match (month parameter required)

**Generic file handler:**

```
files/[name].[ext]
```

- ✅ `/files/document.pdf` - Matches
- ✅ `/files/image.png` - Matches
- ❌ `/files/document` - NO match (extension required)
- ❌ `/files/.pdf` - NO match (filename required)

### Framework Support

Mixed segments work perfectly for backend routes (Koa/Hono), but have limited support on the frontend:

- **SolidJS Router** - No mixed segments support
- **React Router** - Only `.ext` notation supported (e.g., `products/[category].html`)
- **Vue Router** - Full mixed segments support

**Recommendation:** Use mixed segments primarily for backend APIs where complex routing patterns are needed.
For frontend routes, prefer simple URL patterns that render well in the address bar and are memorable for users.

## ⚡ Power Syntax

`KosmoJS` supports advanced `path-to-regexp@v8` patterns for maximum flexibility.

**The rule:** If an optional parameter name contains only alphanumeric characters,
it is treated as a simple parameter (e.g., `{name}`).
If any non-alphanumeric characters are detected in the name,
it is treated as a `path-to-regexp@v8` pattern and used directly without transformation.

### Optional Static Parts

Consider this pattern: `products/{category}.html`

Without power syntax, this creates awkward URLs like `/products/.html` when no category is provided,
and `/products` would never match because `.html` is a required static part.

**With power syntax:** `products/{:category.html}`

Both `category` and `.html` become optional:
- ✅ `/products` - Matches (no category, no .html)
- ✅ `/products/electronics.html` - Matches
- ✅ `/products/books.html` - Matches
- ❌ `/products/electronics` - No match (missing .html when category provided)

### More Examples

**Optional prefix and parameter:**

```
book{-:id}-info
```

- ✅ `/book-info` - Matches (no id)
- ✅ `/book-123-info` - Matches (id = 123)

**Nested optional parameters:**

```
book-[id]/{{:category-}reviews}
```

- ✅ `/book-123` - Matches (no category)
- ✅ `/book-123/reviews` - Matches (still no category)
- ✅ `/book-123/top-rated-reviews` - Matches (category = top-rated)

**Complex optional structure:**

```
locale{-:lang{-:country}}
```

- ✅ `/locale` - Matches (no lang, no country)
- ✅ `/locale-en` - Matches (lang = en, no country)
- ✅ `/locale-en-US` - Matches (lang = en, country = US)

**API versioning with optional parts:**

```
api/{v:version}/users
```

- ✅ `/api/users` - Matches (no version)
- ✅ `/api/v1/users` - Matches (version = 1)
- ✅ `/api/v2/users` - Matches (version = 2)

### Learn More

`path-to-regexp` v8 is state-of-the-art in routing, allowing highly customized patterns.
However, use with caution - learn its syntax thoroughly before applying it to production routes.

**Documentation:** [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
