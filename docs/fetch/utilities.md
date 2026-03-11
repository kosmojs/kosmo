---
title: Path Utilities
description: Build URLs with path and href utility functions that handle route parameters,
    query strings, and base URL configuration for navigation and external references.
head:
  - - meta
    - name: keywords
      content: url construction, path utilities, query parameters, route parameters,
        href builder, url builder, api urls, navigation links
---

Each fetch client exposes `path` and `href` for building URLs without making a request -
useful for navigation, `<a>` tags, or passing URLs to other services.

```ts [pages/example/index.tsx]
import fetchClients from "_/front/fetch";

const useFetch = fetchClients["users/[id]"];

useFetch.path([123]);
// → "/api/users/123"

useFetch.path([123], { query: { include: "posts" } });
// → "/api/users/123?include=posts"

useFetch.href("https://api.example.com", [123]);
// → "https://api.example.com/api/users/123"

useFetch.href("https://api.example.com", [123], { query: { include: "posts" } });
// → "https://api.example.com/api/users/123?include=posts"
```

Multiple parameters follow path order:

```ts
// route: posts/[userId]/comments/[commentId]
useFetch.path([456, 789]);
// → "/api/posts/456/comments/789"
```
