Each `assets` entry offers `kind`, `tag` (ready-to-inject), `content` (for inlining), `size` and an optional `path`.
Passing `tag` straight through is the right default. Or inline CSS instead with something like:

```ts
assets.map(({ kind, tag, content }) => {
  return kind === "css" ? `<style>${content}</style>` : tag;
})
```
