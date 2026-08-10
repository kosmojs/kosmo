
## [0.2.10](https://github.com/kosmojs/kosmo/compare/v0.2.9...v0.2.10) (2026-08-10)

### Bug Fixes

* correctly detect numeric params ([8425a04](https://github.com/kosmojs/kosmo/commit/8425a04ebca76ad239d89f81e04778bbdf624f0e))
* detect and coerce numeric properties in query validation target ([7443989](https://github.com/kosmojs/kosmo/commit/7443989fc134948f2b24e6bb8edf80e9522fed55))
* dev server routing ([5ed8e55](https://github.com/kosmojs/kosmo/commit/5ed8e55ed056b7789d7e061c96890197de32f889))

## [0.2.9](https://github.com/kosmojs/kosmo/compare/v0.2.8...v0.2.9) (2026-08-06)

## [0.2.8](https://github.com/kosmojs/kosmo/compare/v0.2.7...v0.2.8) (2026-08-06)

### Features

* add ssrBuild hook to run on ssr builds only ([12928a6](https://github.com/kosmojs/kosmo/commit/12928a61940eb60ccbc00587c3398ff1650bc3b9))
* tanstack query integration ([a56056b](https://github.com/kosmojs/kosmo/commit/a56056b7ae0e97b98d3e30d4bb6630061eab1db8))

### Bug Fixes

* **ssr-generator:** correctly detect css assets ([90b10c6](https://github.com/kosmojs/kosmo/commit/90b10c6a7e529ebebdb24afac861e167c06624ac))
* **types:** core/fetch - allow undefined transport ([a8bdc30](https://github.com/kosmojs/kosmo/commit/a8bdc302cb132070e653bf864bfdb910e7afcd10))

## [0.2.7](https://github.com/kosmojs/kosmo/compare/v0.2.6...v0.2.7) (2026-07-31)

## [0.2.6](https://github.com/kosmojs/kosmo/compare/v0.2.5...v0.2.6) (2026-07-31)

## [0.2.5](https://github.com/kosmojs/kosmo/compare/v0.2.4...v0.2.5) (2026-07-30)

## [0.2.4](https://github.com/kosmojs/kosmo/compare/v0.2.3...v0.2.4) (2026-07-30)

## [0.2.3](https://github.com/kosmojs/kosmo/compare/v0.2.2...v0.2.3) (2026-07-30)

## [0.2.2](https://github.com/kosmojs/kosmo/compare/7b18937b2ee425f8d41fc4b733ef7872b8446830...v0.2.2) (2026-07-30)

### Features

* a vite plugin to add node: prefix to un-prefixed node imports ([880f61d](https://github.com/kosmojs/kosmo/commit/880f61d4e594efec8078895d66ca76f1aaacf788))
* add plugins and emitAssets options to api generators ([144c5af](https://github.com/kosmojs/kosmo/commit/144c5afdf7bf7b2ede7269e0458e94668979eae2))
* add vue support ([cfb275a](https://github.com/kosmojs/kosmo/commit/cfb275a8969614edfc7133da1706515f9085a14f))
* allow generators to declare dependencies ([a6a7b56](https://github.com/kosmojs/kosmo/commit/a6a7b56e2b1266ba46c5b433c137e5bab9208883))
* **api:** add customizable error handler ([f222ca5](https://github.com/kosmojs/kosmo/commit/f222ca562abf5061de1d9fee1241cd190ce5e360))
* automatically inject middleware defined in use.ts files ([7a3a15f](https://github.com/kosmojs/kosmo/commit/7a3a15f86af2e3f7881289b0e432efa700e8ae0a))
* **create:** add SSR toggle ([7b18937](https://github.com/kosmojs/kosmo/commit/7b18937b2ee425f8d41fc4b733ef7872b8446830))
* **create:** create projects/folders in non-interactive mode ([d431f7f](https://github.com/kosmojs/kosmo/commit/d431f7f5dc37ae64fcb374abf2c154c5a973927d))
* customizable backend framework ([459c3c5](https://github.com/kosmojs/kosmo/commit/459c3c59204c4cd77f3939f68c02a4b73bb28cc7))
* define esbuild PRODUCTION_BUILD var ([02095b9](https://github.com/kosmojs/kosmo/commit/02095b9fccb616a12d17047c6f2931b26d4da625))
* **dev:** add cli cmd to run dev/build tasks easily ([9cb435e](https://github.com/kosmojs/kosmo/commit/9cb435e312ce1f1c40086bd25e03ad999f6eb686))
* **esbuilder:** add --external-exclude option and plugin ([99ae8ef](https://github.com/kosmojs/kosmo/commit/99ae8efda31a760a41174d56a108732c66aae811))
* **hono-generator:** allow throw a tuple: [status: number, message?: string] ([306e890](https://github.com/kosmojs/kosmo/commit/306e89014580bcf2d17a0a0cb54402d20292e5fa))
* isomorphic fetch clients ([512a7de](https://github.com/kosmojs/kosmo/commit/512a7de9279f05f984c4d30a02ee9ca19e4d0d10))
* **koa-generator:** allow throw a tuple: [status: number, message?: string] ([ac0a326](https://github.com/kosmojs/kosmo/commit/ac0a3260b6e6c2bcd00389e27dab36f969516586))
* **mdx:** add mdx generator ([b032f71](https://github.com/kosmojs/kosmo/commit/b032f71ba76d881ed9f32246cfcb2f23db108868))
* **mdx:** export loader function to load data into {props.data} ([2c42732](https://github.com/kosmojs/kosmo/commit/2c42732948314a23281f0bd78a1499887d1c020f))
* **nested routes:** add react implementation ([1302d6f](https://github.com/kosmojs/kosmo/commit/1302d6f0d6dacb35d8241c94f5c5d90a382998c5))
* **nested routes:** add solid implementation ([93a30dd](https://github.com/kosmojs/kosmo/commit/93a30dd859442f2066fe9594f92bd6db68590c9a))
* **nested routes:** add vue implementation ([fa9dc4a](https://github.com/kosmojs/kosmo/commit/fa9dc4af8c73a64596941b495b26f6b6bcb7720b))
* **nested routes:** implement recursive traverser ([0cef859](https://github.com/kosmojs/kosmo/commit/0cef859f94c548fd5908ca13a4f9aa9432c340b7))
* **ssg:** add ssg generator ([8bcd6e4](https://github.com/kosmojs/kosmo/commit/8bcd6e4ea5619a12f7043b3a1b18079c7a99421a))
* **ssr:** extract and inline route-specific critical CSS at render time ([7624cb6](https://github.com/kosmojs/kosmo/commit/7624cb6721bf8994bb7056f7d48baca97278992f))
* svelte support ([cdb018d](https://github.com/kosmojs/kosmo/commit/cdb018d439d174b428b5b2279e29a8db077f72a7))

### Bug Fixes

* add @kosmojs/fetch as devDependency ([b6fd8f0](https://github.com/kosmojs/kosmo/commit/b6fd8f08e984e032b2d89d9e6d8bfafa823daf99))
* **api-generator:** correctly map params based on path-to-regexp patterns ([30c220c](https://github.com/kosmojs/kosmo/commit/30c220c545f63f95b4ec9cd031e02124b7a8849d))
* **chassis:** sort requestHandlers ([225d434](https://github.com/kosmojs/kosmo/commit/225d4346d72bc26d40ba04dc73a0dde4893113f9))
* **cli:** add esbuild jsx-related options to vite.config.ts for SolidJS folders ([bcf2fca](https://github.com/kosmojs/kosmo/commit/bcf2fca85d9eff20ba4898a8a8cc37f627aa45dc))
* **cli:** correctly detect optedFolders ([30b39a6](https://github.com/kosmojs/kosmo/commit/30b39a6fd5c00e88a45d73d2bf4727838e88eda5))
* **core:** add fetch as dependency ([31adb29](https://github.com/kosmojs/kosmo/commit/31adb2972b615bbdb5a32ba6ea9a51e56fe527b6))
* **create:** correct cmd to create a source folder ([ba3693a](https://github.com/kosmojs/kosmo/commit/ba3693a7cde8f56b4cef79ce032b55083ca8aa65))
* **create:** correct framework in interactive mode ([1432bd1](https://github.com/kosmojs/kosmo/commit/1432bd1ef4c1192d3dec00692f4c67d3c1a0ff9c))
* **dev:** add base to client server ([65ec512](https://github.com/kosmojs/kosmo/commit/65ec5128ab7a410650f236927ce535b8a046a655))
* **dev:** add event handlers to client server listeners ([71bd45a](https://github.com/kosmojs/kosmo/commit/71bd45a2aa94bcdb121c64bec56401c679c64a6a))
* **dev:** increment port by source folder ([16255a8](https://github.com/kosmojs/kosmo/commit/16255a8d74b5549aca23464e591f773239349903))
* **dev:** load stubGenerator as an external package ([4eca6f9](https://github.com/kosmojs/kosmo/commit/4eca6f9b1ad5cd586e0e83584aff9b577a396c67))
* **dev:** run workers for frontend-only source folders ([e4afdcd](https://github.com/kosmojs/kosmo/commit/e4afdcd20c931f5b826da37c08170f639035fcc4))
* do not wrap refined params ([ef2fef6](https://github.com/kosmojs/kosmo/commit/ef2fef6bcc33a886a406672ac824b79015a1d657))
* escape semicolon in route path ([0f09afc](https://github.com/kosmojs/kosmo/commit/0f09afc3c2ac0831f48f713edfbbf9a961db308c))
* **fetch-generator:** ditch namespaced imports ([b96a73c](https://github.com/kosmojs/kosmo/commit/b96a73c9c7cafd55a730a4dbaf2f2fb912191801))
* **fetch-generator:** export validationSchemas ([180ec86](https://github.com/kosmojs/kosmo/commit/180ec8693d483eb2f3b3049ecb12cfaec3190e9d))
* github workflow ([24b1c58](https://github.com/kosmojs/kosmo/commit/24b1c587a1ccd82b2dd95cb346ed341aba471668))
* github workflows ([b4fdb0a](https://github.com/kosmojs/kosmo/commit/b4fdb0a77ccceebe278b5406080494bd4f980e66))
* **hono-generator:** error handler typing ([3281e20](https://github.com/kosmojs/kosmo/commit/3281e2004ca15a0d4c2061a263535ac01849aeb5))
* import self with type json ([85387e6](https://github.com/kosmojs/kosmo/commit/85387e63a0b55a3c8399aeac09d488a9f5a039ff))
* **koa-generator:** ensure context extended only once ([fddfebd](https://github.com/kosmojs/kosmo/commit/fddfebd93c3acc7f13a36588801fbef30b026725))
* **koa-generator:** funcName for use wrappers ([f3abb0b](https://github.com/kosmojs/kosmo/commit/f3abb0b77af6a5ec05298ff049a6645e5e4a2d28))
* layouts data fetch ([208ecca](https://github.com/kosmojs/kosmo/commit/208eccac7d2f958bb7522869a691791c63a0820c))
* **lib/tests:** add default types ([4f8a95a](https://github.com/kosmojs/kosmo/commit/4f8a95a6ad90e3d83abd58fb45370a683db6fdbc))
* **openapi:** drop routes that are subsumed by more specific ones ([163e3ca](https://github.com/kosmojs/kosmo/commit/163e3ca04a37dc9878329cc678d74212783bb3f8))
* **openapi:** use generic schema if no response body defined ([d11dbfd](https://github.com/kosmojs/kosmo/commit/d11dbfd1e1c1fd15acb66405f531d9de88605c61))
* **pathTokensFactory:** escape + ([3f909e2](https://github.com/kosmojs/kosmo/commit/3f909e21d4bad1eabc4fdba50b450a5746ec1a8f))
* react hydration issue ([0723d39](https://github.com/kosmojs/kosmo/commit/0723d39432a754ed476be3dec5d0f958cdb43635))
* **react-generator:** add jsxImportSource to pageSamples ([0fe7782](https://github.com/kosmojs/kosmo/commit/0fe7782994d70172a591104c69481c922fa00d0c))
* **react-generator:** Link component ([7a6c439](https://github.com/kosmojs/kosmo/commit/7a6c439890bc7aab19915fa5597506decf180eef))
* **react-generator:** ssrMode flag ([b5bcbe8](https://github.com/kosmojs/kosmo/commit/b5bcbe8375710a491df9375db455822ea4d018ac))
* read the installed package.json at runtime to get the actual version ([073ff89](https://github.com/kosmojs/kosmo/commit/073ff89e528cb415564f45ad8c5801f56458c577))
* **solid-generator:** add jsxImportSource to pageSamples ([24e967f](https://github.com/kosmojs/kosmo/commit/24e967f9bcd4c74a1412912239775478d96d987d))
* **solid-generator:** Link component ([23532cc](https://github.com/kosmojs/kosmo/commit/23532ccf0a724cc06618bd1ccbcce0a8d818942f))
* **solid-generator:** ssrMode flag ([92c9d5e](https://github.com/kosmojs/kosmo/commit/92c9d5e5e1b793826fe9b88860d318fb6aaeda10))
* **ssr-generator:** match route exactly for inlining critical css ([650b213](https://github.com/kosmojs/kosmo/commit/650b213c5534a959f63e32aebe4d63a532ccce89))
* **ssr-generator:** ssr assets filter ([a441e6c](https://github.com/kosmojs/kosmo/commit/a441e6cf3d3ecd1803671fa75f7cde53ecd373bc))
* **tests:** ignore npm_config_minimum_release_age ([aa49149](https://github.com/kosmojs/kosmo/commit/aa49149db251e329628db65382c20be2f78eecce))
* **vue-generator:** ssrMode flag ([3292a72](https://github.com/kosmojs/kosmo/commit/3292a720826d17dbff5a31c5cc051888886c1289))
* workspace deps ([fa67a94](https://github.com/kosmojs/kosmo/commit/fa67a94435d41d23c90a1604986f632ba0ada7c7))

### Reverts

* do not bundle, everything external ([330ffda](https://github.com/kosmojs/kosmo/commit/330ffda1ba2e12f5e0937be14f7e3eb64fa33620))
