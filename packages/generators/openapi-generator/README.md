# @kosmojs/openapi-generator

Automatically generates OpenAPI 3.1 specifications from KosmoJS API routes, analyzing route structure,
TypeScript types, and validation schemas to produce standards-compliant documentation.

## Installation

```sh
npm install -D @kosmojs/openapi-generator
```

```sh
pnpm install -D @kosmojs/openapi-generator
```

```sh
yarn add -D @kosmojs/openapi-generator
```

## Usage

Add to your source folder's `vite.config.ts`:

```ts [vite.config.ts]
import devPlugin from "@kosmojs/dev";
import openapiGenerator from "@kosmojs/openapi-generator";

export default {
  plugins: [
    devPlugin(apiurl, {
      generators: [
        openapiGenerator({
          outfile: "openapi.json",
          openapi: "3.1.0",
          info: {
            title: "My API",
            version: "1.0.0",
            description: "API documentation for My App",
          },
          servers: [
            {
              url: "http://localhost:4000",
              description: "Development server"
            }
          ],
        }),
        // other generators...
      ],
    }),
  ],
}
```

## What It Generates

- **Complete OpenAPI spec** - Paths, schemas, parameters, request/response bodies
- **Type definitions** - Extracted from TypeScript types and validation schemas
- **Validation rules** - Constraints from `TRefine` types as JSON Schema keywords
- **Multiple path variations** - For routes with optional parameters

## Configuration Options

### Required

- `outfile` - Path where spec will be written (relative to vite.config.ts)
- `openapi` - OpenAPI version (e.g., "3.1.0")
- `info.title` - API name
- `info.version` - API version (semantic versioning)
- `servers` - Array of server objects with `url` and optional `description`

### Optional Info Properties

- `summary` - Short API summary
- `description` - Detailed description (supports markdown)
- `termsOfService` - URL to terms
- `contact` - Object with `name`, `url`, `email`
- `license` - Object with `name`, `identifier`, `url`

## Complete Example

```ts
openapiGenerator({
  outfile: "openapi.json",
  openapi: "3.1.0",
  info: {
    title: "My SaaS API",
    version: "2.1.0",
    summary: "RESTful API for My SaaS Platform",
    description: "Complete API for platform features",
    contact: {
      name: "API Support",
      email: "api@example.com"
    },
    license: {
      name: "Apache 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0.html"
    }
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Development"
    },
    {
      url: "https://api.example.com",
      description: "Production"
    }
  ],
})
```

## Features

- 🔄 **Automatic regeneration** - Updates on route changes
- 📝 **Standards compliant** - OpenAPI 3.1 specification
- 🎯 **Type-driven** - Extracts schemas from TypeScript types
- ✅ **Validation aware** - Includes constraints from validation schemas
- 🌐 **Multiple servers** - Define dev, staging, production environments
- 📚 **Documentation ready** - Works with Swagger UI, Redoc, Stoplight

## Using the Spec

Serve with documentation tools:

```sh
# Swagger UI
npx swagger-ui-watcher openapi.json

# Redoc
npx @redocly/cli preview-docs openapi.json
```

## Documentation

[Complete OpenAPI guide](https://kosmojs.dev/generators/openapi/intro.html)

## License

MIT

