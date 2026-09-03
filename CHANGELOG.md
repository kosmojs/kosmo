## [0.4.4](https://github.com/kosmojs/kosmo/compare/v0.4.3...v0.4.4) (2026-09-03)

### Features

* add preview command and a single-entry dist/run.js ([199ff9e](https://github.com/kosmojs/kosmo/commit/199ff9e6ad6cd755c705c0c10e3641d79f7ddc97))
* add SSG support to all frameworks ([15ebe82](https://github.com/kosmojs/kosmo/commit/15ebe82aacfd9568443ca07ef5f4127cc9f281a6))

### Bug Fixes

* **cli:** add exec bit to bin script ([91fae79](https://github.com/kosmojs/kosmo/commit/91fae79374e74330760dc5f7110907602a48d858))
* **dev:** skip handlebars rendering for cache files ([7a9db4e](https://github.com/kosmojs/kosmo/commit/7a9db4e78cf28137ab4ec04e822abb3761ffa015))
* **routing:** resolve svelte/mdx routes by specificity, not segment count ([2cdc4bc](https://github.com/kosmojs/kosmo/commit/2cdc4bc298c3651bdc669e5ab07c84ab589af144))
* **solid:** keep adjacent optional params optional ([ba22948](https://github.com/kosmojs/kosmo/commit/ba229483c4160d7243a58ef8273e11c1f01c2165))
* **ssr:** copy public/ dir into dist ([2d1e51b](https://github.com/kosmojs/kosmo/commit/2d1e51b9164ea895b64f4dec24a324073aced965))
* **types:** core-generator was using too restrictive types for normalizeParams and alike ([ad1fa7b](https://github.com/kosmojs/kosmo/commit/ad1fa7bce27a091fd40a2160223d15e6585c1f56))
* **types:** fetch-generator: adapted payloadTypes to new signature ([45b824c](https://github.com/kosmojs/kosmo/commit/45b824c28ca88a5ee62ace21a70b1b9d1275c501))

## [0.4.3](https://github.com/kosmojs/kosmo/compare/v0.4.2...v0.4.3) (2026-08-29)

### Bug Fixes

* **backend:** return 405 if HTTP method is not implemented ([fa4358d](https://github.com/kosmojs/kosmo/commit/fa4358d50a8db7c3c25ab946671cf3a22a65ed03))
* **backend:** serve HEAD via sibling GET handler with GET validation schemas ([7cdfcb1](https://github.com/kosmojs/kosmo/commit/7cdfcb10a873fc63710acbca375e07f65f938a5e))
* **backend:** validate only 2xx responses ([f61572d](https://github.com/kosmojs/kosmo/commit/f61572d4b3d1c23157c1c2e7826e46313cd2a391))
* **core-generator:** import ValidationSchemas from correct path ([40edc73](https://github.com/kosmojs/kosmo/commit/40edc733dfb54539a2dcc60e524e76e91e7e2679))
* **fetch-generator:** deploy only supported request methods ([e1d9106](https://github.com/kosmojs/kosmo/commit/e1d9106e84ef46bb21da1b08d15629d28ae7c73a))
* **fetch-generator:** ignore non-2xx response types ([28ac480](https://github.com/kosmojs/kosmo/commit/28ac48036ce80d38c673897706494d1b04568b91))
* **h3-generator:** serve HEAD through the sibling GET handler ([9b58091](https://github.com/kosmojs/kosmo/commit/9b5809184bc13222bc4fc5de543be13187297aee))
* **hono-generator:** catch body parsing error on response validation ([2dbfe3f](https://github.com/kosmojs/kosmo/commit/2dbfe3f2887f17f5b70ca53dddb95441bc899459))
* **types:** safely compare base against a string ([1d01d47](https://github.com/kosmojs/kosmo/commit/1d01d47ff8258eb9f0d3b18054784887df5ec551))

## [0.4.2](https://github.com/kosmojs/kosmo/compare/v0.4.1...v0.4.2) (2026-08-24)

### Features

* allow boolean in query validation target ([9cdd94a](https://github.com/kosmojs/kosmo/commit/9cdd94a991ca0c54e66dfa35b3536f2378999852))
* **cli:** add typecheck command ([f0bfcf6](https://github.com/kosmojs/kosmo/commit/f0bfcf646cad16d869f296271d5ad3d803c17dee))

### Bug Fixes

* **backend:** cascadingMiddleware was missing Override type ([198def8](https://github.com/kosmojs/kosmo/commit/198def806a6f1b259693634f4683c3ae74f60c9e))
* **isNumericTypeNode:** consider numeric literals, signed or not, and unions of numeric literals ([409484b](https://github.com/kosmojs/kosmo/commit/409484bac6a9eecac47cc749e8605019470a4757))
* **mdx-generator:** add jsx:preserve ([86236dc](https://github.com/kosmojs/kosmo/commit/86236dc4d02dada6a26c6aeb9134eec87486fd55))
* **mdx-generator:** mdx folders need jsx:react-jsx in compilerOptions ([45db712](https://github.com/kosmojs/kosmo/commit/45db712b8e5b1dab3b836652340c48bc9c3cd669))
* **types:** solid renderToStream ([d060c43](https://github.com/kosmojs/kosmo/commit/d060c43e41b528e9f94ccd98e8b9f351b60047d2))

## [0.4.1](https://github.com/kosmojs/kosmo/compare/v0.4.0...v0.4.1) (2026-08-22)

### Bug Fixes

* **core-generator:** apiRouteMap should use base as prefix ([41488e8](https://github.com/kosmojs/kosmo/commit/41488e83ec694ba84885e7b48ef13435d547fb2c))
* **dev:** prevent dev server from crash when a transiently-invalid module parsed ([70cc381](https://github.com/kosmojs/kosmo/commit/70cc381914d88e791735f922c0dab6005da40555))
* **generators:** handle created files beside updated ones ([37fc582](https://github.com/kosmojs/kosmo/commit/37fc582549468f33d42b8d581550bf637330df37))
* **h3:** correctly resolve/validate response body and status ([c61d41a](https://github.com/kosmojs/kosmo/commit/c61d41a10fef8c25796ed0306106c67fb0f2bb53))
* **mdx-generator:** prioritize static routes over dynamic routes ([30097af](https://github.com/kosmojs/kosmo/commit/30097aff986a0fa1a1f5d03714e744ac5f194abc))
* **svelte-generator:** prioritize static routes over dynamic routes ([26d046c](https://github.com/kosmojs/kosmo/commit/26d046ca579e057c2ec8f1ed2e98257156ca69b6))
* **vue-generator:** strip the base from pushed paths ([25c0caa](https://github.com/kosmojs/kosmo/commit/25c0caa540f80f3167d808a16dbcee1cdc9a1e19))

## [0.4.0](https://github.com/kosmojs/kosmo/compare/v0.3.0...v0.4.0) (2026-08-21)

### ⚠ BREAKING CHANGES

* **koa-generator:** register defaultErrorHandler via app.on("error") hook
* **koa-generator:** revamp app factory
* **hono-generator:** revamp app factory
* **koa-generator:** revamp server
* **hono-generator:** revamp server

### Features

* **backend:** add H3 as a supported backend framework ([d9c87b1](https://github.com/kosmojs/kosmo/commit/d9c87b1042a3472c6db0321ee13e03a3b36d3139))

### Bug Fixes

* **cli:** wire dependencies declared by coreGenerator ([231668a](https://github.com/kosmojs/kosmo/commit/231668a13f265dba9d5dedf521a1433cff4f5d30))
* **hono-generator:** render correct import path for env.d.ts ([4df49fd](https://github.com/kosmojs/kosmo/commit/4df49fd0e0a6747ca087307ed3fa84ac83df4c5e))
* **koa-generator:** render correct import path for env.d.ts ([9f61a27](https://github.com/kosmojs/kosmo/commit/9f61a27fe9168f2a78bb44e9216711a948d4a9fd))

### Code Refactoring

* **hono-generator:** revamp app factory ([526fea7](https://github.com/kosmojs/kosmo/commit/526fea7317ae592f4378838fe15359dcd9e310b6))
* **hono-generator:** revamp server ([1a7f795](https://github.com/kosmojs/kosmo/commit/1a7f795f85d6a1467d358c165e9315ce28b7a7df))
* **koa-generator:** register defaultErrorHandler via app.on("error") hook ([283e296](https://github.com/kosmojs/kosmo/commit/283e296447b1e269938acaf194bba718c7824ff1))
* **koa-generator:** revamp app factory ([e4ffd76](https://github.com/kosmojs/kosmo/commit/e4ffd7686c7b04819328ecd75ff84190c29f9f68))
* **koa-generator:** revamp server ([060b268](https://github.com/kosmojs/kosmo/commit/060b2688c6d279bb16fb1ba3e5be7562542cc975))

## [0.3.0](https://github.com/kosmojs/kosmo/compare/v0.2.10...v0.3.0) (2026-08-15)

### ⚠ BREAKING CHANGES

* **ssr:** an SSR fetch failure now yields a CSR fallback (200)
  instead of a 500.
* **fetch:** fetch calls that previously resolved to undefined on a
  failed request now throw. Callers relying on the silent-undefined
  behavior must add try/catch or an error boundary.

### Features

* **ssr:** recover from SSR render failures by falling back to CSR ([a836c8d](https://github.com/kosmojs/kosmo/commit/a836c8d95336c98440e74e20fc3a6fdbab8c43ac))

### Bug Fixes

* **fetch-generator:** filter payload types by target ([ca241f6](https://github.com/kosmojs/kosmo/commit/ca241f6a8aca29c34d2103970aaab0eb6f03f7af))
* **fetch:** always throw on failure ([183e185](https://github.com/kosmojs/kosmo/commit/183e185bbd42cf0c35899c0af5424a7feb62bd7e))
* **openapi:** keep collection routes with param-child siblings ([094ea95](https://github.com/kosmojs/kosmo/commit/094ea95880d186b69f7b19e4c272b1a1b3561371))
* **ssr:** preserve query string in the router during SSR ([64856ae](https://github.com/kosmojs/kosmo/commit/64856ae0dd943fd6850e0b7feaac5f29e10264ed))
* **vue:** ship the hydration script in head on streamed SSR routes ([844adca](https://github.com/kosmojs/kosmo/commit/844adca50125939891cffda68d5d1451a15a0e1c))

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
