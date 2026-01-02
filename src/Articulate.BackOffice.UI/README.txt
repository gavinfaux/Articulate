Articulate.Api.Management Client Quickstart
-------------------------------------------

Requirements
- Node.js 24+ with corepack/pnpm 10+

Getting started
- cd src/Articulate.Api.Management/Client
- pnpm install    # or already done via `mise run init`
- pnpm run dev   # Vite HMR while running the test site
- pnpm run watch # optional file watcher build
- pnpm run build:release # production bundles (minified + version stamped); pnpm run build for dev-mode bundles

Outputs
- BackOffice emits to ../wwwroot/App_Plugins/Articulate/BackOffice
- Additionally bundles Themes/MarkdownEditor src assets to dist folders in Articulate.Web (via custom Vite plugins).

More detail
- Readme: ../../README.md
- API & general docs: https://github.com/Shazwazza/Articulate/wiki
