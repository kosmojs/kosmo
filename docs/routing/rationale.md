---
title: Directory-based nested routing
description: Understanding why directory-based routing scales better than file-based routing
    for organizing large applications with clear navigation, colocalization, and visual hierarchy.
head:
  - - meta
    - name: keywords
      content: directory routing benefits, file-based routing, routing comparison,
        scalability, code organization, folder structure, routing patterns
---

At first glance, directory-based routing might seem more verbose compared to file-based routing systems.
You might wonder why `api/users/:id/index.ts` is better than simply `api/users/:id.ts`.
The answer becomes clear as your application scales.

### ⚠️ File-Based Routing Limitations

In file-based routing systems, each route is a single file. Consider a typical API structure:

```
api/
  users/
    index.ts           ➜ Handler for /users
    :id.ts             ➜ Handler for /users/:id
    schema.ts          ➜ Validation schemas... for which route?
    auth.ts            ➜ Authorization... for which endpoint?
    utils.ts           ➜ Helpers... used by what?
```

**The problem: Which file is the actual route handler?**

At first glance, which files are route handlers and which are helpers?
Is `schema.ts` a route that handles `/users/schema`? Or is it a helper file?
You have to open files or rely on framework-specific conventions to figure out what's what.

### 🏆 Directory-Based Routing Benefits

With directory-based routing, each route gets its own folder with one handler: `index.ts`

```
api/
  users/
    index.ts           ➜ Handler for /users
    schema.ts          ➜ Clearly for /users route

    :id/
      index.ts         ➜ Handler for /users/:id
      permissions.ts   ➜ Obviously for this endpoint

      posts/
        index.ts       ➜ Handler for /users/:id/posts
        formatter.ts   ➜ Post-specific logic
```

**The clarity: Only `index.ts` is special. Everything else is a helper.**

The benefits become apparent at scale:

**Instant recognition:**
Every route handler is named `index.ts`. No guessing, no pattern matching.
See `index.ts`? That's the handler. Everything else? Helpers for that route.

**Natural colocalization:**
Each route has its own namespace. Name collision? Impossible.
Want to add validation? Just create `validation.ts` in that route's folder.

**Clear ownership:**
Looking at `api/users/:id/permissions.ts`, you immediately know it's for the `/users/:id` endpoint.
No need to trace imports or read code to understand the relationship.

**Self-documenting structure:**
The folder tree *is* your API documentation. Want to see all endpoints? Look at the folders.
Each folder with an `index.ts` is a route. Everything else is support code.

**Scales gracefully:**

```
api/
  products/
    index.ts

    :id/
      index.ts
      cache.ts
      pricing.ts

      reviews/
        index.ts
        moderation.ts

        :reviewId/
          index.ts
          flags.ts
```

The hierarchy is immediately clear. Each route's complexity is isolated to its own folder.

### ⚖️ The Trade-off

Yes, directory-based routing is slightly more verbose upfront.
You create a folder even when you only have an `index.ts` inside it.
But this small initial cost pays enormous dividends:

- **Consistent conventions:** `index.ts` is always the handler, no exceptions
- **Zero ambiguity:** Helpers are obviously helpers because they're not named `index.ts`
- **Room to grow:** When you need to add helpers, there's already a natural place for them
- **Instant navigation:** Six months later, you can find any route instantly
- **Onboarding:** New developers understand the structure in minutes, not days

It's one of those "trust the process" patterns where the benefit isn't obvious until your application grows.
But once you've experienced trying to maintain a large file-based routing system with ambiguous file naming,
you'll appreciate why directory-based routing enforces this clear structure from the start.
