---
title: Client-Side Validation
description: Automatic client-side validation with TypeBox schemas before network requests.
    Use check, errors, errorMessage methods for form validation with performance optimization patterns.
head:
  - - meta
    - name: keywords
      content: client validation, form validation, typebox, validation schemas, check method,
        validation errors, nested field validation, performance optimization, real-time validation
---

Fetch clients validate parameters and payload before making any network request -
using the exact same schemas as the server. Invalid data throws immediately, no round trip needed.

## 📋 Validation Schemas

Beyond automatic fetch validation, each client exposes `validationSchemas` for use directly in your UI -
ideal for real-time form feedback:

```ts
const { validationSchemas } = fetchClients["users"];

validationSchemas.params;      // parameter validation
validationSchemas.json.POST;   // JSON payload validation for POST
```

Each schema has four methods:

- **`check(data)`** - fast boolean check, safe to call on every keystroke
- **`errors(data)`** - returns `Array<ValidationErrorEntry>` with field-level detail; only call after `check` returns false
- **`errorMessage(data)`** - all errors as a single readable string
- **`errorSummary(data)`** - brief overview, e.g. `"2 validation errors found across 2 fields"`

`check` is cheap. `errors`, `errorMessage`, and `errorSummary` are heavier - gate them behind `check`.

## 🪆 Field Paths

Nested field errors use arrow notation: `"customer ➜ address ➜ city"`.
Match them with word-boundary regex to avoid false positives:

```ts
const emailError = errors.find(({ path }) => /\bemail\b/.test(path));
```

## ⚡ Per-Field Validation Performance

Schemas validate entire objects, not individual fields. This creates a subtle issue
when validating fields as users type: on a partially-filled form, `check` returns false
for missing required fields - not just the one you're testing - which triggers
unnecessary `errors()` calls on every keystroke.

The fix is to merge the actual field value into a fully-valid placeholder payload,
so `check` only fails when the field under test actually has a problem:

```ts
// Define a valid baseline - all required fields filled with values that pass all constraints.
// This is a one-time setup per form, not per keystroke.
const validPayload = { name: "Valid Name", email: "valid@example.com", age: 25 };

// On input event for "name" - override just that field
const payload = { ...validPayload, name: event.target.value };

if (!validationSchemas.json.POST.check(payload)) {
  const nameError = validationSchemas.json.POST.errors(payload).find(e => e.path === "name");
  // show nameError.message near the name field
}
```

Each field gets its own merge - `{ ...validPayload, email: event.target.value }` for email, and so on.
The placeholder values for other fields are never submitted anywhere,
they just keep `check` from firing false negatives.

Most forms don't need this. If you validate on submit rather than on input,
or your form has only a few fields, direct validation works fine.
It matters for complex forms with many required fields that validate in real time.

On submit, always validate the actual payload - not the merged one:

```ts
if (!validationSchemas.json.POST.check(actualPayload)) {
  const errors = validationSchemas.json.POST.errors(actualPayload);
  // surface all errors at once
  return;
}

await useFetch.POST([], actualPayload);
```
