---
title: Vite Plugins
description: KosmoJS is a standard Vite template powered by three plugins -
    AliasPlugin for path resolution, DefinePlugin for environment variables, and DevPlugin for code generation.
head:
  - - meta
    - name: keywords
      content: vite plugins, kosmojs plugins, alias plugin, define plugin, dev plugin,
        path resolution, code generation, environment variables
---

`KosmoJS` is a standard `Vite` template.
All its functionality comes from `Vite` plugins that handle path resolution,
environment variable management, and code generation.

### 🔌 Core Plugins

`KosmoJS` provides three plugins that work together to create the development experience:

🔹 **AliasPlugin** reads the path mappings from your `tsconfig.json`,
performs filesystem analysis, and provides alias information to Vite.
This allows `Vite` to resolve imports like `_/front/api` to the correct locations.
([Details ➜ ](/plugins/alias-plugin))

🔹 **DefinePlugin** manages environment variables with fine-grained control.
Unlike Vite's default environment handling,
this plugin lets you explicitly specify which variables to expose to client code,
both from `process.env` and from `.env` files.
([Details ➜ ](/plugins/define-plugin))

🔹 **DevPlugin** is the main plugin that coordinates code generation.
It manages generators (for API routes, fetch clients, validation schemas, etc.)
([Details ➜ ](/plugins/dev-plugin))

### 🎨 Customizing Plugin Behavior

Each plugin is designed to work with sensible defaults,
but you can customize them for your project's specific needs.

For AliasPlugin, customization typically isn't needed
since it derives everything from your `tsconfig.json`.
If you need custom behavior, you can modify the `tsconfig.json` path mappings
and the plugin will adapt.
([Details ➜ ](/plugins/alias-plugin))

For DefinePlugin, adjust which environment variables to expose
by modifying the `keys` arrays in your base configuration.
([Details ➜ ](/plugins/define-plugin))

For DevPlugin, add or remove generators in each source folder's configuration.
Different source folders can use different generators -
perhaps your main app uses SolidJS while your admin panel uses React.
([Details ➜ ](/plugins/dev-plugin))
