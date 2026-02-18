# @kosmojs/typebox-generator

Enables runtime validation for `KosmoJS` applications
by automatically converting TypeScript types into JSON Schema validators using TypeBox.

Provides end-to-end type safety from compile-time checking to runtime validation.

## Installation

```sh
npm install -D @kosmojs/typebox-generator
npm install typebox
```

```sh
pnpm install -D @kosmojs/typebox-generator
pnpm install typebox
```

```sh
yarn add -D @kosmojs/typebox-generator
yarn add typebox
```

## Usage

Add to your source folder's `vite.config.ts`:

```ts [vite.config.ts]
import devPlugin from "@kosmojs/dev";
import typeboxGenerator from "@kosmojs/typebox-generator";

export default {
  plugins: [
    devPlugin(apiurl, {
      generators: [
        typeboxGenerator(),
        // other generators...
      ],
    }),
  ],
}
```

## What It Generates

- **Runtime validators** - TypeBox-based validators from your TypeScript types
- **Validation schemas** - JSON Schema representations of your types
- **Client-side validation** - Validates fetch requests before network calls
- **Server-side validation** - Validates route parameters, payloads, and responses
- **Error handling** - Detailed `ValidationError` with structured error information

## Features

- 🔒 **Single source of truth** - Write types once, get runtime validation
- 🎯 **Type refinements** - Use `TRefine` for constraints (min/max, patterns, formats)
- ⚡ **High performance** - Compiled validators optimized for speed
- 🌐 **Client + Server** - Validates on both sides with same schemas
- 📋 **Form validation** - Export schemas for UI validation without server calls
- 🚫 **No schema duplication** - Types are validation, validation is types

## Basic Example

```ts
import { defineRoute } from "@front/{api}/users";

export default defineRoute(({ POST }) => [
  POST<{
    email: TRefine<string, { format: "email" }>;
    age: TRefine<number, { minimum: 18, maximum: 120 }>;
    name: TRefine<string, { minLength: 1, maxLength: 100 }>;
  }>(async (ctx) => {
    // ctx.validated is validated before reaching here
    const { email, age, name } = ctx.validated;
  }),
]);
```

## Validation Scopes

Validates three areas automatically:

- **Parameters** - Route parameters like `/users/[id]`
- **Payloads** - Request bodies (POST, PUT, PATCH) and query strings (GET)
- **Responses** - Response bodies to ensure handlers return correct data

## Client-Side Validation

The fetch generator integrates validation automatically:

```ts
import useFetch from "@front/{api}/users/fetch";

// Validates before making request
const response = await useFetch.POST([123], {
  json: {
    email: "invalid",  // Throws ValidationError immediately
    age: 15,           // Below minimum
  }
});
```

## Form Validation

Access validation schemas directly for form validation:

```ts
import useFetch from "@front/{api}/users/fetch";

const isValid = useFetch.validationSchemas.json.POST.check(formData);

if (!isValid) {
  const errors = useFetch.validationSchemas.json.POST.errors(formData);
  // Display errors in UI
}
```

## Documentation

[Complete validation guide](https://kosmojs.dev/validation/intro.html)

## License

MIT
