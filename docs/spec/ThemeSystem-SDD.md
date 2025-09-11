# Feature Specification: Articulate Theme System (Shared Base + Inheritance)

**Feature Branch**: `feature/theme-aurora`
**Created**: 2025-09-11
**Status**: In Progress
**Input**: Introduce an inheritance-based theme system with a Shared base theme, modern default theme (Aurora), Shared fallback in view resolution, and a documented theme contract.

## 1. Goals & Non‑Goals

- Goals
  - Replace copy-based themes with a Shared base that child themes inherit.
  - Deliver a modern default theme (Aurora) that overrides only what it needs.
  - Provide a clear Theme Contract (HTML structure, CSS naming, optional sections, metadata).
  - Add Shared fallback to view resolution; centralize layout selection via DI.
  - Keep legacy themes working (back-compat) without making them the default.

- Non-Goals
  - Full backoffice theme authoring UI (future).
  - A new asset pipeline (we keep bundleconfig.json for now).
  - Hard requirements for JS frameworks.

## 2. Scope

- In Scope
  - Shared base theme under `App_Plugins/Articulate/Themes/Shared/` with layout, partials, and minimal CSS.
  - Aurora theme under `App_Plugins/Articulate/Themes/Aurora/` with modern CSS, using Shared fallback for views.
  - View resolution fallback to Shared for Views/Partials.
  - Centralized layout selection via `IArticulateThemeResolver` in Shared `_ViewStart.cshtml`.
  - Theme metadata files: `base.json` (Shared), `theme.json` (Aurora).
  - Documentation: README in Shared; this SDD.

- Out of Scope
  - Runtime validation UI for theme contract (tracked as TODO; log/toast planned).
  - Authoring/design system packages.

## 3. Architecture & Design

- View Location
  - `ArticulateViewLocationExpander` adds theme search paths and falls back to `Themes/Shared` for Views/Partials.
  - Does not resolve layouts.

- Layout Selection
  - `Shared/_ViewStart.cshtml` injects `IArticulateThemeResolver` (scoped) and sets:
    - Active layout: `~/App_Plugins/Articulate/Themes/{theme}/_Layout.cshtml`
    - Fallback: `Shared/_Layout.cshtml`

- Theme Contract
  - HTML structure uses BEM-like classes (e.g., `.post-preview__title`, `.post-preview--featured`).
  - Optional sections (slots) exposed by Shared (and Aurora): `Header`, `Sidebar`, `Scripts`.
  - Minimal Shared CSS; theme CSS loads after Shared.
  - Metadata files:
    - Shared: `assets/base.json` with `contractVersion`, `name`, `version`, `sections`.
    - Theme: `assets/theme.json` with `extends`, `contractVersion`, `overrides`.

- Backoffice/Services
  - Theme Resolver: `IArticulateThemeResolver` + `ArticulateThemeResolver` (scoped).
  - Theme Repository: `IArticulateThemeRepository` (unchanged, future: scaffolding/new theme option).

## 4. User Scenarios & Acceptance Criteria

- Select Aurora as theme
  - Given an Articulate root, when selecting `Aurora` in theme picker, then views render with Aurora layout and styling while falling back to Shared views/partials.

- Shared fallback for unspecified views
  - Given a theme without `Post.cshtml`, when rendering a post, then Shared/Post.cshtml renders inside the theme’s layout.

- Optional sections
  - Given a view that defines `@section Sidebar { ... }`, then the content appears where the layout renders `Sidebar`.

- Comments placeholder
  - Given `EnableComments = true` and no provider override, then a neutral comments placeholder is rendered.

- Metadata present
  - Given Shared and Aurora themes, when inspecting `base.json` and `theme.json`, then metadata exists with `contractVersion`.

## 5. Implementation Status (2025-09-11)

- Shared base theme: DONE
  - Layout, `_ViewStart`, `_ViewImports`, Views: `List`, `Post`, `Author`, `Tags`
  - Partials: `Menu`, `HeaderDescription`, `FooterDescription`, `PostTags`, `Pager`, `SearchBox`, `Comments`, `PostByline`
  - CSS: `assets/css/base.css`

- Aurora theme: DONE (initial)
  - Layout, `_ViewStart`, CSS stack (reset, tokens, base, components, utilities)
  - Optional sections: `Sidebar`, `Scripts` exposed

- View resolution fallback to Shared: DONE
- Centralized layout via DI: DONE
- base.json/theme.json scaffolds: DONE (not validated at runtime yet)
- Shared README: DONE

- Next Shared Features: PLANNED
  - Prev/Next post partial (Previous/Next) with titles and links
  - TagCloud partial (uses PostTagCollection.TagCloud)
  - AuthorCard partial (compact)

- Theme Copy > New Theme scaffolding: PLANNED

## 6. Risks & Mitigations

- Inconsistent contract usage across themes — Provide clear README + examples; add contract validation (TODO).
- Breaking changes in Shared HTML — Use `contractVersion` and document changes; bump with releases.
- CSS specificity conflicts — Encourage BEM; load theme CSS after Shared.

## 7. Test Plan

- Unit/Functional
  - Controllers render `List`, `Post`, `Author`, `Tags` with active theme and fallback to Shared.
  - Shared `_ViewStart.cshtml` resolves layout via DI across routes.
  - Pager renders previous/next URLs.

- Manual QA
  - Switch theme and confirm Shared fallback works.
  - Confirm optional sections render where defined.
  - Verify metadata files exist and are well-formed JSON.

## 8. Rollout & Migration

- Legacy themes remain available; Aurora added as default candidate.
- Theme picker exposes Aurora; doc migration notes.
- No content schema changes required.

## 9. Open Questions / Clarifications

- Should we surface contract warnings in backoffice notifications or logs only?
- Should Shared provide a minimal JS bundle for common behaviors (skip-link focus, etc.)?
- Do we want a configurable set of sections per theme (beyond the three)?

## 10. Work Items & Tracking

- Completed
  - Shared base theme scaffold
  - Aurora initial theme
  - View location expander fallback
  - DI-based layout selection
  - Comments placeholder
  - SearchBox partial
  - PostByline partial
  - base.json/theme.json scaffolds
  - Shared README

- Planned
  - PrevNext partial [P1]
  - TagCloud partial [P2]
  - AuthorCard partial [P2]
  - New Theme scaffolder / modify Copy Theme [P2]
  - Contract validation (read JSON + warn) [P1]

## 11. Appendix (Key Files)

- `src/Articulate/Components/ArticulateViewLocationExpander.cs`
- `src/Articulate/Components/ArticulateComposer.cs`
- `src/Articulate/Services/IArticulateThemeResolver.cs`, `ArticulateThemeResolver.cs`
- `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Shared/`
- `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Aurora/`
- `src/Articulate.Web/bundleconfig.json`
