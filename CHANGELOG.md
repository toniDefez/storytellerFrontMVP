# [1.7.0](https://github.com/toniDefez/storytellerFrontMVP/compare/v1.6.0...v1.7.0) (2026-03-25)


### Bug Fixes

* **location:** cleanup drag timer on unmount, reset EdgeFormDialog state on open ([cef29f1](https://github.com/toniDefez/storytellerFrontMVP/commit/cef29f12d9263e0c8dd3be445159f1d02e0a82c0))


### Features

* **location:** API types + useLocationGraph hook ([5c0a134](https://github.com/toniDefez/storytellerFrontMVP/commit/5c0a13459225ddfc1cf6f7d7db16353996e4d9e7))
* **location:** i18n keys for location graph ([7c6b907](https://github.com/toniDefez/storytellerFrontMVP/commit/7c6b90769c229071f913c65b2407c3bdc671aa65))
* **location:** LocationGraphCanvas + tab switcher in WorldDetailPage ([655a215](https://github.com/toniDefez/storytellerFrontMVP/commit/655a2155848ac4ce496a198c653dee58903f1d1c))
* **location:** LocationNode + custom floating edges ([4543131](https://github.com/toniDefez/storytellerFrontMVP/commit/4543131e81a0dc63b7c27331af3017c3836e6612))
* **location:** node + edge detail panels + edge form dialog ([e650482](https://github.com/toniDefez/storytellerFrontMVP/commit/e65048210ae338004350cf1be45211165a12abb8))
* replace world creation wizard with single-form generate endpoint ([b0dfcb5](https://github.com/toniDefez/storytellerFrontMVP/commit/b0dfcb5a8b2d5c462cc2359162e60fec0448c3b1))

# [1.6.0](https://github.com/toniDefez/storytellerFrontMVP/compare/v1.5.0...v1.6.0) (2026-03-23)


### Features

* add collapsed state and animation infrastructure to MainLayout ([fe77f0c](https://github.com/toniDefez/storytellerFrontMVP/commit/fe77f0c4b52ec642ff62737061f6e920a75fe65e))
* add i18n keys for sidebar collapse toggle ([0ae7900](https://github.com/toniDefez/storytellerFrontMVP/commit/0ae7900daf5c958aa7c831792c2e95c449fed4f4))
* collapsible icon-rail sidebar with localStorage persistence ([5eed08a](https://github.com/toniDefez/storytellerFrontMVP/commit/5eed08a33f5f5567a2f459ee8f78d72551bd0619))
* update Sidebar component for collapsed state ([599b05a](https://github.com/toniDefez/storytellerFrontMVP/commit/599b05a6f96800d0a5e28511c14abe2349f71848))

# [1.5.0](https://github.com/toniDefez/storytellerFrontMVP/compare/v1.4.0...v1.5.0) (2026-03-23)


### Bug Fixes

* **world:** show fallback premises when AI suggestions unavailable ([b7ef531](https://github.com/toniDefez/storytellerFrontMVP/commit/b7ef531235343c1fb898acacde0bb653474ecd69))


### Features

* **world-graph:** apply chat-created nodes to graph state ([911e067](https://github.com/toniDefez/storytellerFrontMVP/commit/911e067ea7d99f8cf862aa22bcdbf5a77b66d5e6))
* **world-graph:** integrate side panel into canvas, add node edit support ([5b7cb8f](https://github.com/toniDefez/storytellerFrontMVP/commit/5b7cb8f46a7c6a5567ae5135ac71d952610e0870))
* **world:** AI-generated premise suggestions on create page ([54145ad](https://github.com/toniDefez/storytellerFrontMVP/commit/54145ad1fdd282c3b84154a80964ffb910d61591))

# [1.4.0](https://github.com/toniDefez/storytellerFrontMVP/compare/v1.3.0...v1.4.0) (2026-03-23)


### Features

* editorial WorldCard layout + graph visual polish ([54a36ce](https://github.com/toniDefez/storytellerFrontMVP/commit/54a36cef1a89f2d179b347ffb341ba0c4769165c))

# [1.3.0](https://github.com/toniDefez/storytellerFrontMVP/compare/v1.2.0...v1.3.0) (2026-03-23)


### Features

* bold UX pass — auth split-screen, world cards as portals, graph layout cleanup ([e3abf9d](https://github.com/toniDefez/storytellerFrontMVP/commit/e3abf9d8ee49fe1521cdd9f7c28586f6407be21a))

# [1.2.0](https://github.com/toniDefez/storytellerFrontMVP/compare/v1.1.0...v1.2.0) (2026-03-23)


### Features

* add + button and hint badge to TreeNode ([f8d3c27](https://github.com/toniDefez/storytellerFrontMVP/commit/f8d3c27f484cd746fa0af85266b16c434a705fa0))
* add graph i18n strings and GraphActionsContext ([e6e9bd8](https://github.com/toniDefez/storytellerFrontMVP/commit/e6e9bd8f525b395a754e43f3d7c73c84282c742c))
* add NodeContextMenu overlay ([9863371](https://github.com/toniDefez/storytellerFrontMVP/commit/9863371df1f37860a9fb16a17909881a899fc04d))
* add NodeFormDialog for manual node creation ([1c65654](https://github.com/toniDefez/storytellerFrontMVP/commit/1c656542f391b5d3e61180c7277ecbdc26a3bb31))
* full-screen graph canvas in create and edit world flows ([a322e96](https://github.com/toniDefez/storytellerFrontMVP/commit/a322e964b744e9299adf9b74e60439e33e770bdf))
* wire GraphActionsContext, NodeFormDialog, NodeContextMenu in CausalTreeCanvas ([b1c552e](https://github.com/toniDefez/storytellerFrontMVP/commit/b1c552e923a8e464cee86a5e48693a778a98fd82))
* wire manual node controls to CreateWorldPage and WorldDetailPage ([eb1089e](https://github.com/toniDefez/storytellerFrontMVP/commit/eb1089e1ce28a043a3a8aeafab0ccc3a711a3708))

# [1.1.0](https://github.com/toniDefez/storytellerFrontMVP/compare/v1.0.1...v1.1.0) (2026-03-22)


### Bug Fixes

* sync ReactFlow state with external nodes via useEffect ([d843e23](https://github.com/toniDefez/storytellerFrontMVP/commit/d843e23e45d7f7fd6befa5a748de313f99ad0eed))


### Features

* **ui:** add world name input to create world form ([2d3c1c8](https://github.com/toniDefez/storytellerFrontMVP/commit/2d3c1c86a963746039ad59d3b13990046d8efaf5))

## [1.0.1](https://github.com/toniDefez/storytellerFrontMVP/compare/v1.0.0...v1.0.1) (2026-03-22)


### Bug Fixes

* trigger initial semantic release ([e109bb7](https://github.com/toniDefez/storytellerFrontMVP/commit/e109bb7b1c947b07003ff1e56639d9f3fc009d17))
