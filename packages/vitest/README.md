# @kosmojs/vitest

Vitest integration for KosmoJS projects

## Installation

```sh
npm install -D @kosmojs/vitest
```

## Config

Each source folder may enable/disable testing in its `kosmo.config.ts`:

```ts
defineConfig({
  frontend: {
    // enable frontend testing
    test: true,
  },
  backend: {
    // enable backend testing
    test: true,
  },
})
```

Then run vitest at the project root:

```sh
pnpm vitest
```

## License

MIT
