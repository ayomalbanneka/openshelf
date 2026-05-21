# Changelog

## [0.10.0](https://github.com/ayomalbanneka/openshelf/compare/v0.9.0...v0.10.0) (2026-05-21)


### Features

* add email notifications for resource publish and reject actions; enhance admin modal functionality ([78847d3](https://github.com/ayomalbanneka/openshelf/commit/78847d37fc659877033394e13315fa788350d0d4))
* add quick-save functionality for user's default reading list and bookmark status retrieval ([4bdc03a](https://github.com/ayomalbanneka/openshelf/commit/4bdc03aa0687540b35e392fa7d116a160741f9ee))
* add staff management features including invite, revoke, and list staff ([2a93720](https://github.com/ayomalbanneka/openshelf/commit/2a937201c7621fce94c77a778de3140a437062d7))
* implement reporting system for resources; add report submission and admin management features ([1151a60](https://github.com/ayomalbanneka/openshelf/commit/1151a60826e4f14d5b143c00dc64a4ebfaaf1bc3))
* **metrics:** add metric snapshotting and storage insights ([30c68a2](https://github.com/ayomalbanneka/openshelf/commit/30c68a280954023cf7d669ff40d4dde810701727))
* **rate-limiter:** implement rate limiting for authentication routes and add seed data passwords ([15761db](https://github.com/ayomalbanneka/openshelf/commit/15761db3ccf5cfbda75dc0dc9d14a83e5f0f99f4))
* **refresh-token:** add RefreshToken model and migration for managing user refresh tokens ([631d4b5](https://github.com/ayomalbanneka/openshelf/commit/631d4b5f94bc6d4b304a6251809d45df15948bf1))


### Bug Fixes

* **admin.controller:** improve formatting and add file deletion logic for resource rejection and deletion ([21e2b13](https://github.com/ayomalbanneka/openshelf/commit/21e2b13f0ff6a11faf0903f4fee09b5a4c3ff2c7))
* **api:** update deps and fix user upload, routes, and resource; add file validation util ([c62e450](https://github.com/ayomalbanneka/openshelf/commit/c62e450586f1b0665cea14ccf56f25a486467b59))
* **api:** validate uploads by magic bytes ([02652b7](https://github.com/ayomalbanneka/openshelf/commit/02652b7d1e946ff79d7e3eae13b92685aca84dd9))
* apply ipKeyGenerator for rate limits and await token generation ([ffb3c85](https://github.com/ayomalbanneka/openshelf/commit/ffb3c85c3448eca9ad04a350da4ee3d9a0b42be7))
* **auth.service:** update refreshAccessToken to handle async operations and improve token management ([516b52f](https://github.com/ayomalbanneka/openshelf/commit/516b52f4a256aac2b73ad88582e17aa9db1ef2fc))
* **auth:** add server-side logout and client token rotation ([dcee137](https://github.com/ayomalbanneka/openshelf/commit/dcee137e9f204a635e4e199e0249959f1723e91c))
* **ListDetail:** adjust icon size for empty list message ([37d2691](https://github.com/ayomalbanneka/openshelf/commit/37d269120a39eb5a3d7a4554a239c2aa7b16dda0))

## [0.9.0](https://github.com/ayomalbanneka/openshelf/compare/v0.8.1...v0.9.0) (2026-05-12)


### Features

* add reading progress tracking and UI components for user progress management ([b054c77](https://github.com/ayomalbanneka/openshelf/commit/b054c775d6ae2fbd97f44ce25579953f74872439))
* add user settings page with profile and password management, including avatar upload ([8349250](https://github.com/ayomalbanneka/openshelf/commit/8349250341576baca0b889e7ffad06b1bd233640))
* implement comments feature with API integration and UI components ([6faf9ab](https://github.com/ayomalbanneka/openshelf/commit/6faf9ab80966775a2b2caedd1c68c2380ee0962c))
* implement pagination for reading lists and clubs, enhance search functionality, and improve UI components ([42bd489](https://github.com/ayomalbanneka/openshelf/commit/42bd48927f9caeeb3ae680e3ed1b96471dd2e6af))
* integrate gooey-toast for notifications and update various components ([419f1f4](https://github.com/ayomalbanneka/openshelf/commit/419f1f4f9c17453a43cd3d02d58c4ae4b476fd2d))
* **metrics:** add Prometheus metrics and dashboard metrics endpoint ([06d9815](https://github.com/ayomalbanneka/openshelf/commit/06d9815dcce75155e72a07eadad26c0660ab88c3))
* **tags:** enhance UI with icons, improve styling, and add refresh button ([e51db68](https://github.com/ayomalbanneka/openshelf/commit/e51db685fa31b75e58287a4e7eb0a677e681c510))


### Bug Fixes

* **admin-sidebar:** update sidebar styles with new color variables and improved hover effects ([6fba193](https://github.com/ayomalbanneka/openshelf/commit/6fba1936e34332bebeb3bb373512b4c88d3d4bfe))
* update icon color in UploadForm based on active state ([362e01c](https://github.com/ayomalbanneka/openshelf/commit/362e01c0df0bb59a8ee501eb2f60bcc5278c81f2))

## [0.8.1](https://github.com/ayomalbanneka/openshelf/compare/v0.8.0...v0.8.1) (2026-05-06)


### Bug Fixes

* **labels:** add missing spaces in label definitions ([ae774b9](https://github.com/ayomalbanneka/openshelf/commit/ae774b980cd5063d330382578fe6a15d4d816e84))
* **labels:** add missing spaces in label definitions ([1c44a3c](https://github.com/ayomalbanneka/openshelf/commit/1c44a3ce10da715818be6fe0627f2dbc71d6f6c8))
* **script:** fix spacing in label definitions ([2fd4eae](https://github.com/ayomalbanneka/openshelf/commit/2fd4eae64ecc3458f4181e4a2469ebcc2ee918f3))

## [0.8.0](https://github.com/ayomalbanneka/openshelf/compare/v0.7.0...v0.8.0) (2026-05-02)


### Features

* add email verification feature with 2FA for admin login ([e7fa6fd](https://github.com/ayomalbanneka/openshelf/commit/e7fa6fd6a4aca13c8f03a34cc3f5c4dcf0bf85ee))
* **admin:** enhance admin panel with categories, clubs, resources, and tags management ([7dded2b](https://github.com/ayomalbanneka/openshelf/commit/7dded2b0811ffc22dcf15374670c72b273892cd4))
* update resource icons and improve UI components ([9d1d4c3](https://github.com/ayomalbanneka/openshelf/commit/9d1d4c37396c4272ea564cd286f96a53a333bc5b))


### Bug Fixes

* adjust width classes for layout and reset code link ([4c9c472](https://github.com/ayomalbanneka/openshelf/commit/4c9c4726692a7145208701068d86e5ca4a6ac7e5))

## [0.7.0](https://github.com/ayomalbanneka/openshelf/compare/v0.6.0...v0.7.0) (2026-04-26)


### Features

* **admin:** implement admin dashboard with stats and resource moderation features ([06dbe77](https://github.com/ayomalbanneka/openshelf/commit/06dbe770d46a1e69832248b3e74f95b4faa27855))
* **admin:** implement admin dashboard with stats and resource moderation features ([76e7d25](https://github.com/ayomalbanneka/openshelf/commit/76e7d2520906343cf34821a07545212e0cef3b48))

## [0.6.0](https://github.com/ayomalbanneka/openshelf/compare/v0.5.0...v0.6.0) (2026-04-21)


### Features

* **tags,search:** add tag create/list endpoints and enhance search with filters and highlighting ([#24](https://github.com/ayomalbanneka/openshelf/issues/24)) ([bc884d2](https://github.com/ayomalbanneka/openshelf/commit/bc884d2e9e00ad05d69842579f72f86af767956b))

## [0.5.0](https://github.com/ayomalbanneka/openshelf/compare/v0.4.0...v0.5.0) (2026-04-18)


### Features

* **resources:** add lesson-based course uploads and improve media handling ([#19](https://github.com/ayomalbanneka/openshelf/issues/19)) ([f01f162](https://github.com/ayomalbanneka/openshelf/commit/f01f1625c6651fd1a3d2a3fa7260914d12da04f5))

## [0.4.0](https://github.com/ayomalbanneka/openshelf/compare/v0.3.1...v0.4.0) (2026-04-13)


### Features

* introduce reading list system and club management functionality ([#17](https://github.com/ayomalbanneka/openshelf/issues/17)) ([4a1c540](https://github.com/ayomalbanneka/openshelf/commit/4a1c540a6f4165259e90cf42e450cc6905438fe5))

## [0.3.1](https://github.com/ayomalbanneka/openshelf/compare/v0.3.0...v0.3.1) (2026-04-11)


### Bug Fixes

* **auth:** prevent hydration mismatch and ensure user redirection ([#14](https://github.com/ayomalbanneka/openshelf/issues/14)) ([5cdc0e2](https://github.com/ayomalbanneka/openshelf/commit/5cdc0e2b94a5bc10736fa06ef645a7efc02bf39e))

## [0.3.0](https://github.com/ayomalbanneka/openshelf/compare/v0.2.0...v0.3.0) (2026-04-09)


### Features

* Add resource reviews, bookmarks, and upload system with categories ([#11](https://github.com/ayomalbanneka/openshelf/issues/11)) ([986ab7d](https://github.com/ayomalbanneka/openshelf/commit/986ab7d27c4d70d2b87c96c64e36621724105d42))

## [0.2.0](https://github.com/ayomalbanneka/openshelf/compare/v0.1.0...v0.2.0) (2026-04-07)


### Features

* add S3 file upload, landing UI refactor, and resource browsing features ([f6b3c5d](https://github.com/ayomalbanneka/openshelf/commit/f6b3c5dfef7d4e9d426e5f0be16a350139c94ca2))
* integrate AWS S3 for file storage and upload functionality. ([7914da0](https://github.com/ayomalbanneka/openshelf/commit/7914da00f23feeee2f431de643f5e2e8fce69ba8))
* integrate AWS S3 for file storage and upload functionality. ([b711bd7](https://github.com/ayomalbanneka/openshelf/commit/b711bd7c5e66bc72d672c274942eb3b3fc25cd15))
* **web:** refactor landing components and add browse functionality ([6f108c5](https://github.com/ayomalbanneka/openshelf/commit/6f108c57acdc122ad56a93ee33b922c3cdefec21))

## 0.1.0 (2026-04-06)


### Features

* **auth:** add login/register pages with validated forms and persisted auth state ([5085d46](https://github.com/ayomalbanneka/openshelf/commit/5085d46c44fe98dd7ea7f86efaa3ed7eccc5bd75))
* **auth:** add login/register pages with validated forms and persisted auth state ([1aa1886](https://github.com/ayomalbanneka/openshelf/commit/1aa18860485c4552e068b08801bacb83ea21be45))
* **resource:** implement CRUD operations for resources and add cookie-parser middleware ([a55be59](https://github.com/ayomalbanneka/openshelf/commit/a55be5992d6f36bb376d7aaac591ba1450693274))
* **resource:** implement CRUD operations for resources and add cookie-parser middleware ([a4862d6](https://github.com/ayomalbanneka/openshelf/commit/a4862d64ba71662a093ae398303407a53f639349))
