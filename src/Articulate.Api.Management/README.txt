Articulate.Api.Management Client Quickstart
-------------------------------------------

Requirements
- Preferred: install mise. From repo root:
  - pwsh: `pwsh -NoLogo -File ./mise-activate.ps1`
  - bash/zsh: `eval "$(mise activate bash)"`
  - then `mise install` and `mise run init` (installs pinned node/pnpm/nbgv and client deps).
- Without mise: Node.js 24+ with corepack/pnpm 10+

Getting started
- cd src/Articulate.Api.Management/Client
- pnpm install    # or already done via `mise run init`
- pnpm run dev   # Vite HMR while running the test site
- pnpm run watch # optional file watcher build
- pnpm run build:release # production bundles (minified + version stamped); pnpm run build for dev-mode bundles

Outputs
- Bundles emit to ../wwwroot/App_Plugins/Articulate/BackOffice and Themes inside Articulate.StaticAssets (via custom Vite plugins).

More detail
- Release notes: ../../README.md
- API & general docs: https://github.com/Shazwazza/Articulate/wiki
