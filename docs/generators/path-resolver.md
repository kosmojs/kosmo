---
title: Path Resolver Utility
description: Use pathResolver for consistent path construction across KosmoJS directory structure
    including source folders, lib directories, and root locations with type-safe directory names.
head:
  - - meta
    - name: keywords
      content: path resolver, directory structure, path construction, file paths, typescript paths
---

The `pathResolver` utility provides consistent path generation across KosmoJS's codebase.

### Purpose

`pathResolver` solves two related path problems:
- **Filesystem paths** - Where files actually live on disk
- **Import paths** - How TypeScript imports reference those files (with `~`, `@`, `_` prefixes)

### Usage

```ts
import { pathResolver } from "@kosmojs/lib";

const { createPath, createImport } = pathResolver(sourceFolder);
```

### Creating Filesystem Paths

Use `createPath` methods to generate filesystem paths:

```ts
// Source folder files
createPath.src("config.ts")            // → "src/front/config.ts"
createPath.api("users", "index.ts")    // → "src/front/api/users/index.ts"
createPath.pages("dashboard.tsx")      // → "src/front/pages/dashboard.tsx"

// Generated files (lib directory)
createPath.lib("types.ts")             // → "lib/src/front/types.ts"
createPath.libApi("routes.ts")         // → "lib/src/front/api/routes.ts"
```

### Creating Import Paths

Use `createImport` methods to generate TypeScript import paths with proper prefixes:

```ts
// Source folder imports (~/ prefix)
createImport.src("config")             // → "~/config"
createImport.api("users/[id]")         // → "~/api/users/[id]"
createImport.pages("dashboard")        // → "~/pages/dashboard"

// Generated code imports (_/ prefix)
createImport.lib("types")              // → "_/types"
createImport.libApi("routes")          // → "_/api/routes"
```

### Available Methods

**createPath methods:**
- `src(...paths)` - Source folder files
- `api(...paths)` - API route files
- `pages(...paths)` - Page component files
- `config(...paths)` - Configuration files
- `entry(...paths)` - Entry point files
- `lib(...paths)` - Generated files root
- `libApi(...paths)` - Generated API files
- `libEntry(...paths)` - Generated entry files
- `libPages(...paths)` - Generated page files
- `distDir(...paths)` - Path to source folder's output directory

**createImport methods:**
- `src(...paths)` - Source imports with `~/` prefix
- `config(...paths)` - Config imports with `~/` prefix
- `api(...paths)` - API imports with `~/` prefix
- `pages(...paths)` - Page imports with `~/` prefix
- `lib(...paths)` - Generated imports with `_/` prefix
- `libApi(...paths)` - Generated API imports with `_/` prefix
- `libEntry(...paths)` - Generated entry imports with `_/` prefix

The resolver ensures your generator uses the same path conventions as `KosmoJS` built-in generators,
maintaining consistency across the codebase.

### Handlebars Integration

The `createImportHelper` method provides a Handlebars-ready helper for template generation.
Register it through `renderFactory`:

```ts
import { pathResolver, renderFactory } from "@kosmojs/lib";

const { createPath, createImportHelpers } = pathResolver(sourceFolder);

const { render, renderToFile } = renderFactory({
  helpers: {
    createImport: createImportHelpers({ origin: "lib" }),  // Register as "createImport" helper
  },
});
```

Now you can use it in Handlebars templates:

```handlebars
{{!-- Generate import paths in templates --}}
import { defineRoute } from "{{ createImport 'libApi' }}";
import config from "{{ createImport 'config' }}";
```

Which compiles to:

```ts
import { defineRoute } from "_/api";
import config from "@/src/front/config";
```

The helper automatically handles Handlebars' argument passing
(Handlebars appends an options object as the last argument,
which `createImportHelpers` strips off before delegating to `createImport`).

**Usage in templates:**
```handlebars
{{ createImport method "a" "b" "c" }}
```

Where `method` is any `createImport` method name:
`"coreApi"`, `"src"`, `"api"`, `"pages"`, `"lib"`, `"libApi"` etc.
