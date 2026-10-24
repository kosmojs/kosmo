## [0.6.4](https://github.com/kosmojs/kosmo/compare/v0.6.3...v0.6.4) (2026-10-24)

### Improvements

* add a default page and a default route on folder creation ([714f170](https://github.com/kosmojs/kosmo/commit/714f170cb0fe4f7b1cc1d44eb5f2c71cd072368f))
* move lib/ into var/ ([cd47db3](https://github.com/kosmojs/kosmo/commit/cd47db3758a6cbe64a5f63a29ed73fc233b76ef8))

### Miscellaneous

* add changeset ([eff97cb](https://github.com/kosmojs/kosmo/commit/eff97cbc2267e7cb6f14aff8f0a989527055dabb))
* add more ConventionalChangelog types ([0f9674d](https://github.com/kosmojs/kosmo/commit/0f9674d5feebbca6f60bc25e102aa26985e78d2a))

## [0.6.3](https://github.com/kosmojs/kosmo/compare/v0.6.2...v0.6.3) (2026-10-11)

### Code Refactoring

* **cli:** ask for fodler name interactively or provide --name flag ([982e79a](https://github.com/kosmojs/kosmo/commit/982e79a9ee5a727cb4fc23e6d904269913c6df85))
* **create:** ask for project name interactively or provide --name flag ([c02e82e](https://github.com/kosmojs/kosmo/commit/c02e82e3be81e15a5552a1132202558e0436d9f2))

### Miscellaneous

* add changeset ([62666e4](https://github.com/kosmojs/kosmo/commit/62666e4bc91d2b149f4400fda99e0253f1c9285d))
* version bump ([201484b](https://github.com/kosmojs/kosmo/commit/201484b31647fea4bc420400b42f7ddcf33f1050))

## [0.6.2](https://github.com/kosmojs/kosmo/compare/v0.6.1...v0.6.2) (2026-10-10)

### Miscellaneous

* add changeset ([59de844](https://github.com/kosmojs/kosmo/commit/59de844227b2f114acaf756d650f05682848cb04))
* version bump ([c19f34b](https://github.com/kosmojs/kosmo/commit/c19f34b9302426a3acda4e188c2e8afd7a1a502e))

## [0.6.1](https://github.com/kosmojs/kosmo/compare/v0.6.0...v0.6.1) (2026-10-10)

### Miscellaneous

* add changeset ([2d4a40e](https://github.com/kosmojs/kosmo/commit/2d4a40e379cfa750ed795c378d9ab9e3fdc2feb6))
* deps bump ([f8cad38](https://github.com/kosmojs/kosmo/commit/f8cad380c515584486ef79ca1537a0af1b8c4d43))
* version bump ([417e49a](https://github.com/kosmojs/kosmo/commit/417e49a04d2e842cf87f03fb0f81208f34da7492))

## [0.6.0](https://github.com/kosmojs/kosmo/compare/v0.5.2...v0.6.0) (2026-10-10)

### Features

* implement Vitest integration to facilitate testing workflow ([2b60098](https://github.com/kosmojs/kosmo/commit/2b600981fd31fab62a055da0c8ac0054370b9f4e))

### Bug Fixes

* accept host option wherever it is relevant ([9dfd619](https://github.com/kosmojs/kosmo/commit/9dfd6194d3b9ed61cb93a9c514521a08ebe446fa))
* **run.js:** correctly detect when it is invoked directly ([b6d42f9](https://github.com/kosmojs/kosmo/commit/b6d42f98a32c5754cab43e3ee8848eec8e7780e1))

### Code Refactoring

* **config:** replace devPort/previewPort with kosmo.devHost/PreviewHost in package.json ([f1148a3](https://github.com/kosmojs/kosmo/commit/f1148a3623a972fd5146c93df67a915f2ce6ba7c))
* **core:** resolve virtualModules based on command ([98c376a](https://github.com/kosmojs/kosmo/commit/98c376a24dc612b01ff385b9d40fbd014bea4af9))
* **defineGeneratorFactory:** require both projectSettings and sourceFolder ([a7f62e4](https://github.com/kosmojs/kosmo/commit/a7f62e40dd751ef781c055bfd474bda027655c47))
* **dev:** a more robust way to find free ports range ([9c1dd7c](https://github.com/kosmojs/kosmo/commit/9c1dd7ccb79d47536f772444abe60346486342de))
* enable testing by default ([a4eb696](https://github.com/kosmojs/kosmo/commit/a4eb6962e324893bc5678a0b18c1d86826c7f16d))
* **fetch:** move virtual module to core generator; move createDispatch to core package ([25739ac](https://github.com/kosmojs/kosmo/commit/25739ac6e845b2fbd322fe311c5f0b814f4c05a2))
* **h3:** fix path patterns to work with rou3 v1 ([180a7b9](https://github.com/kosmojs/kosmo/commit/180a7b90021ed59e072d67100116182195deae81))
* **RoutePathMethods:** do not require params arg for routes without params ([a215064](https://github.com/kosmojs/kosmo/commit/a215064c13fac3067c0d50f9f4946543bb3b0e56))
* **vitest:** loadConfig require root; provide findFreePortRange and resolveHostAddress ([cee023a](https://github.com/kosmojs/kosmo/commit/cee023ae40308056432802384e096aaa6f0f048d))

### Improvements

* **core-generator:** add source folder name to core config ([b580164](https://github.com/kosmojs/kosmo/commit/b58016497d130172d2bc3f06c2e8a550e5df81ba))

### Miscellaneous

* add changeset ([c38a291](https://github.com/kosmojs/kosmo/commit/c38a2912f9574524c52297b80c0ab74ac09e3f8a))
* **core/fetch:** move Transport type into ./types ([8806159](https://github.com/kosmojs/kosmo/commit/8806159f07b5a4646a9fa6c3ee781ef76cbe26c3))
* deps bump ([84b79c2](https://github.com/kosmojs/kosmo/commit/84b79c26340c077e0e322ec713309a2b432274d3))
* docs cleanup ([ae02341](https://github.com/kosmojs/kosmo/commit/ae02341e9a7a4adf0ebc7d98ca1394c54f0809c1))
* format ([0e9d612](https://github.com/kosmojs/kosmo/commit/0e9d612db08c0e79b9d410b6b0245ee7c81f47b7))
* move cacheDir to lib ([74e0fd9](https://github.com/kosmojs/kosmo/commit/74e0fd9029335a223ed956ceadd9ae42f16fc076))
* move configFilePattern to lib ([4276d02](https://github.com/kosmojs/kosmo/commit/4276d021ab66cd6185a35036df4eb8b63a042bf9))
* move findFreePortRange to lib ([5df9ee2](https://github.com/kosmojs/kosmo/commit/5df9ee25c91c07fa4e6f4b920b71073c273409ae))
* move VERSION to lib ([52523bc](https://github.com/kosmojs/kosmo/commit/52523bc8104c4a9d99f6c53a5383b60e27987f83))
* refactor integration tests ([b6b56b6](https://github.com/kosmojs/kosmo/commit/b6b56b6b53f0a8b8c99267160285adf8a3ce3c7e))
* version bump ([87db4f3](https://github.com/kosmojs/kosmo/commit/87db4f35cbb88f5ae0c289ea6210db87dfee1d19))

## [0.5.2](https://github.com/kosmojs/kosmo/compare/v0.5.0...v0.5.2) (2026-09-21)

### Features

* **backend:** add edge middleware slot to run before validation ([868bae2](https://github.com/kosmojs/kosmo/commit/868bae2412e4dac3df19d153623f4054aec26908))
* **sidecar:** a source folder that builds a standalone process ([7ae57d2](https://github.com/kosmojs/kosmo/commit/7ae57d22591c4b73f67637163ac2c62117279670))

### Code Refactoring

* **backend:** place UseSlots interface into _/api module ([8535c7b](https://github.com/kosmojs/kosmo/commit/8535c7b7bb9fc4bf5b32c32e41e521c47e8b51e7))
* **cli/typecheck:** check project root; do not exit on first error ([878ffac](https://github.com/kosmojs/kosmo/commit/878ffac6d00664856d8cc295088f9252c5907bca))
* **cli:** rename createSourceFolder to createHTTPFolder ([b86eb12](https://github.com/kosmojs/kosmo/commit/b86eb127a4e032068554fc04693c108e47ae43f4))
* **config:** make fetch a top level option ([70b45f3](https://github.com/kosmojs/kosmo/commit/70b45f3012b17e340491210c553a0e9484cf3522))
* **core/fetch:** allow prefix as option ([f034597](https://github.com/kosmojs/kosmo/commit/f0345972f5d1b102d3f8652e0f1359f8535fdf71))
* defineConfig return config and generators ([e7fc7a6](https://github.com/kosmojs/kosmo/commit/e7fc7a6ca905b7cd47337c47d7ba78270dac11a1))
* move checkDependencies to cli ([1f42134](https://github.com/kosmojs/kosmo/commit/1f42134d06afc6162c4351bdf8cc7d34adedb1fd))
* move createProject to create ([3c4385e](https://github.com/kosmojs/kosmo/commit/3c4385eb72884717be0083d1776b48c0ff1eef0a))
* move formatCode to lib ([d20665f](https://github.com/kosmojs/kosmo/commit/d20665fe1e8a5e19e8ee5e0176aef79c7504dd40))
* move generateTsconfig to lib ([f9cf6e3](https://github.com/kosmojs/kosmo/commit/f9cf6e3777e67c9932ba66938a79ac177d2a00cb))
* rename generators start method to seed ([cb73013](https://github.com/kosmojs/kosmo/commit/cb730138aea7ffe966560c0a874845965141a0b4))
* ship root tsconfig with a minimal `include` option ([8b0746b](https://github.com/kosmojs/kosmo/commit/8b0746bc83284a058e17be29f09cacd92e052b11))
* update SourceFolderManifest - move ssr option into frontend ([d08eab1](https://github.com/kosmojs/kosmo/commit/d08eab12f755107b3c60425b2eff82ef59b0cb81))

### Improvements

* add typecheck option to allow skip folder check ([16def21](https://github.com/kosmojs/kosmo/commit/16def215106fa467ab9fa1c1184b04876cb70585))
* **create:** set frontend.base=/ and backend.base=/api on newly created projects ([37d3ffa](https://github.com/kosmojs/kosmo/commit/37d3ffa44145288808704be8f3e36409e3567a3c))
* **dist/run.js:** serve only folders with a manifest file ([1c3fcf6](https://github.com/kosmojs/kosmo/commit/1c3fcf657878c01c6186e5fa100cf829fb338736))

### Miscellaneous

* add changeset ([e66beea](https://github.com/kosmojs/kosmo/commit/e66beea9106b9188801379dca3e8e52b1bc10849))
* add README and description for every package ([193913c](https://github.com/kosmojs/kosmo/commit/193913c1aa03b317b1d46c239d3600200dd66f82))
* add zeroed version to private packages ([96bd81f](https://github.com/kosmojs/kosmo/commit/96bd81ffe3bdc0549c85e50fdaa7449c5e117ac3))
* drop cacheVersion from typebox generator ([c4b824f](https://github.com/kosmojs/kosmo/commit/c4b824f5c73bbd0f1bcc33a95ce68a81cc45b6ab))
* drop version for private packages ([1d44820](https://github.com/kosmojs/kosmo/commit/1d448208cea04e206b8ef9ec6c0358a6433c54a5))
* use node v24 on github/workflows/docs ([7a9caf9](https://github.com/kosmojs/kosmo/commit/7a9caf9f0fdb62975cec7a3533885c6afc667b1f))
* version bump ([6d5648f](https://github.com/kosmojs/kosmo/commit/6d5648febdec7c1f5aba04c00134b11eebf8ea0b))
* version bump ([3681141](https://github.com/kosmojs/kosmo/commit/368114102e6714bfe3d21867ad7b4d87fecb3603))
* workspace build script ([819e426](https://github.com/kosmojs/kosmo/commit/819e426651480019a82c879ac37a02657bba4a52))

## [0.5.0](https://github.com/kosmojs/kosmo/compare/v0.4.4...v0.5.0) (2026-09-09)

### ⚠ BREAKING CHANGES

* declarative syntax for kosmo.config.ts

### Bug Fixes

* **backend:** normalize route path ([efa395d](https://github.com/kosmojs/kosmo/commit/efa395d36fb60b281c9b58dc28f3c7c981f46f16))
* **backend:** uniform alias matching across dev server, backend server and dist/run.js ([ab39d92](https://github.com/kosmojs/kosmo/commit/ab39d92bcef598d3dd1255e1eb2876d2dac3ee78))
* **mdx-generator:** dependencies needed on prod/CI for SSR/SSG ([a68badb](https://github.com/kosmojs/kosmo/commit/a68badb482f4866d12eaf9ea2f23fe93cb3bd028))
* pottential path matching issues due to loose prefix checking ([d74e5d4](https://github.com/kosmojs/kosmo/commit/d74e5d489b68974d2b0fe724fa54086573282496))
* **vue-generator:** use isomorphic join() method in router ([f05a5b5](https://github.com/kosmojs/kosmo/commit/f05a5b5c5459838089a178573531aaf7b127e6c5))

### Code Refactoring

* declarative syntax for kosmo.config.ts ([796cf76](https://github.com/kosmojs/kosmo/commit/796cf763ea229958d7a6cd4a72f5c0877d7ad743))

### Improvements

* **cli:** ask for SSR/SSG/TSQ only if a framework selected ([c928f33](https://github.com/kosmojs/kosmo/commit/c928f3339f23f5045a30b593f642ae768b9c429e))
* **core-generator:** sort routes to get deterministic derived files ([c65ec23](https://github.com/kosmojs/kosmo/commit/c65ec23d4a6b87db7016b039008b09294552345f))

### Miscellaneous

* add changeset ([e910b76](https://github.com/kosmojs/kosmo/commit/e910b76ee6074d261d7c4f5660c7e72add4e140f))
* **cli:** update flags according to updated @clack/prompts ([150fd7c](https://github.com/kosmojs/kosmo/commit/150fd7c73228ecbe2c66ac2698105b7423ee31bf))
* deps bump ([aae80e4](https://github.com/kosmojs/kosmo/commit/aae80e4f4129930b13b4d85b96dbc0bd1a3c8f70))
* fix integration tests ([2f7d3ed](https://github.com/kosmojs/kosmo/commit/2f7d3eddec2b8b82b0d088166e2be3374d351cad))
* fix unit tests ([ba35d74](https://github.com/kosmojs/kosmo/commit/ba35d74e971e58eaafc9112db5cf4419b010dc38))
* refine seeded greetings ([2494199](https://github.com/kosmojs/kosmo/commit/24941997f7749b4150930239dd71f96dc817ab91))
* refine tests ([aaa446c](https://github.com/kosmojs/kosmo/commit/aaa446c11300df15667d635d4c8dfac6624e3bc2))
* revamp tests ([ff272b8](https://github.com/kosmojs/kosmo/commit/ff272b839c9082c9298a40c02ca2a5b4ac2aedc7))
* **typebox-generator:** update tests according to updated typebox ([7b44b3b](https://github.com/kosmojs/kosmo/commit/7b44b3bcdca4fb5ce3d7b35167077f8eb5461733))
* update favicon ([909c990](https://github.com/kosmojs/kosmo/commit/909c9906e9c0789ccad02f5b3226715fc082c123))
* update format according to updated biome ([ecdf270](https://github.com/kosmojs/kosmo/commit/ecdf2701a30521dbb6c00a991780834622a7ea15))
* update logo ([9c33783](https://github.com/kosmojs/kosmo/commit/9c33783e8f8d3b554e1f0318cc3997207cc4033a))
* update logo size ([4412fb6](https://github.com/kosmojs/kosmo/commit/4412fb654d9c42581dc5b9b5b86fda308dc56724))
* version bump ([a70a7b1](https://github.com/kosmojs/kosmo/commit/a70a7b1022d7095963c654e87c4e981268f00e5f))

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

### Code Refactoring

* **cli:** insert coreGenerator dependencies same way as for other generators ([bd67929](https://github.com/kosmojs/kosmo/commit/bd67929493d7a49306c6a4f9178dfb7891c7bfb7))
* **dev:** refine defineConfig to return configured generators ([9dcbdac](https://github.com/kosmojs/kosmo/commit/9dcbdace3872e910e765047be66ef8292c35aa55))
* **dev:** use renderToFile when writing cache files to skip the write when nothing changed ([1513c1c](https://github.com/kosmojs/kosmo/commit/1513c1cba12940fd904086c75bb4c891e1a722f6))
* **lib:** optimize virtualModules plugin ([6c7ba4b](https://github.com/kosmojs/kosmo/commit/6c7ba4b9f01fde86f633895e510b04c5cbaa68fd))
* **lib:** revamp renderToFile to accept a render function ([f077a2b](https://github.com/kosmojs/kosmo/commit/f077a2b6f1ec1b5146a18fa9d15f6bf05948e9bd))
* replace KOSMO_PRODUCTION_BUILD defined var with a virtual module ([3fd4f68](https://github.com/kosmojs/kosmo/commit/3fd4f6859da7f7a47d9a777a5e0182ab3b683aac))
* **solid-generator:** revamp renderToString to handle throwing in sync components ([ab5f7e0](https://github.com/kosmojs/kosmo/commit/ab5f7e08111724bc52a5ad02d10a0901069750f6))
* **ssg:** fail the build if any page failed to render ([a2cf3e2](https://github.com/kosmojs/kosmo/commit/a2cf3e2bbb80b9a56fdb6fb0cf33c2e0b20a03d8))
* **ssr:** implement onError hook as a way to react on render error events ([a2ac020](https://github.com/kosmojs/kosmo/commit/a2ac02049537f81db36cb93d221cd7ec0c8f297b))
* use virtual namespace to swap the content of env-aware modules ([ebaad27](https://github.com/kosmojs/kosmo/commit/ebaad279e27eda45e3eecc77403068c7533c8691))

### Improvements

* **cli:** ask about SSG only if SSR enabled ([feed48b](https://github.com/kosmojs/kosmo/commit/feed48b798ce8e6514c14c368aac6dfa410d2468))
* **core-generator:** use relative path for backend-app virtual module ([5c4e950](https://github.com/kosmojs/kosmo/commit/5c4e950abfea134aa3b8d4f9ee86ac87346322a1))

### Miscellaneous

* add changeset ([1f0dc12](https://github.com/kosmojs/kosmo/commit/1f0dc1295488ea91ca37977f8232be2f52a1a8b8))
* fix cli usage details ([a0f266d](https://github.com/kosmojs/kosmo/commit/a0f266dfcbea75e6c3ed71944ca337446dcf4ba1))
* fix test workflow ([63399ed](https://github.com/kosmojs/kosmo/commit/63399ed63f9353786868192a8de2a78610408739))
* minor fixes ([839ac08](https://github.com/kosmojs/kosmo/commit/839ac0835b6410096f8c73961e5facba4b0055cb))
* revamp tests ([f48a683](https://github.com/kosmojs/kosmo/commit/f48a683e84d4b689d715fcb3afe045fd26291370))
* skip docs from automated -r build ([154745e](https://github.com/kosmojs/kosmo/commit/154745ee653061a7815031f03f9997bcd0391595))
* typo fix ([5cb4319](https://github.com/kosmojs/kosmo/commit/5cb43192c85fb87936f176c249ee1f9886ee931b))
* update test workflow ([ed471eb](https://github.com/kosmojs/kosmo/commit/ed471eb5117e52b86a6822c873838d08938216f9))
* version bump ([7bcff56](https://github.com/kosmojs/kosmo/commit/7bcff56852ce2863f5ccd5379a7b6e34c7e61a9c))

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

### Code Refactoring

* **cli:** do not deploy index.html; deploy a default favicon ([f0f7c86](https://github.com/kosmojs/kosmo/commit/f0f7c86baf63d8c95766d19949c36ccf9911a29c))
* **cli:** use default folder name/base at project creation ([b12d10d](https://github.com/kosmojs/kosmo/commit/b12d10dab4eaadc207d10371a636280fef65a9ff))
* **core-generator:** deploy default index.html file; generators may override as needed ([dc83d53](https://github.com/kosmojs/kosmo/commit/dc83d53ccd4656d3fefdd9028b34a96e94ff065f))
* **dev:** skip client build/serve if no frontend generator ([6916583](https://github.com/kosmojs/kosmo/commit/6916583b55e2e88f0eb44eb17ebaa61802852d58))
* **koa-generator:** use middleware for error handling ([6874449](https://github.com/kosmojs/kosmo/commit/6874449b40a97190ec214e57aa09e372f16190d5))
* **ssr:** drop <!--app-head--> placeholder ([7cd11a3](https://github.com/kosmojs/kosmo/commit/7cd11a390129596d0be6e6dd060e163d918bb2f8))
* **typebox-generator:** better handling for union errors ([1555bff](https://github.com/kosmojs/kosmo/commit/1555bff10fbf5bc9eaed57d6cf99776c80c3a938))

### Improvements

* **create:** allow create projects without a source folder ([b998962](https://github.com/kosmojs/kosmo/commit/b998962c756d3f3a6b7ca96c91914cc066291a96))

### Miscellaneous

* add changeset ([9af8d46](https://github.com/kosmojs/kosmo/commit/9af8d46d38d7cc30b65aeee30b56b1c46d0d1145))
* allow random framework on integration tests ([bb95b3d](https://github.com/kosmojs/kosmo/commit/bb95b3da030824b2ce918d89bcaa7a12691727a4))
* **cli:** add gitignore ([efd5646](https://github.com/kosmojs/kosmo/commit/efd5646fb0d32d64090133b48519e85f353fa707))
* **cli:** add node_modules to gitignore ([a1a2024](https://github.com/kosmojs/kosmo/commit/a1a20249eadb01fb2a6033613c5f19c1486eb2c2))
* **cli:** fix tests ([226bb35](https://github.com/kosmojs/kosmo/commit/226bb35f7b33f1b4d533afeb495f8c27f5d09781))
* **cli:** update test snapshots ([a8c9ebe](https://github.com/kosmojs/kosmo/commit/a8c9ebedf623edcbe4708c8aaa807bd68154b341))
* **cli:** update test snapshots ([57f3ed0](https://github.com/kosmojs/kosmo/commit/57f3ed0fbc326bb545bab7e0ed39d6e02eb8b996))
* **docs:** revert vitepress-plugin-group-icons ([48d028b](https://github.com/kosmojs/kosmo/commit/48d028bbff53389495989fbeec4279b4c61af138))
* README update ([7bd3ec8](https://github.com/kosmojs/kosmo/commit/7bd3ec80c1bf18278d372e420d2e3dc6a3c56f89))
* update docs ([5066da0](https://github.com/kosmojs/kosmo/commit/5066da0ea4f46162b70c80b65820df3de1214a77))
* version bump ([a31f344](https://github.com/kosmojs/kosmo/commit/a31f344163a93c4c3230d6b8621f990b3a3b25d6))

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

### Improvements

* **core-generator:** tsconfig types vary based on installed dependencies ([3f9c510](https://github.com/kosmojs/kosmo/commit/3f9c51039f3bcf86f90f1ff89608bbcfa5834464))

### Miscellaneous

* add changeset ([ba8faf8](https://github.com/kosmojs/kosmo/commit/ba8faf893721d7eb53813247b108e90d40f9e91a))
* deps bump ([afaeb53](https://github.com/kosmojs/kosmo/commit/afaeb532472f9726abf6015f35f0db1ceb5d89ed))
* update docs ([c391f7f](https://github.com/kosmojs/kosmo/commit/c391f7f120f8977d4ce7580567cede3df1532467))
* version bump ([b59383e](https://github.com/kosmojs/kosmo/commit/b59383ef9aaedb63c2cf0e15f56925432dc14a99))

## [0.4.1](https://github.com/kosmojs/kosmo/compare/v0.4.0...v0.4.1) (2026-08-22)

### Bug Fixes

* **core-generator:** apiRouteMap should use base as prefix ([41488e8](https://github.com/kosmojs/kosmo/commit/41488e83ec694ba84885e7b48ef13435d547fb2c))
* **dev:** prevent dev server from crash when a transiently-invalid module parsed ([70cc381](https://github.com/kosmojs/kosmo/commit/70cc381914d88e791735f922c0dab6005da40555))
* **generators:** handle created files beside updated ones ([37fc582](https://github.com/kosmojs/kosmo/commit/37fc582549468f33d42b8d581550bf637330df37))
* **h3:** correctly resolve/validate response body and status ([c61d41a](https://github.com/kosmojs/kosmo/commit/c61d41a10fef8c25796ed0306106c67fb0f2bb53))
* **mdx-generator:** prioritize static routes over dynamic routes ([30097af](https://github.com/kosmojs/kosmo/commit/30097aff986a0fa1a1f5d03714e744ac5f194abc))
* **svelte-generator:** prioritize static routes over dynamic routes ([26d046c](https://github.com/kosmojs/kosmo/commit/26d046ca579e057c2ec8f1ed2e98257156ca69b6))
* **vue-generator:** strip the base from pushed paths ([25c0caa](https://github.com/kosmojs/kosmo/commit/25c0caa540f80f3167d808a16dbcee1cdc9a1e19))

### Code Refactoring

* **generators:** update route mapper's path method to take the prefix option ([d6a4f9c](https://github.com/kosmojs/kosmo/commit/d6a4f9cd0a304d9713bc20ed33b458f06710b454))

### Miscellaneous

* add changeset ([f035ea9](https://github.com/kosmojs/kosmo/commit/f035ea93fd3e3926fdecc606e02241542a9a9e92))
* **site:** update favicon ([a590818](https://github.com/kosmojs/kosmo/commit/a59081889f1ebdb3b3a84d84dba6b2ccf70fac59))
* update docs ([e6b6c8e](https://github.com/kosmojs/kosmo/commit/e6b6c8ede88b9868f923ec728843e6ea111f7912))
* update logo ([8d1e60e](https://github.com/kosmojs/kosmo/commit/8d1e60e4e503743aa93aaab3b6bd3523467a5a3a))
* version bump ([faafd08](https://github.com/kosmojs/kosmo/commit/faafd08dfdf8913f2bed5644414da23a5979af37))

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

* **hono-generator:** add debug option to app factory for routes inspection ([5fbf8c8](https://github.com/kosmojs/kosmo/commit/5fbf8c86bf66a241999feaa8f76889f78b4f5aa8))
* **hono-generator:** revamp app factory ([526fea7](https://github.com/kosmojs/kosmo/commit/526fea7317ae592f4378838fe15359dcd9e310b6))
* **hono-generator:** revamp server ([1a7f795](https://github.com/kosmojs/kosmo/commit/1a7f795f85d6a1467d358c165e9315ce28b7a7df))
* **koa-generator:** add debug option to app factory for routes inspection ([6d41470](https://github.com/kosmojs/kosmo/commit/6d414709fbc652febcca51d2c5316d77109caf2e))
* **koa-generator:** register defaultErrorHandler via app.on("error") hook ([283e296](https://github.com/kosmojs/kosmo/commit/283e296447b1e269938acaf194bba718c7824ff1))
* **koa-generator:** revamp app factory ([e4ffd76](https://github.com/kosmojs/kosmo/commit/e4ffd7686c7b04819328ecd75ff84190c29f9f68))
* **koa-generator:** revamp server ([060b268](https://github.com/kosmojs/kosmo/commit/060b2688c6d279bb16fb1ba3e5be7562542cc975))
* unify apiRouteMapper, used by fetch and backend generators ([daa4b4b](https://github.com/kosmojs/kosmo/commit/daa4b4b143b0f74351c104741173a97c702e62d0))

### Miscellaneous

* add changeset ([e9ca0b1](https://github.com/kosmojs/kosmo/commit/e9ca0b16499867b478f6176d343685f517878ebb))
* deps bump ([8e8a2be](https://github.com/kosmojs/kosmo/commit/8e8a2bedd4d263ccb440261854d0b91b25f69a9b))
* fix release script ([9e854f8](https://github.com/kosmojs/kosmo/commit/9e854f8cb262993634f1b8d3e127afc7a47d948a))
* **hono-generator:** move unhandledRejection handler into userspace ([643f0dc](https://github.com/kosmojs/kosmo/commit/643f0dce44d7a7fd04d04475ba68fd43d8ebaeb3))
* **hono-generator:** re-format src/errors.ts ([6825754](https://github.com/kosmojs/kosmo/commit/68257549bebddb7a575d381a31c92f36a97d3988))
* **koa-generator:** move unhandledRejection handler into userspace ([ca4f32a](https://github.com/kosmojs/kosmo/commit/ca4f32a5e89beee13a95ed7b991580e3c1338deb))
* **koa-generator:** re-format src/errors.ts ([f5ba427](https://github.com/kosmojs/kosmo/commit/f5ba42794f4e8435aec784950ad5a530f0562ccb))
* **lib:** fix tests ([f3db6a6](https://github.com/kosmojs/kosmo/commit/f3db6a6d3fbab31814fa216e0bf1fd38fbb3f1b0))
* **tests:** import and use the project's server in tests ([e6c6ce3](https://github.com/kosmojs/kosmo/commit/e6c6ce3c203043f92762d5bb53a10a0e7c802ca9))
* **tests:** revamp cascading-middleware tests ([9164400](https://github.com/kosmojs/kosmo/commit/916440099d60beb73039f0da21bfaf08bac9bd65))
* update README ([2934d43](https://github.com/kosmojs/kosmo/commit/2934d43049649147e6467e002475c80356941aca))
* version bump ([851e841](https://github.com/kosmojs/kosmo/commit/851e841fcb903c328d28f40932fca5c83f102521))

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

### Miscellaneous

* add changeset ([2ad2908](https://github.com/kosmojs/kosmo/commit/2ad2908360b0bf7181124ff25142727c74d3ea2c))
* changelog ([5f543d9](https://github.com/kosmojs/kosmo/commit/5f543d9f03d09695f3a847f933b6e3838a4f93e7))
* fix typing ([7a248e4](https://github.com/kosmojs/kosmo/commit/7a248e40013d82d8aa2c5382064890c57df6f23e))
* revamp changelog generation ([8037c82](https://github.com/kosmojs/kosmo/commit/8037c8281eb5cd7b90db3c037f68d567c69c03f4))
* **test/integration:** rename nested-routes.test.ts → layouts.test.ts ([1f717de](https://github.com/kosmojs/kosmo/commit/1f717de63ee0ab6fdb214a08e49f43039b1d98c3))
* **tests:** move fetch tests into per-framework suites ([05c2d84](https://github.com/kosmojs/kosmo/commit/05c2d8445413a46ed7f27c3f06a77aca88c32932))
* update docs ([57b5361](https://github.com/kosmojs/kosmo/commit/57b5361ff9d3cbdeaa70e6528d3de14ceed32820))
* update landing page ([4a1bed3](https://github.com/kosmojs/kosmo/commit/4a1bed3749f349d307a7aa0fd68e070fc927a6c4))
* version bump ([50bbcf1](https://github.com/kosmojs/kosmo/commit/50bbcf1694650b063adbe15b76b0155c63fbaed7))

## [0.2.10](https://github.com/kosmojs/kosmo/compare/v0.2.9...v0.2.10) (2026-08-10)

### Bug Fixes

* correctly detect numeric params ([8425a04](https://github.com/kosmojs/kosmo/commit/8425a04ebca76ad239d89f81e04778bbdf624f0e))
* detect and coerce numeric properties in query validation target ([7443989](https://github.com/kosmojs/kosmo/commit/7443989fc134948f2b24e6bb8edf80e9522fed55))
* dev server routing ([5ed8e55](https://github.com/kosmojs/kosmo/commit/5ed8e55ed056b7789d7e061c96890197de32f889))

### Improvements

* **ast:** do not removeSourceFile ([bd0e9c5](https://github.com/kosmojs/kosmo/commit/bd0e9c516b169c646722b5f67c878d28e76115b1))

### Miscellaneous

* add changeset ([9a93978](https://github.com/kosmojs/kosmo/commit/9a93978b563c245c4dcf55fa9b04e9467189e86a))
* deps bump ([9e5ecec](https://github.com/kosmojs/kosmo/commit/9e5ecec8dc47f2facafe34a0516fb13f266d7b37))
* generate changelog ([fe4a8ab](https://github.com/kosmojs/kosmo/commit/fe4a8ab4597ccde109071e1c01900ccbdef36b40))
* update github/workflows ([ed6f8d8](https://github.com/kosmojs/kosmo/commit/ed6f8d84addc496099c8b19c74089373c63a5a3a))
* update readme and features ([a560b2e](https://github.com/kosmojs/kosmo/commit/a560b2e94a99c57cccda14bd64a1bef182d74c50))
* version bump ([c4b19a8](https://github.com/kosmojs/kosmo/commit/c4b19a88d5ed5bc7aba13c246f78aca747b991ab))

## [0.2.9](https://github.com/kosmojs/kosmo/compare/v0.2.8...v0.2.9) (2026-08-06)

### Miscellaneous

* add changeset ([afe4cf6](https://github.com/kosmojs/kosmo/commit/afe4cf61d92359920f3138b430dff4c6789a5d58))
* fix github/workflows ([8419783](https://github.com/kosmojs/kosmo/commit/84197836a683821d5d6c82a431f7f297f0161374))
* version bump ([5f83758](https://github.com/kosmojs/kosmo/commit/5f83758c3aed438be0b60396ca237d7be328c87c))

## [0.2.8](https://github.com/kosmojs/kosmo/compare/v0.2.7...v0.2.8) (2026-08-06)

### Features

* add ssrBuild hook to run on ssr builds only ([12928a6](https://github.com/kosmojs/kosmo/commit/12928a61940eb60ccbc00587c3398ff1650bc3b9))
* tanstack query integration ([a56056b](https://github.com/kosmojs/kosmo/commit/a56056b7ae0e97b98d3e30d4bb6630061eab1db8))

### Bug Fixes

* **ssr-generator:** correctly detect css assets ([90b10c6](https://github.com/kosmojs/kosmo/commit/90b10c6a7e529ebebdb24afac861e167c06624ac))
* **types:** core/fetch - allow undefined transport ([a8bdc30](https://github.com/kosmojs/kosmo/commit/a8bdc302cb132070e653bf864bfdb910e7afcd10))

### Code Refactoring

* generators definition ([a138aa3](https://github.com/kosmojs/kosmo/commit/a138aa3ad1f1c3c49b5b6576f95e52010a52f6b8))
* **generators:** dependencies can take a function; refine defineGenerator ([56f6d11](https://github.com/kosmojs/kosmo/commit/56f6d11226812dbc46753b5b381ca774f20193d9))
* rename api slot to backend; rename BACKEND_FRAMEWORKS to BACKENDS ([46243d1](https://github.com/kosmojs/kosmo/commit/46243d18cf7b5bde1060cd3b89d74e31f922e4d1))
* wrap app in AppProvider ([c05a347](https://github.com/kosmojs/kosmo/commit/c05a347403d8352977d37470bf6846280ec08a69))

### Improvements

* **cli:** add vite as default dependency ([fc33fa7](https://github.com/kosmojs/kosmo/commit/fc33fa7f15bedb41fa4210a2979f33c4391defdb))
* **cli:** format config file ([f616e41](https://github.com/kosmojs/kosmo/commit/f616e416289b587639d656967c856e32c8e96815))
* move tsconfig generation to core-generator ([72ed660](https://github.com/kosmojs/kosmo/commit/72ed660105c1e99e10b6f17bd23a037238bfaecf))

### Miscellaneous

* add changeset ([109eeff](https://github.com/kosmojs/kosmo/commit/109eeffc8a450d2046ca4b89efc82c579da4f768))
* **cli:** update tests ([06f11d9](https://github.com/kosmojs/kosmo/commit/06f11d9f83bad93fc5a24c9e6451fe2870b20176))
* deps bump ([38ac83c](https://github.com/kosmojs/kosmo/commit/38ac83cab81e1bff901f90b4700af2cdf336cc09))
* increase vitest testTimeout ([dadfd67](https://github.com/kosmojs/kosmo/commit/dadfd673f2e99b6fd2798211c143e6e484088564))
* version bump ([ea9f836](https://github.com/kosmojs/kosmo/commit/ea9f83635c347b4e15a37b921ea17b398b3f1bae))

## [0.2.7](https://github.com/kosmojs/kosmo/compare/v0.2.6...v0.2.7) (2026-07-31)

### Improvements

* jsx option per folder ([c7a755f](https://github.com/kosmojs/kosmo/commit/c7a755fc44434ca2442dfb831cd98bf54305141e))

### Miscellaneous

* add changeset ([ecf7e88](https://github.com/kosmojs/kosmo/commit/ecf7e8840fe9926e86b003b29629f058cc782eb8))
* version bump ([c18f50b](https://github.com/kosmojs/kosmo/commit/c18f50b003a63cb71f005714ecb5153cacb8f842))

## [0.2.6](https://github.com/kosmojs/kosmo/compare/v0.2.5...v0.2.6) (2026-07-31)

### Code Refactoring

* drop jsx:preserve from tsconfig ([bc50058](https://github.com/kosmojs/kosmo/commit/bc500587d4f8d7a438e93d2ed93143cd5b04060f))
* enable ssg on mdx folders only, by default ([9d7d91e](https://github.com/kosmojs/kosmo/commit/9d7d91ebb1e05e2f037d4d93d846c464901ba4f4))

### Miscellaneous

* add changeset ([ce99025](https://github.com/kosmojs/kosmo/commit/ce99025b9a9f4fdd0809bab059931c539a60ee40))
* version bump ([a32a468](https://github.com/kosmojs/kosmo/commit/a32a4684f60dd4eb4566b6fbbd643ec3e3e26946))

## [0.2.5](https://github.com/kosmojs/kosmo/compare/v0.2.4...v0.2.5) (2026-07-30)

### Miscellaneous

* add changeset ([016fd88](https://github.com/kosmojs/kosmo/commit/016fd88f933f73eead9dce4afbfc1c4062604c82))
* version bump ([c879e77](https://github.com/kosmojs/kosmo/commit/c879e7723fa11b7551218e88fbe7bdca32a6bf4f))

## [0.2.4](https://github.com/kosmojs/kosmo/compare/v0.2.3...v0.2.4) (2026-07-30)

### Miscellaneous

* add changeset ([50480d5](https://github.com/kosmojs/kosmo/commit/50480d5ed2df467b602dd7323c204e3109835b09))
* version bump ([dd92b2c](https://github.com/kosmojs/kosmo/commit/dd92b2c3654ca83e5bd3eb1fd2ab3f811aaada80))

## [0.2.3](https://github.com/kosmojs/kosmo/compare/v0.2.2...v0.2.3) (2026-07-30)

### Miscellaneous

* add changeset ([fe1b4ca](https://github.com/kosmojs/kosmo/commit/fe1b4ca8cec13470232c1fcb431270262452b23b))
* version bump ([727c603](https://github.com/kosmojs/kosmo/commit/727c6036c87f0766713f11d790bbc8dfc1820bda))

## [0.2.2](https://github.com/kosmojs/kosmo/compare/4db60b08c2ba004d0125bf19ffd38f7d4187ad72...v0.2.2) (2026-07-30)

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

### Code Refactoring

* **api-generator:** build production server ([592a91b](https://github.com/kosmojs/kosmo/commit/592a91b726771da3c45f6898c725556e7a540d6b))
* **api:** default export should not expose ValidationError ([a596c4c](https://github.com/kosmojs/kosmo/commit/a596c4cebd165d25b722ba5070957d6654213666))
* **api:** move framework-specific logic to generators ([059d7b9](https://github.com/kosmojs/kosmo/commit/059d7b9e0ed340f1a60fa8a3c821d50b40fe6d47))
* **api:** provide createApp and createRouter helpers ([f36df71](https://github.com/kosmojs/kosmo/commit/f36df716d0efae1a4a69091381460b14416410dd))
* **api:** provide errors as a separate module ([5b83488](https://github.com/kosmojs/kosmo/commit/5b83488fc2239499428af45f79807a0c3310908e))
* better path mapping ([6076cda](https://github.com/kosmojs/kosmo/commit/6076cda10ace55d44ea086c05a6241bbbe857c77))
* **cli,create:** introduce kosmo.config.ts, drop vite config files ([fa1f40a](https://github.com/kosmojs/kosmo/commit/fa1f40aee20daaf8cc6501616b2501e80e79600a))
* **cli:** aliasPlugin will be inserted mandatorily, definePlugin is optional ([62991af](https://github.com/kosmojs/kosmo/commit/62991af6a6a7c6a662899217b0bc844130dfbb19))
* **cli:** handle backend-less source folders ([0af3a58](https://github.com/kosmojs/kosmo/commit/0af3a5872ad47a7a677266c5c6c219657fdf1be4))
* **config:** base is now required, can be a string or an env-keyed object ([7e03be9](https://github.com/kosmojs/kosmo/commit/7e03be92ac64b9270c18869a30ba9b28c5bc40ef))
* **config:** provide framework-specific tsconfig files ([1c2f11b](https://github.com/kosmojs/kosmo/commit/1c2f11b14f9adc69e878ab15617730f40306484b))
* **core:** move framework-specific implementation details to lib ([d340284](https://github.com/kosmojs/kosmo/commit/d340284732b98c21e01844087afeaa4fcddf5788))
* CSS on SSR are handled by Vite now ([aa089cb](https://github.com/kosmojs/kosmo/commit/aa089cbf0cf574f465e161b408a1692f48ec2fb4))
* decouple core generator into a separate package ([6536a58](https://github.com/kosmojs/kosmo/commit/6536a58a902376ded125c0cce1f52bf6329cb877))
* default export routerFactory ([4abc0a2](https://github.com/kosmojs/kosmo/commit/4abc0a2817da011c4eeec30ca4547f4c328d1202))
* **dev/alias-plugin:** use createTsconfigPaths for path mapping consistency ([1f05272](https://github.com/kosmojs/kosmo/commit/1f0527267904a68b7fd3b14c309877788fb86fad))
* **dev:** allow mixed path segments, use path-to-regexp for routing ([c754e14](https://github.com/kosmojs/kosmo/commit/c754e14ca312c42d53c42fc24cb38b07eacb2d20))
* **dev:** handle backend-less builds ([da866b8](https://github.com/kosmojs/kosmo/commit/da866b80072b2382533a41b1ce8c619ca4d9f03a))
* **dev:** init generators before start vite servers ([c0ae51d](https://github.com/kosmojs/kosmo/commit/c0ae51d9b35a2c17773b3bc321b3b201accd8da7))
* **devlib:** add command option ([ee60650](https://github.com/kosmojs/kosmo/commit/ee606503346c7b4f40a3e32c5a933c3c9e78d85b))
* **devlib:** add ssr defaults ([9f34aba](https://github.com/kosmojs/kosmo/commit/9f34abab73929f8a35281516374cab703cda51fe))
* **devlib:** add ssr generator kind ([a2a46a8](https://github.com/kosmojs/kosmo/commit/a2a46a81d539a6643934ebbe1630e2fbf0fb87d0))
* **devlib:** rename RouteResolverEntry to ResolvedEntry ([eb3d011](https://github.com/kosmojs/kosmo/commit/eb3d01198b3b24ae78e26df3c2639cfc49e4e4e0))
* **dev:** move routes helpers to a separate file ([9a1b11b](https://github.com/kosmojs/kosmo/commit/9a1b11b4fd189922d206f6410780da27e71361c4))
* **dev:** new pathResolver; refined generators api ([7c547ee](https://github.com/kosmojs/kosmo/commit/7c547eee984135dcef3181297a4acc0ab2e3aaa2))
* **dev:** rename generator kind to slot ([7ee3dce](https://github.com/kosmojs/kosmo/commit/7ee3dcef4056f47f6d5d7abfe0837107ee8cc79e))
* **dev:** split into dev and lib packages ([416187e](https://github.com/kosmojs/kosmo/commit/416187ef64cf710c597b576ed0f98e9182918a87))
* **dev:** split isPageFile into isPageIndex and isPageLayout ([c2c425a](https://github.com/kosmojs/kosmo/commit/c2c425aad637f1488e52e4ed5e957aec26f5beed))
* **dev:** use cli from kosmojs package ([567c2d0](https://github.com/kosmojs/kosmo/commit/567c2d0904f141bd1392bd7e48c8f16bd9e0afb8))
* drop formatters ([dd5f5c6](https://github.com/kosmojs/kosmo/commit/dd5f5c60f58c623a836cd5969cb105391a641a88))
* drop multipart validation target ([0a2fbc7](https://github.com/kosmojs/kosmo/commit/0a2fbc72c396901a7d73699b88d40decb46837c8))
* enhance generators ergonomics ([dd9b446](https://github.com/kosmojs/kosmo/commit/dd9b446fb219c38b8d0c2a86c5759ffb9920e3b7))
* enhance generators factories consistency ([fb3adc9](https://github.com/kosmojs/kosmo/commit/fb3adc9363c3cbb467034d19041e553494b74977))
* **esbuilder:** upgrade esbuild to 0.28 for imports with { type: "text" } ([5030226](https://github.com/kosmojs/kosmo/commit/5030226bd12daae08888e6353740e0b732e566ec))
* **fetch-generator:** do not validate metadata on client ([bf1771c](https://github.com/kosmojs/kosmo/commit/bf1771c39ac14e0a29d2a0469c61945b1d066f0b))
* **fetch-generator:** handle mixed path segments, use path-to-regexp for routing ([47dad82](https://github.com/kosmojs/kosmo/commit/47dad82e0fe80c47ea82680592071244cad34b2e))
* **fetch-generator:** use new pathResolver ([f3c943c](https://github.com/kosmojs/kosmo/commit/f3c943c567993b03daa30c2887e4e97af88491a5))
* **generators:** plugins provided by generators ([c7db95b](https://github.com/kosmojs/kosmo/commit/c7db95b092f60d8c9bc35f3e56706179e3303873))
* **integration tests:** handle mixed path segments, use path-to-regexp for routing ([c814fe3](https://github.com/kosmojs/kosmo/commit/c814fe36e969a2e4cc5080755b964068021b86e1))
* keep import paths clean ([23b00e5](https://github.com/kosmojs/kosmo/commit/23b00e5b9f232b2854b1812f5dfb53cc191309d7))
* **koa-generator:** handle mixed path segments, use path-to-regexp for routing ([86acf16](https://github.com/kosmojs/kosmo/commit/86acf16833d8fe1da97c311a0605f4ba34ca19c2))
* **koa-generator:** new architecture to handle framework-specific constructs ([6e55396](https://github.com/kosmojs/kosmo/commit/6e55396592510338bf8e381a02f736efce379e23))
* **koa-generator:** refine routeSources props and typing ([c152471](https://github.com/kosmojs/kosmo/commit/c1524711a2e86de056e6ea9915e15b6348af7b6b))
* **koa-generator:** simpler appFactory, ditch withQueryparser ([538435f](https://github.com/kosmojs/kosmo/commit/538435ffd0c4069d81f7a76302e427b6c08457f1))
* **koa-generator:** use path-to-regexp to extract path params ([8bcacba](https://github.com/kosmojs/kosmo/commit/8bcacba8b539bd6fd20542bd3cd948b99d71b01e))
* **lib:** routerFactory should create and return both router and app ([31798de](https://github.com/kosmojs/kosmo/commit/31798de289f2fb84fbfa74a2582045baef448dfd))
* **mdx-generator:** move framework-specific implementation details to lib ([12d1222](https://github.com/kosmojs/kosmo/commit/12d12227807a0948ed99b0f5bd02a63145fd8283))
* **mdx-generator:** use hooks to get loader data and frontmatter ([1e18f58](https://github.com/kosmojs/kosmo/commit/1e18f58675c91a57058814a7ad53e3e991a91ecd))
* merge devlib package into dev ([3918b15](https://github.com/kosmojs/kosmo/commit/3918b158bed0ef13abdc6a92fc798616f34f9408))
* merge multiple configs by priority ([2ee2615](https://github.com/kosmojs/kosmo/commit/2ee26152382edf5a1df946f19fa9c94d87121aea))
* move CLI entirely to dev package ([34a082e](https://github.com/kosmojs/kosmo/commit/34a082ee8affe6bea14e46b95b34749f17a04b4c))
* move CLI functionality from dev package into cli ([d7556f4](https://github.com/kosmojs/kosmo/commit/d7556f416dc8f33c8004f78e4a3ef4422be84a4c))
* move defaults to core ([2cb705d](https://github.com/kosmojs/kosmo/commit/2cb705da948807fba2b04af5f7f87453d33027db))
* move SpinnerFactory to dev package ([5f6b21f](https://github.com/kosmojs/kosmo/commit/5f6b21f9ccdd340bcd36ea12f99bbafdca0f7286))
* move vite plugins to a separate package ([4e62508](https://github.com/kosmojs/kosmo/commit/4e625089f97e1f397cdbc5f8fe7d31b84a4ac6ed))
* multiple validation targets, on demand body parsers ([0754617](https://github.com/kosmojs/kosmo/commit/0754617c6e46d29fa7a09d920f470c0d28783223))
* **openapi-generator:** handle mixed path segments, use path-to-regexp for routing ([efaf420](https://github.com/kosmojs/kosmo/commit/efaf4208da370c75ccb71988f91e7aee6b0c2399))
* **openapi-generator:** use new pathResolver ([f38ef0c](https://github.com/kosmojs/kosmo/commit/f38ef0cebfdd646d026afc86650f1b1e1bf8531a))
* per-framework render signature ([19cb11b](https://github.com/kosmojs/kosmo/commit/19cb11bdf3a0dde006ba059e5384edde0468b18e))
* **react-generator:** handle mixed path segments, use path-to-regexp for routing ([ba1a408](https://github.com/kosmojs/kosmo/commit/ba1a40857898b798709d7437c9fc93ea23770bf3))
* **react-generator:** move framework-specific implementation details to lib ([845b416](https://github.com/kosmojs/kosmo/commit/845b416f1998376a4b97b19db816e08252d570b0))
* **react-generator:** routerFactory should create and return both router and app ([5c9bde4](https://github.com/kosmojs/kosmo/commit/5c9bde46135b7697e5fef4d114732cdee71ede95))
* **react-generator:** use new pathResolver ([bff8968](https://github.com/kosmojs/kosmo/commit/bff8968bb5b830f569d87e62daec0785399705b7))
* **react:** generate separate routes for client and server ([2c2571a](https://github.com/kosmojs/kosmo/commit/2c2571a59233f26b330cd469b09b0f7d641c5d73))
* rename api-generator to koa-generator ([e0af45d](https://github.com/kosmojs/kosmo/commit/e0af45d69d16aafab2d9e9200045b0eefe76985e))
* rename ExtendT to UseT ([6b44a11](https://github.com/kosmojs/kosmo/commit/6b44a117e242f31551ddab4fbeec88b029d131ce))
* rename kosmojs to create-kosmo ([a808161](https://github.com/kosmojs/kosmo/commit/a80816123f06255551da91de19b70f9cd0668f50))
* **rename:** pageRouteMapperHelpers to pageRouteRenderHelpers; routeMap to linkMap ([bff8638](https://github.com/kosmojs/kosmo/commit/bff8638008b048631f61a558a2918cf262ecbff9))
* replace fs-extra with native functions ([8f03115](https://github.com/kosmojs/kosmo/commit/8f03115827d540221b4bc2000171f0d939a42827))
* replace import.meta.env.SSR with __KOSMO_SSR__ ([f48a416](https://github.com/kosmojs/kosmo/commit/f48a416dfbefd685de733a5520a9981a626ac998))
* revamp params definition syntax ([b7576fb](https://github.com/kosmojs/kosmo/commit/b7576fbf6704e3dd137f045adc918161f93946ae))
* separate tsconfig for src and test ([c0bd724](https://github.com/kosmojs/kosmo/commit/c0bd7243056d32a70a7012081ddb91c664f17eb9))
* simplify routerFactory ([6956f30](https://github.com/kosmojs/kosmo/commit/6956f30bdbbe2b28ec883d765026975711d468e0))
* **solid-generator:** handle mixed path segments, use path-to-regexp for routing ([9a191bb](https://github.com/kosmojs/kosmo/commit/9a191bbcd7b72745de62eecda4cb12902bc69469))
* **solid-generator:** move framework-specific implementation details to lib ([124900c](https://github.com/kosmojs/kosmo/commit/124900c2bf3b2451d48d16a1f0f62dd043f3e5b4))
* **solid-generator:** routerFactory should create and return both router and app ([0e29b1a](https://github.com/kosmojs/kosmo/commit/0e29b1a57073a7debea9d4004fefe813e245b6f7))
* **solid-generator:** use new pathResolver ([8d2afd4](https://github.com/kosmojs/kosmo/commit/8d2afd426a4336409fe35954ddc6e148070ec498))
* **solid:** generate separate routes for client and server ([0fec8a8](https://github.com/kosmojs/kosmo/commit/0fec8a84fd591e6788915245feddce7aa0a6c1de))
* **ssr-generator:** add path-to-regexp as a generator dependency ([b484ac0](https://github.com/kosmojs/kosmo/commit/b484ac0aaaa6c82cbfca654a43d2c21abdede4a3))
* **ssr-generator:** critical css include css from layouts that wrap current route ([c95c89d](https://github.com/kosmojs/kosmo/commit/c95c89d14805801fee092aac168e4a6764f6287f))
* **ssr-generator:** handle mixed path segments, use path-to-regexp for routing ([01bac9a](https://github.com/kosmojs/kosmo/commit/01bac9aba4707ed44d0fa6f85858db8148bf4833))
* **ssr-generator:** use new pathResolver ([1095cac](https://github.com/kosmojs/kosmo/commit/1095cac0a51d6861b58ba0e963a5cbb06e73d638))
* **test/integration:** use new pathResolver ([eb69856](https://github.com/kosmojs/kosmo/commit/eb698568d700c6888085cf03de8bc072ddbda184))
* **typebox-generator:** handle mixed path segments, use path-to-regexp for routing ([165f4fc](https://github.com/kosmojs/kosmo/commit/165f4fcc42f3652075ac24a45fcd7ef89822660f))
* **typebox-generator:** use new pathResolver ([4e9183e](https://github.com/kosmojs/kosmo/commit/4e9183eaaae9bc9f48ad32f1539e438b2673ddc1))
* use Hono for SSR; add 404 page ([80f539f](https://github.com/kosmojs/kosmo/commit/80f539f6ccf1bd88582e814bc6a39d34024a136b))
* use npx to create projects and npm task to create source folders ([2c3e78a](https://github.com/kosmojs/kosmo/commit/2c3e78ae601d54db9e55c5d39c3c5951ac5e4ef8))
* use vite for internal build ([521a25f](https://github.com/kosmojs/kosmo/commit/521a25fe2593542d2c17be557dcd223fb7c06f0a))
* **validation:** switch to new typebox api ([6c561b9](https://github.com/kosmojs/kosmo/commit/6c561b920158b775db3fd16590211d34e91dc549))
* **vue-generator:** handle mixed path segments, use path-to-regexp for routing ([09e0657](https://github.com/kosmojs/kosmo/commit/09e06579cdae0a0c5f70690c56fa72a1cc48666b))
* **vue-generator:** move framework-specific implementation details to lib ([08442a0](https://github.com/kosmojs/kosmo/commit/08442a055064f05c06087f20634af9d657ffd4f4))
* **vue-generator:** routerFactory should create and return both router and app ([a1ca0e4](https://github.com/kosmojs/kosmo/commit/a1ca0e422571072d7f886fbe41fbe7ab7b4b40e2))
* **vue-generator:** use new pathResolver ([f6ecf2e](https://github.com/kosmojs/kosmo/commit/f6ecf2e3481191806de7199ee2751712093ab026))
* **vue-generator:** useLoaderData accept a key; used to get data for layouts ([dc972d3](https://github.com/kosmojs/kosmo/commit/dc972d3a4ed3108a7f66988642eeed6ee271a9f4))
* **vue:** generate separate routes for client and server ([b7c0cb9](https://github.com/kosmojs/kosmo/commit/b7c0cb9428d73bcb2b428db7bedad4f153a14e34))
* **wsbuild:** handle bundled deps the explicit way ([d030b52](https://github.com/kosmojs/kosmo/commit/d030b527be0e53feb07ade876b1a283126203858))

### Improvements

* add pathPattern to RouteSource ([c007797](https://github.com/kosmojs/kosmo/commit/c0077975ed74a29ee522efaeb03212ad67ea10dd))
* api ServerFactory, expose getListenHandles and onListen ([20c348a](https://github.com/kosmojs/kosmo/commit/20c348a954b6ebebcdafcb0df2475d8dc1bb211e))
* bundle all dependencies into a self-contained file ([24ba04d](https://github.com/kosmojs/kosmo/commit/24ba04d480a70b73bc9034cf7154669d354b9dd6))
* **cli:** do not install vite on target project ([3a619d1](https://github.com/kosmojs/kosmo/commit/3a619d1d72789ae2ea596d2c09aea29693d863e7))
* **config:** update tsconfig files ([ccc8c41](https://github.com/kosmojs/kosmo/commit/ccc8c4192fa8750b8301de8268011e5870ec85a7))
* **core/fetch:** provide createHost helper ([701e831](https://github.com/kosmojs/kosmo/commit/701e83153aac8138a2b3df43f4c2c21f5cbe4ed6))
* **core:** implement HTTPError ([4acb78f](https://github.com/kosmojs/kosmo/commit/4acb78f70e338d3fb02e34fdd44ae6ad1cbd8b6a))
* **core:** SSROptions.assets path is now optional (for inline assets) ([2dcb88c](https://github.com/kosmojs/kosmo/commit/2dcb88ce622a4e1c41c6a2bbae7fbe85ec20b034))
* **create:** default dist folder ([8d5fa54](https://github.com/kosmojs/kosmo/commit/8d5fa548480faca89010af590fe68ec330fa8958))
* **create:** use compilerOptions.jsx.preserve regardless framework ([4db60b0](https://github.com/kosmojs/kosmo/commit/4db60b08c2ba004d0125bf19ffd38f7d4187ad72))
* detect early invalid route patterns ([fd59fc0](https://github.com/kosmojs/kosmo/commit/fd59fc07e6eb9b3b9f124e11132b167e07dce63a))
* **devlib/render:** allow handlebars partials/helpers ([7a51e09](https://github.com/kosmojs/kosmo/commit/7a51e09e948c662a2e7b5001311b4414298966cb))
* **devlib:** add entryDir, remove ssrDir ([48c3016](https://github.com/kosmojs/kosmo/commit/48c301603e50b4a4a8c0e98da7b73603eadbe70e))
* **devlib:** add SSRFactory ([525e8ae](https://github.com/kosmojs/kosmo/commit/525e8ae560c6b4e4252b246b59598e460b80c7b3))
* enable preload on ssr by default ([fe8ea00](https://github.com/kosmojs/kosmo/commit/fe8ea00cd96bd7f54cd625a6c7d938c27bc469fe))
* **fetch-generator:** allow unwrap option ([4d5a341](https://github.com/kosmojs/kosmo/commit/4d5a34141ba4df4447e499fe142c44ad0b42a18b))
* **generators/ssg-generator:** use tsconfigPaths plugin ([96df461](https://github.com/kosmojs/kosmo/commit/96df461b99bc8118fc02587dd778312adfa35405))
* **hono-generator:** update server to run nativelly on Node/Deno/Bun ([7311ca7](https://github.com/kosmojs/kosmo/commit/7311ca770581d87e1ccb07e73310b0ea63074020))
* **koa-generator tests:** use native FormData ([525f4d0](https://github.com/kosmojs/kosmo/commit/525f4d0e228bab9d635c65844f823a2798c65487))
* **koa-generator:** better error handler ([1babc77](https://github.com/kosmojs/kosmo/commit/1babc77c42cc36dbfe9e3b1ebc5d7f14cc7e23df))
* **koa-generator:** better responce validation ([5d178fb](https://github.com/kosmojs/kosmo/commit/5d178fbbf20f6f6d81a3e0d5b02553ef7e75d578))
* **koa-generator:** server factory typing ([c3dbe44](https://github.com/kosmojs/kosmo/commit/c3dbe44516f5d739c9f75ab471714703fba21d10))
* **lib/createPath:** add entry resolver ([be6598e](https://github.com/kosmojs/kosmo/commit/be6598e624b3368e209c97f9b82bcb1f0d337020))
* **lib/tsconfig:** include **/*.d.ts files ([158b955](https://github.com/kosmojs/kosmo/commit/158b95541ea75f1fdff6025a3130574a23fa623b))
* **mdx-generator:** consolidate config ([4ca3092](https://github.com/kosmojs/kosmo/commit/4ca30927c4f73b65f55406f89af3e2cd779f4829))
* move response body validation types to generators ([c3953b4](https://github.com/kosmojs/kosmo/commit/c3953b4a990432c9710a37ee9e553de947858901))
* **pathResolver:** drop fetch prop ([7d9e734](https://github.com/kosmojs/kosmo/commit/7d9e734c504da88cca8ab57434dd48b35a809192))
* pathTokensFactory ([e672d14](https://github.com/kosmojs/kosmo/commit/e672d14d53ac3ccb6e8ede414a874bd6f06833da))
* **react-generator:** drop meta ([791b358](https://github.com/kosmojs/kosmo/commit/791b3589b4af74103bf96fc8edb370afaba7745f))
* rename SSROptions.SSROptions.url to path ([4ece2e3](https://github.com/kosmojs/kosmo/commit/4ece2e366a4e76ae3f2d414f984e11a7c1d05fac))
* RouteSource params to Array<string> ([f86f5f9](https://github.com/kosmojs/kosmo/commit/f86f5f95e8ce664510488c07bfae8653597ffa67))
* simplify AppFactory ([6733da0](https://github.com/kosmojs/kosmo/commit/6733da05b415a690505acdc3b9e7a009db635920))
* **solid-generator:** drop meta ([419b7e9](https://github.com/kosmojs/kosmo/commit/419b7e92d93d2dbdc9259cb8443c6f20fbfb07e5))
* **solid-generator:** use renderToStringAsync ([d7e70ca](https://github.com/kosmojs/kosmo/commit/d7e70caeb31b45cabecd5e3ca6dda63aa8f1931a))
* **ssr-generator:** drop resolve.tsconfigPaths ([b02833e](https://github.com/kosmojs/kosmo/commit/b02833eb666a2f5a1b6311ec4fae0ba106165ffc))
* **ssr-generator:** sortRoutes ([bf5bcb0](https://github.com/kosmojs/kosmo/commit/bf5bcb08dc8d170e37b495f880496d4d1e1ad353))
* **ssr:** ditch serveStaticAssets option ([2cf9d7b](https://github.com/kosmojs/kosmo/commit/2cf9d7b5d785afd4f635d3ebed24ec7267dbab03))
* **ssr:** provide URL instance to render factory ([736e2d9](https://github.com/kosmojs/kosmo/commit/736e2d9fac86609bb208bf3ccad6987eb373d56d))
* **tsconfig:** add deno/bun types ([a49e56d](https://github.com/kosmojs/kosmo/commit/a49e56d199717499771407d949d8868fbd889fba))
* **tsconfig:** do not exclude lib ([3a0f16d](https://github.com/kosmojs/kosmo/commit/3a0f16d034dba7f16f5e9c119a4183b749619ced))
* **tsconfig:** jsx preserve ([d59b1ad](https://github.com/kosmojs/kosmo/commit/d59b1adee5683afc9d4cb9536e7b6ed55d41ffe7))
* **typebox-generator:** add more custom types ([32f792f](https://github.com/kosmojs/kosmo/commit/32f792fe7d7539260962d35b66988de3ec6ab2f5))
* **typebox-generator:** update TFile to accept a formidable flavored file ([8ee83bd](https://github.com/kosmojs/kosmo/commit/8ee83bd7a0db6bbcf70f58f0360ddb4865d18755))
* update generators to provide plugins without initialization ([19950aa](https://github.com/kosmojs/kosmo/commit/19950aa7af2d710daced0194ad1ce70febd7893d))
* **validation schemas:** allow direct access to schema methods ([ca2ad60](https://github.com/kosmojs/kosmo/commit/ca2ad60e99425c8ca0816ff4b93941ae4e4d913b))
* **vue-generator:** drop meta ([4352258](https://github.com/kosmojs/kosmo/commit/43522588d2fc456cac26120d9471a01df5394a01))
* which dependencies are bundled into the SSR output ([734e55a](https://github.com/kosmojs/kosmo/commit/734e55a3f4ed752e1d9e70fb9d54b596b979c20d))

### Miscellaneous

* add .envrc ([5da7c61](https://github.com/kosmojs/kosmo/commit/5da7c61efd9da43e2948d54f898c95e6b19f1e7b))
* add back version to generators packages ([3a51d81](https://github.com/kosmojs/kosmo/commit/3a51d81699d159bf61679978fdb16bf2929bf16b))
* add biome.json ([b3bf4f0](https://github.com/kosmojs/kosmo/commit/b3bf4f07550b474910afec58b4889140ceef4d67))
* add changeset ([13bf655](https://github.com/kosmojs/kosmo/commit/13bf655e154d50dcfbdd96103ca2944b6d2509e0))
* add context7 widget ([307b6fa](https://github.com/kosmojs/kosmo/commit/307b6fa87fa3888ccbbf561cd3d28eb6b41a74a2))
* add context7.json ([684c8e4](https://github.com/kosmojs/kosmo/commit/684c8e4f9f904997f24297caa55579b813000aef))
* add license ([7530c61](https://github.com/kosmojs/kosmo/commit/7530c61500c95b39f2aca8ba9f08f3889638f8fc))
* add name to wsbuild and test packages ([ac90559](https://github.com/kosmojs/kosmo/commit/ac90559e17c30e51fced93b163b15a9cebb14a54))
* add pnpm-workspace.yaml ([f1810ce](https://github.com/kosmojs/kosmo/commit/f1810ce285f36b31f75bbbda20b6d6b50096547a))
* add renderHelpers ([476cab3](https://github.com/kosmojs/kosmo/commit/476cab3e74c5fff12a13b76b68de188b54bbc1e3))
* add tsconfig types ([4746a14](https://github.com/kosmojs/kosmo/commit/4746a14efef434879963b464a0814d60d2d0f065))
* **api:** refine debug output ([592f7f3](https://github.com/kosmojs/kosmo/commit/592f7f345e07bea6d7ebfec4d9a503f120add2f3))
* avoid packages use workspace-installed dependencies ([d670264](https://github.com/kosmojs/kosmo/commit/d6702645ab36414af28c46e053594df590724d0a))
* biome.json ([93abab6](https://github.com/kosmojs/kosmo/commit/93abab6107b5c3e847196ed34a4de40ce4e1879d))
* bump tfusion version ([22d632e](https://github.com/kosmojs/kosmo/commit/22d632e20dc8f6d1eb0e9dc939965d7283a029fc))
* cleanup ([f47e57a](https://github.com/kosmojs/kosmo/commit/f47e57a427dcd54b836a696afc2f90c3724f0ef1))
* cleanup ([321b3b8](https://github.com/kosmojs/kosmo/commit/321b3b8619ca28fdcf8166961ca16c40469c7f44))
* **cli:** expose createKosmoConfig ([2027dae](https://github.com/kosmojs/kosmo/commit/2027dae74d4ea0e169af0d42e63066c2ecf5a91d))
* **cli:** fix tests ([05590e1](https://github.com/kosmojs/kosmo/commit/05590e1e421ed18d586fc8e8ae98eee424facf5b))
* **cli:** reorder frameworks ([b780afa](https://github.com/kosmojs/kosmo/commit/b780afa488e2c19f65ca334b640353d26a34dc85))
* **core-generator:** add KOSMO_SERVERSIDE_FETCH to env.d.ts ([b81b807](https://github.com/kosmojs/kosmo/commit/b81b8076f54e77f861585911bcef3fb9199a67ed))
* **core:** deps cleanup ([cdceb42](https://github.com/kosmojs/kosmo/commit/cdceb425463c7b2384e1e6449b8eee05299d5c83))
* **create:** fix preamble ([60a5596](https://github.com/kosmojs/kosmo/commit/60a55967f9a7a824d6ab2ad0e665992501943446))
* default access public ([00b69fa](https://github.com/kosmojs/kosmo/commit/00b69fac8d10b65c3f053252567b5dbe501d42dc))
* DEFAULT_PORT = 4554 ([e6438dc](https://github.com/kosmojs/kosmo/commit/e6438dcbab611137f6a5f4c3005c64fd50f9275a))
* DEFAULT_PORT = 4556 ([764e091](https://github.com/kosmojs/kosmo/commit/764e09161077a025fab65a52352aa9b98c106379))
* deps bump ([38be33f](https://github.com/kosmojs/kosmo/commit/38be33f4040cd1dfac5d1d3c768cc53c7d7bff61))
* deps bump ([ccbd5e5](https://github.com/kosmojs/kosmo/commit/ccbd5e5618b70aba04db68ac123a833726c857bf))
* deps bump ([07d9952](https://github.com/kosmojs/kosmo/commit/07d995212687c48acd9421552ae9abba12f0f314))
* deps bump ([6b07e8a](https://github.com/kosmojs/kosmo/commit/6b07e8abbf1ec831b34719652db49b1ba0906b54))
* deps bump ([12008a2](https://github.com/kosmojs/kosmo/commit/12008a2add36abd630e726f061378f0e122a6154))
* deps bump ([c56f160](https://github.com/kosmojs/kosmo/commit/c56f160398116327b7d00aecf66a15508daf690c))
* deps bump ([f0eea2d](https://github.com/kosmojs/kosmo/commit/f0eea2df43f8ee40090a8247ccb135dd1a283185))
* deps bump ([beec7ac](https://github.com/kosmojs/kosmo/commit/beec7ac1399d629a035d9bfb15b81942f17f9412))
* deps bump ([9a18895](https://github.com/kosmojs/kosmo/commit/9a18895394caf84a1bcfc79b57b5c373e4d77be6))
* deps bump ([cebc81b](https://github.com/kosmojs/kosmo/commit/cebc81b92fe3cee65a18449bdc633cf4b2363d06))
* deps bump ([8d0b9e5](https://github.com/kosmojs/kosmo/commit/8d0b9e5e8774ca9fb11817575521fd7145b1a0d4))
* deps bump ([3f90ae0](https://github.com/kosmojs/kosmo/commit/3f90ae01ec78d28893bf300768acd98acfd46cc0))
* deps bump ([3be6786](https://github.com/kosmojs/kosmo/commit/3be67869066ffe4f7a3c1f1c8bb9e28beb5d1055))
* deps bump ([3b9ecf0](https://github.com/kosmojs/kosmo/commit/3b9ecf0b366310b9d33bf8c8813bfb433617e949))
* deps bump ([d7797eb](https://github.com/kosmojs/kosmo/commit/d7797eb8fd59d1d8dc0bc78812ea9770cbb08fa4))
* deps bump ([9b56d3f](https://github.com/kosmojs/kosmo/commit/9b56d3ffe1a66509dc6bc7c125d25715dd0766e4))
* deps bump ([d075587](https://github.com/kosmojs/kosmo/commit/d075587bbc448e7e89c9eeec65490c1d6fa91778))
* deps bump ([9e21796](https://github.com/kosmojs/kosmo/commit/9e2179636fba11d4b4cac0acb3b201111ef3fcb5))
* **dev:** rename stubGenerator to coreGenerator ([a0fcc25](https://github.com/kosmojs/kosmo/commit/a0fcc25d015cd90e02c00519babb8fa8c8dd343c))
* **dev:** share pathExists ([8c59e91](https://github.com/kosmojs/kosmo/commit/8c59e91c9737189f75e136b96dfc88ec55226415))
* **docs:** add empty pnpm-workspace.yaml for install to work without --ignore-workspace ([87e082a](https://github.com/kosmojs/kosmo/commit/87e082afcf28cd00ae49551be93e7b3c2ca4b6a5))
* **docs:** drop frontend utilities page ([8966749](https://github.com/kosmojs/kosmo/commit/89667492710e691e0bf59f999845b0ba298273d1))
* **docs:** minor update ([a103582](https://github.com/kosmojs/kosmo/commit/a10358200210a98ad2904e8c0d28f032f47eb91a))
* drop .envrc ([6dabafb](https://github.com/kosmojs/kosmo/commit/6dabafb8ea55dcadd485ab1907052f093afb3250))
* drop dotenv ([660ed2b](https://github.com/kosmojs/kosmo/commit/660ed2b2e6848e9f16f970a88951db258839e7b3))
* drop public/KosmoJS.svg ([b6175e5](https://github.com/kosmojs/kosmo/commit/b6175e5b6375642157dff86f855c06e54c2b2664))
* drop redundant dependencies installed into user projects ([50aefd7](https://github.com/kosmojs/kosmo/commit/50aefd7a27068e83f48e825aa24392a48f132499))
* **fetch-generator:** fix tests ([74a54be](https://github.com/kosmojs/kosmo/commit/74a54be7775320e01c2b87373c5abc1fffe0a4f1))
* fix .changeset/config.json ([3556a72](https://github.com/kosmojs/kosmo/commit/3556a727d95945dab25c2862ee795f47f1291fe0))
* fix deps ([4aabb17](https://github.com/kosmojs/kosmo/commit/4aabb177f34cb9f3e8e5cacf41c01dff4b1511e3))
* fix README links ([f87c7ae](https://github.com/kosmojs/kosmo/commit/f87c7ae56ac6cdc993e15cb7837f316ae23f79c1))
* fix tests to use folder's tsconfig ([ad9d65d](https://github.com/kosmojs/kosmo/commit/ad9d65da0828a3bba9d67fe1089bdafe907325a5))
* format ([0246aad](https://github.com/kosmojs/kosmo/commit/0246aad3eec89e8c356c4b33a37e0c60257ffe37))
* format ([e6b3480](https://github.com/kosmojs/kosmo/commit/e6b3480b56e1318ef4e849d3ed14fa32aea48e8d))
* format ([972e578](https://github.com/kosmojs/kosmo/commit/972e57829cf97bee468197385a08aa6d3ab6a796))
* **hono-generator:** fix tests ([97d718b](https://github.com/kosmojs/kosmo/commit/97d718b395b1c32ec3e78460e6dccbada83473fe))
* increase openapi testTimeout ([9ef471a](https://github.com/kosmojs/kosmo/commit/9ef471ac8a74e93a857f9588d889181d842c0b86))
* **koa-generator:** fix tests ([f3678de](https://github.com/kosmojs/kosmo/commit/f3678de2a5147547d082fcee850e052339927001))
* **koa-generator:** multiple refinements ([aaf9820](https://github.com/kosmojs/kosmo/commit/aaf98203df97f0bc6f7950e90f61dadb555446f9))
* **koa-generator:** remove unused deps ([7617ef0](https://github.com/kosmojs/kosmo/commit/7617ef05d5bdbd2fbdeeb40c0f7732cd67ab9039))
* **koa-generator:** update README ([554e3cb](https://github.com/kosmojs/kosmo/commit/554e3cb93f0c751933a7c2eee16faa8a0fa159c2))
* **lib:** fix tests ([3e3aca8](https://github.com/kosmojs/kosmo/commit/3e3aca87839000b26b3ea9f39328f4820e22b6a1))
* load templates without type: "text" ([d1a34bc](https://github.com/kosmojs/kosmo/commit/d1a34bc439c9a597c2ea22fb13e0b8240d184f9a))
* minor updates ([07b1919](https://github.com/kosmojs/kosmo/commit/07b19196fc69b93abec6fbf757be6a2845d3c90e))
* new biome overrides ([a012976](https://github.com/kosmojs/kosmo/commit/a0129764c4691b34a00c17f965c4fe4e67707889))
* **openapi-generator:** update test snapshot according to new sortRoutes ([952e530](https://github.com/kosmojs/kosmo/commit/952e5302c08a9270e17a4733bc3b29821c012f70))
* **react-generator:** fix tests ([f0fb8c6](https://github.com/kosmojs/kosmo/commit/f0fb8c6819e438aa92207c47451c7802ce7546d0))
* refine format ([5ad3aa6](https://github.com/kosmojs/kosmo/commit/5ad3aa6740db86e72351336420af5bc027b200ad))
* refine generators self imports ([9a53011](https://github.com/kosmojs/kosmo/commit/9a53011654adbe262965b05ea29dd1a4297cf168))
* refine path mappings for integration tests ([1639ddc](https://github.com/kosmojs/kosmo/commit/1639ddce376d1c7c81f982a4e552919c1252912a))
* refine tests ([96dc4d2](https://github.com/kosmojs/kosmo/commit/96dc4d2eb24fbc82f77371ad71dcf62cf36698f1))
* rename __KOSMO_SSR__ to __KOSMO_HYDRATABLE__ ([18f761c](https://github.com/kosmojs/kosmo/commit/18f761cb6bd02b679f9215dfa920aff2f27175a5))
* rename pageRouteRenderHelpers to routeRenderHelpers ([cd05278](https://github.com/kosmojs/kosmo/commit/cd05278e0bbccc8aa66a0b6ca81803fdddde3024))
* reorganize templates imports ([1514c20](https://github.com/kosmojs/kosmo/commit/1514c207952f4b1d91b89c0580239b4a98add4b8))
* revamp vitest.config.js ([4cf4125](https://github.com/kosmojs/kosmo/commit/4cf412559ade9bbae84c894389cf198966d76681))
* **solid-generator:** fix tests ([4893013](https://github.com/kosmojs/kosmo/commit/48930135cd3cd4a168c0d4370ab2f92f47cadc5a))
* **solid-generator:** remove redundant dependency ([27bce7f](https://github.com/kosmojs/kosmo/commit/27bce7f541aabcfdd4a6534ef45f23b5780d1a66))
* **ssr-generator:** more exact asset hash checking ([e19f388](https://github.com/kosmojs/kosmo/commit/e19f3886e2a59dbbed8b0ec6390abb2276416a9f))
* **ssr-generator:** remove redundant option ([491fac4](https://github.com/kosmojs/kosmo/commit/491fac4cb6bee3708b6b20fa72d63518a94e97a9))
* **ssr-generator:** stream as never ([88d8fa3](https://github.com/kosmojs/kosmo/commit/88d8fa3c33bd04c9bd0ce9e25bd7d710416b0a40))
* swap icon ([69daead](https://github.com/kosmojs/kosmo/commit/69daead0663abcb0a7d52601db5de085c0cdbc49))
* **test:** add scripts ([b3e5d43](https://github.com/kosmojs/kosmo/commit/b3e5d433ff5b4b5e5721ede4e6e58ff7bf0e4c1c))
* **test:** increase hookTimeout, drop jsdom ([c35a4cf](https://github.com/kosmojs/kosmo/commit/c35a4cf5629eda6d571ded544c9cc795752358fb))
* **test:** refine integration tests ([0187f04](https://github.com/kosmojs/kosmo/commit/0187f0476ca0d3d74b65929decffaf8fad7f137c))
* **test:** rename setup files for openapi/typebox generators ([c7fd70a](https://github.com/kosmojs/kosmo/commit/c7fd70a5728d10e5446d11be13d0b8fffb69ac12))
* **tsconfig:** add jsx preserve ([4f99a18](https://github.com/kosmojs/kosmo/commit/4f99a183225a4c19d1633d75d4b9bd5a43ce46ca))
* **tsconfig:** drop vite/client from types ([c67c053](https://github.com/kosmojs/kosmo/commit/c67c053e36e7f955c6192fdd70f56f11e7f91643))
* **tsconfig:** provide only @types/node by default ([60edc12](https://github.com/kosmojs/kosmo/commit/60edc12a15ab15dfdfc6110651c9783862db8cf4))
* **typebox-generator:** rename templates/lib to index ([b30fca3](https://github.com/kosmojs/kosmo/commit/b30fca3c1fb4ab1c8f787e09bffeb6a5e3ec665c))
* update .changeset/config.json ([d91850e](https://github.com/kosmojs/kosmo/commit/d91850e32b410c576aab081e4bea5043ac5d8b15))
* update .gitignore ([23a82cf](https://github.com/kosmojs/kosmo/commit/23a82cf49909df135ce8951365c82aa6d4e37678))
* update .gitignore ([16c7bbf](https://github.com/kosmojs/kosmo/commit/16c7bbfab984ce79e3d125f27ea249aa0f2c34c4))
* update .gitignore ([c3df0e0](https://github.com/kosmojs/kosmo/commit/c3df0e0ee378254c6ae2402516144b772b2beb71))
* update biome.json ([b1216f1](https://github.com/kosmojs/kosmo/commit/b1216f1ff3f92d07e2ea8fd0e9ae3991039d07ac))
* update biome.json ([77b63df](https://github.com/kosmojs/kosmo/commit/77b63df6a2e93d6fd81e0625db54f259e978e3aa))
* update biome.json ([ffd0e06](https://github.com/kosmojs/kosmo/commit/ffd0e0674d4415ac3b986074d24118ee14454b6e))
* update biome.json ([2051582](https://github.com/kosmojs/kosmo/commit/2051582ea793951da44fea1772cc083900c5c920))
* update biome.json ([1dd1679](https://github.com/kosmojs/kosmo/commit/1dd16794384bd6c9d5eec4fcba3bf9bb448539ba))
* update biome.json ([2db94e8](https://github.com/kosmojs/kosmo/commit/2db94e815a7b75896b25bbe4d2460703203e2b9a))
* update biome.json ([0cee00a](https://github.com/kosmojs/kosmo/commit/0cee00ab49f3330ff174f0b864b2d76a45efdad6))
* update biome.json ([b6726fd](https://github.com/kosmojs/kosmo/commit/b6726fd26eb28ff8095a60d4aad95cab63d6a1ed))
* update context7.json ([ae9a235](https://github.com/kosmojs/kosmo/commit/ae9a235dbbff3d17e5bc112d48f2e6b69963b7e6))
* update default port to 4556 ([9de629b](https://github.com/kosmojs/kosmo/commit/9de629b5a553631e4145ca8495cecb893bdfefad))
* update docs ([faa935d](https://github.com/kosmojs/kosmo/commit/faa935d499071210eb0ec914adf5a228cc8e21a9))
* update docs ([ac8507a](https://github.com/kosmojs/kosmo/commit/ac8507aa3528eef566e983f1eb92b0e29fc8935f))
* update github workflow ([255b921](https://github.com/kosmojs/kosmo/commit/255b921565fdf21b5bf4aeb562f3deda1b77f669))
* update github workflows ([9cdc18f](https://github.com/kosmojs/kosmo/commit/9cdc18f1696b34146cba3d174c15a3d5c950228f))
* update pnpm-lock.yaml ([44b5836](https://github.com/kosmojs/kosmo/commit/44b58362d90c277d707f85de4aea7f1e297de6f3))
* update publish script ([8830001](https://github.com/kosmojs/kosmo/commit/8830001c21f66d95681a03ea325146910802f8da))
* update README ([43b4f2d](https://github.com/kosmojs/kosmo/commit/43b4f2d697a720ce18c339541eeb3ab8d025c5f5))
* update README ([5ef3e67](https://github.com/kosmojs/kosmo/commit/5ef3e67965338550b36aa35cc8db7c0e2b6b6776))
* update README ([b78c0ea](https://github.com/kosmojs/kosmo/commit/b78c0ea40049de8fb55e1931476ea571377b7c0f))
* update README ([a3dcd81](https://github.com/kosmojs/kosmo/commit/a3dcd81e223900bc64e160f26325eb469c338150))
* update test workflow ([08433e6](https://github.com/kosmojs/kosmo/commit/08433e627b9794e70dba6dbd0116db6fa188c0fc))
* update vitest.config.js ([83596ca](https://github.com/kosmojs/kosmo/commit/83596ca0911bafd7351d69fbde1e32e86a888994))
* use named functions for better debug ([d817b3b](https://github.com/kosmojs/kosmo/commit/d817b3bd3821ad7a296db419c6a557d4418f13ce))
* use workspace dependencies as devDependencies ([fbfc356](https://github.com/kosmojs/kosmo/commit/fbfc3564d16497076d675679c0a97cb3639712d0))
* version bump ([13986c3](https://github.com/kosmojs/kosmo/commit/13986c30e9a285c4290c14ce49f263384c2385b3))
* version bump ([fb9345a](https://github.com/kosmojs/kosmo/commit/fb9345a4f1190beea893cbea317e80d645a06298))
* version bump ([4f9e4de](https://github.com/kosmojs/kosmo/commit/4f9e4de715defbb8179f0dc256587948eef2e093))
* version bump ([c601db4](https://github.com/kosmojs/kosmo/commit/c601db43402bc549ec2cd7f2fbf0fcb2e61fc84b))
* version bump ([60ee6f5](https://github.com/kosmojs/kosmo/commit/60ee6f5b4366b08f6e7828755c2b73fe91ac623e))
* version bump ([bbcd0d7](https://github.com/kosmojs/kosmo/commit/bbcd0d74504b9c39b92cf6a3bbcda2a7e382ae04))
* version bump ([885a74f](https://github.com/kosmojs/kosmo/commit/885a74f59a23edb2f3e7c8cb75e43355e02ab2d5))
* version bump ([d6e4fd9](https://github.com/kosmojs/kosmo/commit/d6e4fd95348ee3c3a9c7b236f43c8f011e935200))
* version bump ([a41034f](https://github.com/kosmojs/kosmo/commit/a41034fb0353a2f836a87fe71062898b746ba9e8))
* version bump ([d721ced](https://github.com/kosmojs/kosmo/commit/d721ced0479499b99fadade9f4c9a969bb68a145))
* version bump ([f2b6fca](https://github.com/kosmojs/kosmo/commit/f2b6fcaf4b46613dfe50ab9221b6384fb2f5186d))
* version bump ([b242d05](https://github.com/kosmojs/kosmo/commit/b242d05ad8282579a1c819c2e265005a82a380e9))
* version bump ([386b967](https://github.com/kosmojs/kosmo/commit/386b9673343e08ec0cef5c244b9f1751a17c9256))
* version bump ([96b6a8c](https://github.com/kosmojs/kosmo/commit/96b6a8c0c76058e49007fd6326803cfc86b06613))
* version bump ([5cffd27](https://github.com/kosmojs/kosmo/commit/5cffd273dbcedd548b52e319dc635d323f026e22))
* version bump ([ab64bb4](https://github.com/kosmojs/kosmo/commit/ab64bb437ed7c564f341794830fd7f6199b47963))
* version bump ([86b42e3](https://github.com/kosmojs/kosmo/commit/86b42e30e45b445d86ee8cfee75ac8cb2a49e070))
* version bump ([e2904b6](https://github.com/kosmojs/kosmo/commit/e2904b659433a846372553c564c01db7e5b97ed7))
* version bump ([db4f7e7](https://github.com/kosmojs/kosmo/commit/db4f7e70cc4070c242433104db6c67bbb9243598))
* version bump ([0c34d60](https://github.com/kosmojs/kosmo/commit/0c34d60ce666cd70a56d8ccf4ef9878efcfa785e))
* **vue-generator:** fix tests ([4b7a76d](https://github.com/kosmojs/kosmo/commit/4b7a76d93724b1e8aae95c0954a35a17d80f5c61))
* **vue-generator:** minor template update ([6121618](https://github.com/kosmojs/kosmo/commit/61216183c357af489e603450e7286b91e77e72ed))
* **workspace:** add wsbuild and test projects ([0e0bf46](https://github.com/kosmojs/kosmo/commit/0e0bf46020a0c0bdb5f966bfc412e86480c0b9b1))
