# Backoffice Client (Vite + TypeScript) - Scoped Guide

Scope: applies to `src/Articulate.Api.Management/Client/**`.

## Environment

- Node 22 (`.nvmrc`), pnpm 10.17+. Quick start:
  - `nvm use` (default)
  - already on `fnm`? `fnm use` works too
  - `corepack enable && corepack prepare pnpm@10.17.0 --activate`

## Commands

- Install: `pnpm install`
- Dev: `pnpm run dev`
- Build: `pnpm run build` (emits to server `wwwroot/...` and themes/MarkdownEditor `dist/`)
- Release build: `pnpm run build:release`
- Lint: `pnpm run lint`
- Type-check: `pnpm run check`
- Regenerate API client (after C# API changes): `pnpm run generate:api`

## Conventions

- TypeScript, ES2020 target, 2-space indent, single quotes, Prettier formatting; ESLint enforced.
- Keep bundles small; avoid heavy deps. Prefer dynamic imports where sensible.
- Copy: concise and task-focused; avoid filler. Use meaningful titles/descriptions for discoverability in backoffice UIs.

## Validation Checklist

- Build succeeds; outputs updated in server `wwwroot` and RCL `dist/`.
- Lint and type-check clean.
