---
title: Dynamic Route Parameters
description: Handle dynamic URL segments with required :id, optional {:id} and splat {...path} parameters.
    SolidStart-inspired syntax that works identically for API routes and client pages.
head:
  - - meta
    - name: keywords
      content: route parameters, dynamic routes, url parameters, required parameters,
        optional parameters, splat parameters, bracket notation, path segments
---

Real applications need to handle dynamic segments in URLs - user IDs, post slugs, category names, and so on.

`KosmoJS` supports three types of dynamic parameters using a syntax inspired by
[`SolidStart`](https://start.solidjs.com/).

The key benefit is that these patterns work identically for both API routes and client pages,
so you only need to learn the syntax once.

## Required Parameters

Required parameters use semicolon prefix, like `:id`.

A folder named `:id` matches exactly one path segment in that position,
and the matched value is made available to your route handler or component.

```
users/
  :id/
    index.ts         ➜ matches /users/123, /users/abc, /users/anything
```

This route matches `/users/123` or `/users/abc` but does not match `/users`
(missing the required segment) or `/users/123/posts`
(has an extra segment that isn't accounted for in the route structure).

The parameter name inside the brackets is significant. If you name it `:id`,
your route handler will receive that segment as a parameter called `id`.

If you name it `:userId`, it becomes `userId`. Choose names that make your code self-documenting.

## Optional Parameters

Optional parameters use curly brackets, like `{:id}`.

These routes match whether or not that segment is present in the URL,
giving you flexibility to handle both cases in a single route handler.

```
users/
  {:id}/
    index.ts         ➜ matches both /users and /users/123
```

This is useful when you want a route that can show either a list view (when no ID is provided)
or a detail view (when an ID is present).

Rather than creating two separate routes, you handle both cases in one place
and branch your logic based on whether the parameter exists.

**Important constraint:** Optional parameters must not be folowed by required parameters!

Valid patterns:
- `users/posts/{:postId}` ✅
- `users/{:section}/{:subsection}` ✅
- `users/{:id}/posts` ⚠️ (static segment, works with a caveat, see below)

Invalid patterns:
- `users/{:optional}/:required` ❌ (required after optional)

This constraint ensures the path variations make logical sense
and prevents ambiguous routing scenarios.

### Optional Parameters with Static Conflicts

A common mistake when using optional parameters is creating ambiguous route structures:

```txt
properties/
└── {:city}/
    └── filters/
        └── index.tsx
```

**What matches:**
- ✅ `/properties/NY/filters` ➜ `city = "NY"`, renders filters page
- ❌ `/properties/filters` ➜ **404 Not Found**

### Why It Fails

When visiting `/properties/filters`:

1. Router first tries static routes: `properties/filters` (doesn't exist)
2. Router then tries optional param: `properties/{:city}` with `city = "filters"`
3. Router expects the next segment to be `filters`, but the path ends
4. **Result**: No match, 404 error

The router consumed `filters` as the `city` parameter, leaving nothing to match the `filters` segment!

### The Solution

Create an explicit static route for the ambiguous path:

```txt
properties/
├── filters/
│   └── index.tsx          🢀 Handles /properties/filters
└── {:city}/
    └── filters/
        └── index.tsx      🢀 Handles /properties/NY/filters
```

**Now it works:**
- `/properties/filters` ➜ Matches static `properties/filters/index.tsx`
- `/properties/NY/filters` ➜ Matches dynamic `properties/{:city}/filters/index.tsx`

**Static routes always win over dynamic/optional routes!**

### General Rule

**When using optional parameters, ensure static segments that follow the optional param
have dedicated routes.**

```txt [❌ Ambiguous]
blog/{:category}/archive    🢀 /blog/archive will 404
```

```txt [✅ Good]
blog/
├── archive/index.tsx        🢀 Handles /blog/archive
└── {:category}/
    └── archive/index.tsx    🢀 Handles /blog/tech/archive
```

### Summary

- **Optional params can create ambiguous routes** when followed by static segments
- **Static routes have priority** over dynamic/optional routes in all frameworks
- **Solution**: Create explicit static routes for potentially ambiguous paths

## Splat Parameters

Splat parameters use the spread syntax `{...path}` and match any number of additional path segments.

This is particularly useful for documentation sites,
file browsers, or any situation where you need to handle arbitrarily nested paths.

```
docs/
  {...path}/
    index.ts         ➜ matches /docs/getting-started
                     ➜ matches /docs/api/reference
                     ➜ matches /docs/guides/deployment/production
```

The matched segments are provided to your handler as an array,
allowing you to process the full path structure however you need.

For example, in a documentation site, you might use this to look up content files based on the full path,
or in a file browser, you might navigate a directory structure.

## Understanding Required vs Optional

The `:param` notation means **a value must be provided at this URL position**.
However, there are exceptions...

Let's consider this example:

```txt
careers/
└── :jobId/
    └── index.tsx  🢀 Job detail
```

Here `:jobId` is truly required to be present in the URL.
Otherwise the router would return `404` as no route matched.

But if you add a `careers/index.tsx` file, `:jobId` becomes optional,
because there is a fallback to render when the param is missing - `careers/index.tsx`:

```txt
careers/
├── index.tsx      🢀 Job listings, rendered when no jobId provided
└── :jobId/       🢀 This becomes optional
    └── index.tsx  🢀 Job detail
```

**Pro tip to avoid confusion:**

When a parent index exists, `:param` effectively becomes `{:param}` from a routing perspective.
In this case you can freely use `{:param}` notation to avoid confusion:

```txt
careers/
├── index.tsx
└── {:jobId}/     🢀 Optional syntax makes intent clearer
    └── index.tsx
```

This makes it explicit that the parameter is optional - users can visit `/careers` without it.
Both notations work identically when a parent index exists, but `{:param}` communicates the intent better.

## Required vs Optional Patterns

### Pattern 1: Truly Required Parameter

**No parent index = parameter is required to access the route**

```txt
shop/
└── product/
    └── :id/
        └── index.tsx
```

**Routes:**
- ❌ `/shop/product` ➜ NO MATCH (no index.tsx)
- ✅ `/shop/product/123` ➜ MATCHES

**Use case:** The page cannot function without the parameter.
There's no "product listing" page - you must specify a product ID.

**Examples:**
- `/order/:orderId` - Can't show "an order" without an ID
- `/edit/:documentId` - Can't edit without specifying what to edit
- `/invoice/:invoiceId` - Invoice page needs an invoice

### Pattern 2: Separate Routes (List + Detail)

**Parent index exists = two independent routes**

```txt
careers/
├── index.tsx      🢀 Job listings
└── {:jobId}/      🢀 Optional param
    └── index.tsx  🢀 Job detail
```

**Routes:**
- ✅ `/careers` ➜ MATCHES `careers/index.tsx` (list all jobs)
- ✅ `/careers/123` ➜ MATCHES `careers/:jobId/index.tsx` (specific job)

**Use case:** Two **different pages** with different purposes.

**Key insight:** These are **separate pages** with separate files.
One shows a list, the other shows details.

**Examples:**
- `/products` (browse catalog) vs `/products/:id` (product page)
- `/users` (user directory) vs `/users/:id` (user profile)
- `/docs` (documentation home) vs `/docs/{...path}` (specific doc)

### Pattern 3: Single Route with Optional Parameter

**Single index with optional param = one page that adapts**

```txt
careers/
└── {:jobId}/
    └── index.tsx
```

**Routes:**
- ✅ `/careers` ➜ MATCHES (jobId is undefined)
- ✅ `/careers/123` ➜ MATCHES (jobId is "123")

**Use case:** **Same page** that changes behavior based on parameter presence.

**Key insight:** **One page, one file** - the component handles both states internally.

**Examples:**
- `/inbox/{:messageId}` - Email list with optional message preview
- `/files/{:path}` - File browser with optional file selected
- `/settings/{:section}` - Settings page with optional section focused
