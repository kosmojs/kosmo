---
title: Fetch Client Error Handling
description: Handle fetch request errors with try-catch blocks, distinguish ValidationError from network errors,
    and implement defense in depth with client-side and server-side validation.
head:
  - - meta
    - name: keywords
      content: fetch error handling, ValidationError, client-side validation, error catching,
        try-catch, network errors, validation feedback, defensive programming
---

The fetch client throws two distinct error types worth handling separately:
`ValidationError` for failed validation before the request is sent,
and standard errors for network or server failures.

```ts [pages/example/index.tsx]
import fetchMap, { ValidationError } from "_/fetch";

const useFetch = fetchMap["users/[id]"];

try {
  const response = await useFetch.POST([userId], payload);
} catch (error) {
  if (error instanceof ValidationError) {
    // data didn't pass validation - no request was made
    console.error("Invalid data:", error.message);
  } else {
    // network error, server error, etc.
    console.error("Request failed:", error);
  }
}
```

Validation errors carry the same structured detail as server-side `ValidationError` instances -
`target`, `errors`, `errorMessage`, `errorSummary` - so you can surface field-level feedback
without waiting for a server response.

[More on Error Details →](/validation/error-handling)
