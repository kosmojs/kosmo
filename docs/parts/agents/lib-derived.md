The folder's `tsconfig.json` is the only one of these that points into `lib/`.
**`lib/<folder>/` is derived** - everything you import through `_/` is generated
there and regenerated on every change, so never create or edit a file in it.
Code shared between folders lives at the project root, imported as `@/`;
`~/` is this folder only.
