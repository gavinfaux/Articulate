Articulate.Api.Management – README

For build, dev, and packaging steps, please refer to the scoped AGENTS guides to avoid duplication:

- Server (this project): `src/Articulate.Api.Management/AGENTS.md`
- Backoffice client (Vite + TypeScript): `src/Articulate.Api.Management/Client/AGENTS.md`

Highlights
- Node: use the repo’s Node 24 via `.nvmrc` (`fnm` or `nvm`).
- Client commands: run inside `Client/` → `pnpm install`, `pnpm run dev`, `pnpm run build`.
- Build outputs: Vite copies bundles to `wwwroot/App_Plugins/Articulate/BackOffice` consumed by the Razor Class Library.

For broader repo guidance (multi‑TFM build scripts, WSL tips), see the root `AGENTS.md`.

