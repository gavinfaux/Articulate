# Feature Specification: Articulate Theme System (Shared Base + Inheritance)

**Feature Branch**: `feature/theme-aurora`
**Created**: 2025-09-11
**Status**: In Progress (Phase 1 complete)
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
  - Theme-first asset partials: `HeadAssets.cshtml` and `FootAssets.cshtml` with Shared base partials `BaseHeadAssets.cshtml` and `BaseFootAssets.cshtml`.
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
  - Assets model (implemented):
    - Shared provides minimal base CSS/JS via `BaseHeadAssets.cshtml` and `BaseFootAssets.cshtml`.
    - Layouts call `HeadAssets` and `FootAssets` (theme-first then Shared fallback).
    - Themes can either extend Shared (include base partials) or fully replace (omit base partials). Aurora extends by default.
  - Metadata files:
    - Shared: `assets/base.json` with `contractVersion`, `name`, `version`, `sections`.
    - Theme: `assets/theme.json` with `extends`, `contractVersion`, `overrides`.

- Backoffice/Services
  - Theme Resolver: `IArticulateThemeResolver` + `ArticulateThemeResolver` (scoped).
  - Theme Repository: `IArticulateThemeRepository` (unchanged, future: scaffolding/new theme option).

### 3.1 View Location Provider (implementation)

`DefaultArticulateViewLocationProvider` returns a theme-first, Shared-fallback ordered set of locations. It emits both `Views/{0}.cshtml` and `Partials/{0}.cshtml` variants per root, always using forward slashes.

Order (top to bottom):

1. User theme (virtual)
   - `~/Views/Articulate/{theme}/{0}.cshtml`
   - `~/Views/Articulate/{theme}/Views/{0}.cshtml`
   - `~/Views/Articulate/{theme}/Partials/{0}.cshtml`
2. Legacy user theme (virtual)
   - `~/Views/ArticulateThemes/{theme}/{0}.cshtml`
   - `~/Views/ArticulateThemes/{theme}/Views/{0}.cshtml`
   - `~/Views/ArticulateThemes/{theme}/Partials/{0}.cshtml`
3. System theme (virtual)
   - `~/App_Plugins/Articulate/Themes/{theme}/{0}.cshtml`
   - `~/App_Plugins/Articulate/Themes/{theme}/Views/{0}.cshtml`
   - `~/App_Plugins/Articulate/Themes/{theme}/Partials/{0}.cshtml`
4. System theme (content-root)
   - `wwwroot/App_Plugins/Articulate/Themes/{theme}/{0}.cshtml`
   - `wwwroot/App_Plugins/Articulate/Themes/{theme}/Views/{0}.cshtml`
   - `wwwroot/App_Plugins/Articulate/Themes/{theme}/Partials/{0}.cshtml`
5. Shared base fallback (system virtual)
   - `~/App_Plugins/Articulate/Themes/Shared/{0}.cshtml`
   - `~/App_Plugins/Articulate/Themes/Shared/Views/{0}.cshtml`
   - `~/App_Plugins/Articulate/Themes/Shared/Partials/{0}.cshtml`
6. Shared base fallback (system content-root)
   - `wwwroot/App_Plugins/Articulate/Themes/Shared/{0}.cshtml`
   - `wwwroot/App_Plugins/Articulate/Themes/Shared/Views/{0}.cshtml`
   - `wwwroot/App_Plugins/Articulate/Themes/Shared/Partials/{0}.cshtml`
7. Markdown editor (virtual, content-root)
   - `~/App_Plugins/Articulate/MarkdownEditor/{0}.cshtml`
   - `wwwroot/App_Plugins/Articulate/MarkdownEditor/{0}.cshtml`

Notes:

- Paths are built with `PathHelper.JoinVirtual` to ensure forward slashes. Tests enforce no `\`.
- Provider can be replaced via DI (`IArticulateViewLocationProvider`).

### 3.2 View Location Expander (behavior)

`ArticulateViewLocationExpander` integrates with Razor to prepend theme locations:

- `PopulateValues`:
  - Resolves theme via `IArticulateThemeResolver` (DI) and stores it in `context.Values["articulate-theme"]`.
  - Also puts the theme in `HttpContext.Items["ThemeName"]` as a fallback for environments where `Values` is null (unit tests).
- `ExpandViewLocations`:
  - Reads the theme from `context.Values` (or `HttpContext.Items["ThemeName"]`).
  - Requests `IArticulateViewLocationProvider` from DI and prepends returned locations to the existing `viewLocations`.
  - If no theme is set, returns the original `viewLocations` unchanged.

Caching: Using `context.Values` ensures Razor view engine cache keys vary by theme.

### 3.3 Composer / DI / Options

Registrations in `ArticulateComposer`:

- `IArticulateViewLocationProvider` => `DefaultArticulateViewLocationProvider` (singleton)
- Razor view engine configuration:
  - `services.Configure<RazorViewEngineOptions>(o => o.ViewLocationExpanders.Add(new ArticulateViewLocationExpander()));`
- Theme resolver and repository:
  - `IArticulateThemeResolver` (transient), `IArticulateThemeRepository` (singleton)
- Options:
  - `services.AddOptions<ArticulateOptions>().BindConfiguration("Articulate");` (binds default comments provider and provider-specific settings from configuration)
- Misc routing/pipeline configuration kept as-is; no `BuildServiceProvider` used.

## 4. User Scenarios & Acceptance Criteria

- Select Aurora as theme
  - Given an Articulate root, when selecting `Aurora` in theme picker, then views render with Aurora layout and styling while falling back to Shared views/partials.

- Shared fallback for unspecified views
  - Given a theme without `Post.cshtml`, when rendering a post, then Shared/Post.cshtml renders inside the theme’s layout.

- Optional sections
  - Given a view that defines `@section Sidebar { ... }`, then the content appears where the layout renders `Sidebar`.

- Comments placeholder
  - Given `EnableComments = true` and no provider override, then a neutral comments placeholder is rendered.
  - Potential providers (future adapters): Disqus, giscus, utterances, Hyvor Talk, Isso.

- Metadata present
  - Given Shared and Aurora themes, when inspecting `base.json` and `theme.json`, then metadata exists with `contractVersion`.

## 5. Implementation Status (2025-09-13)

- Shared base theme: DONE
  - Layout, `_ViewStart`, `_ViewImports`, Views: `List`, `Post`, `Author`, `Tags`
  - Partials: `Menu`, `HeaderDescription`, `FooterDescription`, `PostTags`, `Pager`, `SearchBox`, `Comments`, `PostByline`
  - CSS: `assets/css/base.css`

- Aurora theme: DONE (initial)
  - Layout, `_ViewStart`, CSS stack (reset, tokens, base, components, utilities)
  - Optional sections: `Sidebar`, `Scripts` exposed

- Asset inclusion model: DONE
  - Shared layout now delegates to `HeadAssets`/`FootAssets` partials (theme-first, Shared fallback).
  - New base partials in Shared: `Partials/BaseHeadAssets.cshtml`, `Partials/BaseFootAssets.cshtml`.
  - Shared fallbacks: `Partials/HeadAssets.cshtml` includes `BaseHeadAssets`; `Partials/FootAssets.cshtml` includes `BaseFootAssets`.
  - Aurora overrides:
    - `Aurora/Partials/HeadAssets.cshtml` includes `BaseHeadAssets` then Aurora CSS (extend-by-default).
    - `Aurora/Partials/FootAssets.cshtml` includes `BaseFootAssets` by default (removable to replace).
  - Comments provider: `Shared/Post.cshtml` renders `CommentsProvider` by default under `Model.EnableComments`; themes can set `ViewData["CommentsProvider"]` or override the partial.
  - Config-driven comments: `ArticulateOptions` now includes `DefaultCommentsProvider` and provider-specific settings (Disqus/Giscus/Utterances/Hyvor/Isso) bound via `services.AddOptions<ArticulateOptions>().BindConfiguration("Articulate")`. Shared `CommentsProvider` reads these to render real embeds when configured. Aurora ships a Giscus example override.

- View resolution fallback to Shared: DONE
- Centralized layout via DI: DONE
- base.json/theme.json scaffolds: DONE (not validated at runtime yet)
- Shared README: DONE

- Next Shared Features: DONE
  - Prev/Next post partial (Previous/Next) with titles and links (Shared/Partials/PrevNext.cshtml, integrated in Shared/Post.cshtml)
  - TagCloud partial (uses PostTagCollection.TagCloud) (Shared/Partials/TagCloud.cshtml, integrated in Shared/Tags.cshtml)
  - AuthorCard partial (compact) (Shared/Partials/AuthorCard.cshtml, integrated in Shared/Post.cshtml)

- Theme Copy > New Theme scaffolding: PLANNED

## 6. Risks & Mitigations

- Inconsistent contract usage across themes — Provide clear README + examples; add contract validation (TODO).
- Breaking changes in Shared HTML — Use `contractVersion` and document changes; bump with releases.
- CSS specificity conflicts — Encourage BEM; load theme CSS after Shared.

## 7. Test Plan

- Unit/Functional (implemented)
  - View location provider: verifies theme-first ordering, presence of `Views/` and `Partials/` across user/legacy/system/shared roots, forward slashes, `{0}.cshtml` suffix, and no duplicates.
  - Asset partial resolution (simulation): theme-first resolution for `Partials/HeadAssets.cshtml` with fallback to Shared.
  - Layout resolution (simulation): theme layout first, fallback to Shared when missing.
  - Expander: theme propagation and provider locations prepended to defaults.
  - Pager renders previous/next URLs.

- Manual QA
  - Switch theme and confirm Shared fallback works.
  - Confirm optional sections render where defined.
  - Verify metadata files exist and are well-formed JSON.
  - Accessibility checks (WCAG 2.2 AA baseline):
    - Keyboard: all interactive controls reachable in logical order; focus visibly indicated; no keyboard traps.
    - Skip link: visible on focus and jumps to `main`.
    - Landmarks/headings: semantic regions present; heading levels logical and unique page `h1` where appropriate.
    - Contrast: body text ≥ 4.5:1; large text/icons ≥ 3:1; links clearly distinguished beyond color.
    - Motion: `prefers-reduced-motion` respected (animations/transitions disabled or minimized).
    - Media/tables: images have meaningful `alt` (or empty when decorative); tables use `th[scope]`, `caption` where helpful, and scroll on small screens.
    - Assistive tech spot-check: NVDA/VoiceOver reading order and link/button labels (including Share links) make sense.
  - Suggested tools: Axe DevTools browser extension, Lighthouse, NVDA (Windows) or VoiceOver (macOS/iOS), and manual keyboard testing.
  - Structured data validation: Google Rich Results Test and Schema.org validator for posts/list/home; verify no duplicates and correct required fields.

- Deferred (optional integration)
  - Lightweight ASP.NET Core integration tests to request a page and assert presence of theme vs Shared assets were explored but deferred to keep the suite lean. Can be introduced later behind a stable test website route.

## 8. Rollout & Migration

- Legacy themes remain available; Aurora added as default candidate.
- Theme picker exposes Aurora; doc migration notes.
- No content schema changes required.

## 9. Open Questions / Clarifications

- Should we surface contract warnings in backoffice notifications or logs only?
- Should Shared provide a minimal JS bundle for common behaviors (skip-link focus, etc.)?
- Do we want a configurable set of sections per theme (beyond the three)?
- Path handling in ViewLocationExpander: prefer virtual path join (with '/') over Path.Combine to avoid OS-specific separators and confusion between virtual vs filesystem paths.

## 10. Work Items & Tracking

- Completed
  - Shared base theme scaffold
  - Aurora initial theme
  - View location expander fallback
  - DI-based layout selection
  - Comments placeholder
  - SearchBox partial
  - PostByline partial
  - PrevNext partial (Shared) and integration
  - TagCloud partial (Shared) and integration
  - AuthorCard partial (Shared) and integration
  - base.json/theme.json scaffolds
  - Shared README

- Planned
  - Path handling improvements in ViewLocationExpander and ArticulateConstants.Paths [P1]
  - New Theme scaffolder / modify Copy Theme [P2]
  - Contract validation (read JSON + warn) [P1]
  - Optional: integration tests for layout/asset rendering via `WebApplicationFactory` [P3]

### 10.1 Path Handling Improvements (Plan)

- Problem: `ArticulateViewLocationExpander` mixes virtual paths (e.g., `~/Views/...`) and filesystem-like joins via `Path.Combine`, which can introduce OS-specific separators and ambiguity.
- Plan:
  - Introduce a small helper to join virtual path segments with forward slashes (e.g., `string JoinVirtual(params string[] parts)`).
  - Use it in the expander to build view location formats; avoid `Path.Combine` for virtual paths.
  - Clarify `ArticulateConstants.Paths` names to distinguish virtual vs content-root-relative paths, and document each.
  - Add tests that assert produced view locations use forward slashes and include expected theme/Shared fallbacks.

## 11. Appendix (Key Files)

- `src/Articulate/Components/ArticulateViewLocationExpander.cs`
- `src/Articulate/Components/ArticulateComposer.cs`
- `src/Articulate/Services/IArticulateThemeResolver.cs`, `ArticulateThemeResolver.cs`
- `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Shared/`
- `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Aurora/`
- `src/Articulate.Web/bundleconfig.json`

## 12. Theme Author Guide (KISS)

Use this section to build or customize a theme with minimal friction.

1. File structure (Aurora example)

- Base directory: `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Aurora/`
- Recommended layout: `Aurora/_Layout.cshtml` (adds `<body class="aurora">` and your chrome)
- Optional view overrides: put view files under `Aurora/Views/` (e.g., `Views/List.cshtml`). Missing views fall back to `Themes/Shared`.
- Assets: place under `Aurora/assets/` (e.g., `assets/css/*.css`, `assets/js/*.js`)
- Partials (assets): `Aurora/Partials/HeadAssets.cshtml`, `Aurora/Partials/FootAssets.cshtml`

1. Asset loading: extend vs replace

- Shared provides base assets via:
  - `Shared/Partials/BaseHeadAssets.cshtml` (includes vendor Pico and base CSS)
  - `Shared/Partials/BaseFootAssets.cshtml` (e.g., `assets/js/base.js`)
- Layouts include `HeadAssets` and `FootAssets` using theme-first resolution. In your theme:
  - Extend Shared (default): include base partials first, then theme assets

    ```cshtml
    @* Aurora/Partials/HeadAssets.cshtml *@
    @await Html.PartialAsync("BaseHeadAssets")
    <link href="~/App_Plugins/Articulate/Themes/Aurora/assets/css/reset.css" rel="stylesheet" asp-append-version="true" />
    <link href="~/App_Plugins/Articulate/Themes/Aurora/assets/css/tokens.css" rel="stylesheet" asp-append-version="true" />
    <link href="~/App_Plugins/Articulate/Themes/Aurora/assets/css/base.css" rel="stylesheet" asp-append-version="true" />
    <link href="~/App_Plugins/Articulate/Themes/Aurora/assets/css/components.css" rel="stylesheet" asp-append-version="true" />
    <link href="~/App_Plugins/Articulate/Themes/Aurora/assets/css/utilities.css" rel="stylesheet" asp-append-version="true" />
    ```

    ```cshtml
    @* Aurora/Partials/FootAssets.cshtml *@
    @await Html.PartialAsync("BaseFootAssets")
    @* <script src="~/App_Plugins/Articulate/Themes/Aurora/assets/js/app.js" asp-append-version="true"></script> *@
    ```

  - Replace Shared: omit base partials in your HeadAssets/FootAssets

1. Layout guidance

- Put global chrome in `Aurora/_Layout.cshtml` and keep Shared views generic.
- Expose optional sections where needed: `@RenderSection("Header", false)`, `@RenderSection("Sidebar", false)`, `@RenderSection("Scripts", false)`.

1. Referencing assets

- Always use virtual paths with `~` and `asp-append-version="true"` for cache busting:
  - `~/App_Plugins/Articulate/Themes/Aurora/assets/css/base.css`
- Avoid `Path.Combine` for virtual paths; keep forward slashes.

1. Metadata (optional for now)

- Shared: `assets/base.json`
- Theme: `assets/theme.json` (e.g., `{ "extends": "Shared", "contractVersion": "1" }`)

1. Conventions

- CSS: BEM-like naming for predictable overrides (`.block__elem--mod`).
- Accessibility: include a skip-link in layout, ensure focus states.
- SEO/Meta: retain and call existing helpers — `@Model.MetaTags()`, `@Html.SocialMetaTags(Model)`, `@Model.AdvertiseWeblogApi()`, `@Model.RssFeed()`, `@Model.RenderOpenSearch()` — from the Shared layout/head. See Schema.org JSON-LD guidance below.

1. UX & Accessibility (WCAG 2.2 AA)

- Goals: optimize reading experience and meet WCAG 2.2 AA for the Shared/base theme.
- Structure
  - Use semantic landmarks (`header`, `nav`, `main`, `aside`, `footer`).
  - Maintain a logical heading hierarchy (one `h1` per page region; descending order).
  - Provide a visible "Skip to content" link targeting the main region.
- Keyboard
  - All interactive controls are reachable/focusable in a logical order.
  - Visible, high-contrast focus indicators (do not remove outlines).
  - Menus, pagination, and share links usable with keyboard only.
- Contrast & color
  - Minimum contrast: 4.5:1 for body text; 3:1 for large text/icons.
  - Links differentiated by more than color where possible (underline or additional cue).
- Motion & preferences
  - Respect `prefers-reduced-motion`; avoid unnecessary animations/parallax.
  - Honor user/browser preferences; keep defaults subtle.
- Media & data
  - Images use meaningful `alt` text; decorative images use empty `alt`.
  - Use `figure/figcaption` where captions are needed.
  - Tables: use `th` with `scope`, include `caption` where helpful, and allow horizontal scroll on small screens.
- Readability
  - Comfortable measure for prose (target ~60–80ch), generous line-height (≈1.6–1.8), and clear spacing between paragraphs.

1. Fonts & Typography (system first)

- Default: use Pico’s system font stacks for performance, consistency, and zero dependency.
- Variables to set in Shared `articulate-base.css` so themes can override easily:

```css
/* Themes/Shared/assets/css/articulate-base.css */
:root {
  /* Sans-serif system stack */
  --pico-font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif;
  /* Monospace system stack */
  --pico-font-family-monospace: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
```

## 15. Manual QA Checklist (Runbook)

Use this quick runbook during manual verification. Aim for a 15–25 minute pass.

- Keyboard-only
  - From page top, press Tab: skip link becomes visible. Enter should jump focus to `<main id="main-content">`.
  - Continue tabbing: header nav, search input/button, post body links, pager, share button/links, footer.
  - Confirm visible focus rings and logical order with no traps.

- Responsiveness
  - Viewports: ~360px, 768px, 1024px, 1280px+.
  - Check `.container` layout on Menu, SearchBox, AuthorCard, Pager, Share.
  - AuthorCard: 1-column on mobile, 2-column at ≥768px.
  - Post tables scroll horizontally on small screens.

- Structured data
  - Exactly one `<script type="application/ld+json">` in head.
  - Validate with Google Rich Results Test:
    - Post page: `BlogPosting` + `WebSite` present.
    - List/home: `Blog` + `WebSite` (with `SearchAction` if search is available).

- A11y tooling
  - Run Axe DevTools or Lighthouse: check for contrast, names/labels, landmarks, keyboard.
  - Quick NVDA/VoiceOver spot checks for headings, landmarks, and control names.

- Reduced motion
  - With OS/browser “Reduce motion” enabled, verify transitions/animations are minimal/disabled.

- Share
  - Click Share button on a mobile-capable browser: native share sheet appears (if supported).
  - Fallback links (X, Facebook, LinkedIn, Reddit, Email) open with correctly encoded URL/title.

- Nav current state
  - On Home/Archive/Authors, the respective link has `aria-current="page"` and is visibly distinguished (underline).

- Pages to test
  - Home/List (Shared/List.cshtml), Post (Shared/Post.cshtml), Authors (Shared/Author.cshtml), Archive (Shared/List.cshtml filtered), and an error page if easily reachable (Shared/401.cshtml).

## 16. Remaining Tasks — Summary

- Optional enhancements
  - Dark mode token block via `prefers-color-scheme: dark` in `articulate-base.css`.
  - Breadcrumbs component example and guidance.
  - Print stylesheet stub and usage guidance.
  - CDN alternative documentation note (experimentation only).

- Theming & docs
  - Shared README describing how to override each component.
  - Short usage notes/comments near partials for theme authors.

- Coverage & backlog
  - Expand Shared examples (archives variants, search results styling) as needed.
  - Optional integration tests later (layout/asset rendering) via `WebApplicationFactory`.
  - Backoffice UX surfacing for theme selection/validation.
  - Re-enable Aurora overrides and add Aurora-specific polish once Shared base stabilizes.

## 17. BEM Contract and Deprecation Policy

This appendix freezes the Shared BEM class contract and defines how we deprecate/remove selectors safely. Pico classes are additive and do not replace the BEM contract in this rollout.

### 17.1 Canonical BEM selectors (Shared)

- Layout
  - `.site-header`, `.site-footer`, `.site-title`, `.site-description`, `.site-logo`
  - `.site-nav` (block for primary navigation)
  - `.copyright`
- Content
  - `.post-list`, `.post-preview`, `.post-title`, `.post-meta`, `.post-image`, `.post-body`
  - `.prev-next`, `.prev-next__item`, `.prev-next__link`
  - `.pager` (list pagination)
  - `.author-card`, `.author-card__media`, `.author-card__avatar`, `.author-card__body`, `.author-card__name`, `.author-card__bio`
  - `.search`, `.articulate-search` (SearchBox wrapper)
  - `.share`, `.share__links`
  - `.tags`, `.tag-list`, `.tag-cloud`
- Utilities and helpers
  - `.skip-link`, `.sr-only`, `.sr-only-focusable`, `.prose`

Notes:

- Themes may target these BEM selectors reliably. Pico classes (e.g., `.container`, `.grid`, `.secondary`) are layered on top and can be adopted by themes, but are not a replacement for BEM selectors in this phase.
- We will prefer semantic HTML and Pico where it reduces custom CSS, but BEM remains the compatibility layer.

### 17.2 Deprecation policy for selectors

1. Criteria for deprecation
   - Selector is unused in Shared and in all bundled themes (Aurora, Material, Phantom, VAPOR).
   - No JS behavior relies on it; not used for accessibility semantics.
   - An equivalent Pico pattern covers the use case, or the selector is redundant.
2. Process
   - Mark as deprecated in code comments (near the rule in `assets/css/base.css`) and list in this SDD.
   - Provide migration guidance and an example replacement (e.g., adopt Pico class X or element Y).
   - Announce deprecation in `BREAKING_CHANGES.md` with a one-release grace period.
   - Remove after the grace period and update the SDD.
3. Audit & tooling
   - Before deprecation, run a cross-theme search for usages of the selector.
   - Optionally add a CI check (grep-based) to block removals if occurrences still exist.

### 17.3 Initial audit plan (post-QA)

- Inventory selectors in Shared and in all bundled themes.
- Identify selectors where Pico fully replaces the styling or where no theme depends on them.
- Propose a small set of deprecations with migration notes; track in an issue and SDD appendix.

- Theme override examples (optional):

```css
/* Use a custom sans-serif (self-host or CDN as the theme decides) */
@font-face {
  font-family: "Inter";
  src: url("../fonts/Inter-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

:root { --pico-font-family: "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }

/* Prefer a serif for long-form content (theme choice) */
.article-content { font-family: Georgia, ui-serif, "Times New Roman", Times, serif; }

/* Custom monospace */
:root { --pico-font-family-monospace: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
```

- Guidance:
  - Avoid bundling web font files in Shared to keep the base light; let themes opt in.
  - Prefer self-hosted fonts in themes for performance/CSP; always use `font-display: swap`.
  - Keep good Unicode coverage in mind if targeting non-Latin scripts.

1. Prose typography (scoped)

- Provide a scoped wrapper (e.g., `.prose`) for article content to get consistent typography without affecting layout/nav.
- Recommended styles (theme-friendly, adjustable via tokens): headings scale, readable line-height, styled blockquotes, code/pre, tables and lists.
- Usage: wrap the rendered body inside `Shared/Post.cshtml` with `<div class="prose">` (theme can override or extend).

Example starter (in `Themes/Shared/assets/css/articulate-base.css`):

```css
.prose { line-height: 1.7; color: var(--pico-color); }
.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { line-height: 1.2; margin: 1.5em 0 0.6em; }
.prose h1 { font-size: clamp(2rem, 3vw, 2.5rem); }
.prose h2 { font-size: clamp(1.7rem, 2.5vw, 2rem); }
.prose h3 { font-size: clamp(1.4rem, 2vw, 1.6rem); }
.prose p, .prose ul, .prose ol, .prose blockquote, .prose pre, .prose table { margin: 1em 0; }
.prose ul, .prose ol { padding-left: 1.25em; }
.prose blockquote { padding-left: 1em; border-left: 4px solid var(--pico-muted-border-color, #e6e6e6); color: var(--pico-muted-color); }
.prose code, .prose kbd { font-family: var(--pico-font-family-monospace); background: var(--pico-muted-background, #f6f6f6); padding: 0.1em 0.3em; border-radius: 0.3rem; }
.prose pre { overflow: auto; padding: 1em; border-radius: 0.5rem; background: var(--pico-muted-background, #f6f6f6); }
.prose table { width: 100%; border-collapse: collapse; }
.prose th, .prose td { padding: 0.6em 0.8em; border-bottom: 1px solid var(--pico-muted-border-color, #e6e6e6); }
```

1. Theme colors (grayscale, light-first)

- Shared defaults are neutral (black/white/gray) for broad compatibility; themes add accents.
- Start with light mode only; add dark later as an override (low risk, variable-only change).

Example tokens (in `Themes/Shared/assets/css/articulate-base.css`):

```css
:root {
  --pico-background-color: #ffffff;
  --pico-color: #111111;
  --pico-muted-color: #666666;
  --pico-muted-border-color: #e6e6e6;
  --pico-muted-background: #f6f6f6;
  --pico-primary: #111111;
  --pico-primary-inverse: #ffffff;
  --pico-border-radius: 6px; /* optional tweak */
}
```

1. Legacy mapping (legacy → Shared/Aurora)

- Vapor `Partials/PostList.cshtml` → Covered by `Shared/List.cshtml`. Themes can create their own `PostList` include if desired.
- Material `Partials/AuthorInfo.cshtml` → Covered by `Shared/Partials/AuthorCard.cshtml` and `PostByline.cshtml`.
- Material `Partials/PostImageHeader.cshtml`, `Partials/TitleTile.cshtml` → Theme-specific; use in Aurora or custom themes as needed.
- Mini `Partials/Share.cshtml` → Provide `Shared/Partials/Share.cshtml` (planned) as a minimal, accessible share block; themes can override.
- Phantom `Partials/Sidebar.cshtml` → Prefer `@section Sidebar` in layouts; provide a sample in docs if helpful.

1. Social share endpoints (reference)

- X (Twitter): `https://twitter.com/intent/tweet?text={title}&url={url}` (also works with `https://x.com/intent/tweet`)
- Facebook: `https://www.facebook.com/sharer/sharer.php?u={url}`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={url}`
- Reddit: `https://www.reddit.com/submit?url={url}&title={title}`
- Hacker News: `https://news.ycombinator.com/submitlink?u={url}&t={title}`
- WhatsApp: `https://api.whatsapp.com/send?text={title}%20{url}`
- Telegram: `https://t.me/share/url?url={url}&text={title}`
- Email: `mailto:?subject={title}&body={title}%20-%20{url}`
- Bluesky: `https://bsky.app/intent/compose?text={title}%20{url}`
- Mastodon: No global endpoint; prefer the Web Share API or allow users to choose their instance.

1. Share block strategy (progressive enhancement)

- Use the Web Share API when available (`navigator.share({ title, text, url })`) to open the native share sheet (best on mobile). Requires HTTPS and a user gesture.
- Fallback to an accessible list of explicit share links when the API is unavailable or the user opts out. Default networks: X, Facebook, LinkedIn, Reddit, Email. Optionally include WhatsApp/Telegram.
- Compute and use the canonical absolute URL for the current post; URL-encode `title` and `url` parameters. Rely on Open Graph/Twitter meta for preview richness.
- Accessibility: clear link/button labels, keyboard focusable, `rel="noopener noreferrer"`, `target="_blank"` for external links; consider `sr-only` text for context.
- Theming: keep BEM selectors as the contract and apply minimal Pico classes for presentation. Themes can override the partial to add/change networks.
- Configuration: allow a simple toggle/list of networks via `ViewData` or future options.
- Placement: include below the post body in `Shared/Post.cshtml`.

1. Schema.org structured data (JSON-LD)

- Keep existing helpers: `@Model.MetaTags()`, `@Html.SocialMetaTags(Model)`, `@Model.AdvertiseWeblogApi()`, `@Model.RssFeed()`, `@Model.RenderOpenSearch()`.
- Add a Shared partial `Partials/StructuredData.cshtml` to emit JSON-LD based on context:
  - On posts: `BlogPosting` (or `Article`) with `headline`, `description`, `author`, `datePublished`, `dateModified`, `mainEntityOfPage`, `image` (if present), `publisher` (Organization + logo).
  - On lists/home: `Blog` (site-level), and optionally `CollectionPage` of posts; include `BreadcrumbList` where applicable.
  - Site-level: `WebSite` with `SearchAction` if site search is available; OpenSearch link remains via helper.
- Requirements:
  - Always use absolute canonical URLs; ensure dates are ISO 8601.
  - Only one JSON-LD block per type to avoid duplicates (theme overrides should not re-emit Shared’s block).
  - Place JSON-LD in `<head>` via `HeadAssets` to ensure consistent inclusion.

- Implementation recommendation: Partial + helper methods
  - Keep `Partials/StructuredData.cshtml` as the orchestration/serialization layer to remain themable and override-friendly.
  - Extract small building-block helpers to `PublishedContentExtensions` for reuse and testability:
    - URL helpers: `ToAbsolute(this string, HttpRequest)`, `GetCanonicalUrl(this IMasterModel, HttpRequest)`
    - Nodes: `GetPublisherOrganizationNode(this IMasterModel, HttpRequest)`, `GetWebSiteNode(this IMasterModel, HttpRequest)` (include `SearchAction` when available)
    - Page types: `GetBlogPostingNode(this PostModel, HttpRequest)`, `GetBlogNode(this IMasterModel, HttpRequest)`
  - Themes overriding the partial can call the same helpers, maintaining consistency while permitting customization.

- Backlog note:
  - Add the above helper methods to `PublishedContentExtensions` and refactor `Partials/StructuredData.cshtml` to use them.

1. Quick test checklist

- Switch theme to `Aurora` and load a Shared view (e.g., List) to verify:
  - Theme layout is used (check `<body class="aurora">` if present in your layout).
  - Network tab shows both Shared and Aurora CSS when extending; only Aurora when replacing.
- If assets don’t load, confirm file paths and that your `HeadAssets`/`FootAssets` partials exist in the theme.

1. Comments (config vs theme override)

- Shared renders `Partials/CommentsProvider.cshtml` by default from `Shared/Post.cshtml` when `Model.EnableComments` is true.
- Provider selection order:
  - `ViewData["CommentsProvider"]` (highest priority)
  - `Articulate:DefaultCommentsProvider` from configuration
  - Placeholder (if neither is set)
- Theme override precedence: if your theme defines `Partials/CommentsProvider.cshtml`, it overrides Shared (and can hardcode a provider/config).

Example `appsettings.json` to enable Giscus via config (without code):

```json
{
  "Articulate": {
    "DefaultCommentsProvider": "giscus",
    "Giscus": {
      "Repo": "OWNER/REPO",
      "RepoId": "REPO_ID",
      "Category": "General",
      "CategoryId": "CATEGORY_ID",
      "Mapping": "pathname",
      "Theme": "light",
      "Lang": "en",
      "ReactionsEnabled": true,
      "EmitMetadata": false,
      "InputPosition": "bottom"
    }
  }
}
```

- Razor-to-JS tips:
  - Avoid inline Razor inside JS strings (e.g., `"https://@Shortname.disqus.com"`).
  - Prefer assigning Razor-evaluated values to JS variables (e.g., `const shortname = "@(Options?.Disqus?.Shortname)";`).
  - For numbers, emit as raw (e.g., `const siteId = @(Options?.Hyvor?.Website ?? 0);`) or attach via `data-*` attributes and read from the DOM.

1. Provider options reference

| Provider   | Required fields                    | Optional fields                                                                                 | Notes |
|------------|------------------------------------|--------------------------------------------------------------------------------------------------|-------|
| Disqus     | `Shortname`                         | —                                                                                                | Uses site shortname subdomain `https://{Shortname}.disqus.com` |
| Giscus     | `Repo`, `RepoId`, `CategoryId`     | `Category`, `Mapping` (default `pathname`), `Theme` (default `light`), `Lang` (default `en`), `ReactionsEnabled` (default `true`), `EmitMetadata` (default `false`), `InputPosition` (default `bottom`) | Category string optional if `CategoryId` provided |
| Utterances | `Repo`                              | `IssueTerm` (default `pathname`), `Label` (default `comment`), `Theme` (default `github-light`)  | — |
| Hyvor Talk | `Website`                           | `Host` (default `https://talk.hyvor.com`)                                                        | `Website` is numeric site ID |
| Isso       | `Host`                              | —                                                                                                | Self-hosted Isso root URL |

1. Turnkey config snippets (copy/paste)

Disqus

```json
{
  "Articulate": {
    "DefaultCommentsProvider": "disqus",
    "Disqus": {
      "Shortname": "YOUR_SHORTNAME"
    }
  }
}
```

Utterances

```json
{
  "Articulate": {
    "DefaultCommentsProvider": "utterances",
    "Utterances": {
      "Repo": "OWNER/REPO",
      "IssueTerm": "pathname",
      "Label": "comment",
      "Theme": "github-light"
    }
  }
}
```

Hyvor Talk

```json
{
  "Articulate": {
    "DefaultCommentsProvider": "hyvor",
    "Hyvor": {
      "Website": 12345,
      "Host": "https://talk.hyvor.com"
    }
  }
}
```

Isso

```json
{
  "Articulate": {
    "DefaultCommentsProvider": "isso",
    "Isso": {
      "Host": "https://your-isso-host"
    }
  }
}
```

1. Troubleshooting (comments setup)

- General
  - Ensure `Model.EnableComments` is true; `Shared/Post.cshtml` renders `CommentsProvider` by default.
  - Provider precedence: `ViewData["CommentsProvider"]` → `Articulate:DefaultCommentsProvider` → placeholder. Theme overrides (`{Theme}/Partials/CommentsProvider.cshtml`) take precedence over Shared.
  - Clear caches / hard-refresh. Use `asp-append-version` on assets and verify updated network requests.
  - Check browser console/network for 404/403 and CSP violations. Allow scripts to load from provider CDNs/domains.
  - Ad/tracker blockers can block some providers (e.g., Disqus). Test with extensions disabled or in a clean profile.

- Disqus
  - Verify `Articulate:Disqus:Shortname` matches your site’s shortname. Disqus loads from `https://{Shortname}.disqus.com`.
  - If threads don’t attach, confirm `disqus_config.page.url` and `page.identifier` are stable and match Disqus settings (domain whitelisting, canonical URL).

- Giscus
  - Repo must be public (or the Giscus app installed for private). Check `Repo`, `RepoId`, `CategoryId` values.
  - Ensure the Giscus GitHub App is installed on the target repo, and the chosen `CategoryId` exists.
  - `Mapping` should match how you identify pages (e.g., `pathname`). Changing mapping creates new threads.

- Utterances
  - Repo must be public (or app installed). Verify `Repo` and `IssueTerm`/`Label`.
  - Check that the Utterances GitHub App is installed and has permissions on the repo.

- Hyvor Talk
  - `Website` must be a valid numeric site ID. If self-hosting, set `Host`.
  - Confirm your domain is added in Hyvor site settings. Verify the embed script URL loads.

- Isso
  - `Host` should be the Isso base URL (no trailing slash). Ensure the instance is reachable from the browser and CORS is configured if needed.
  - Check the embed script path `@host/js/embed.min.js` and that `data-isso` points to the same host.

References

- Shared partial: `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Shared/Partials/CommentsProvider.cshtml`
- Aurora override example (Giscus): `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Aurora/Partials/CommentsProvider.cshtml`

## 13. Backlog

- [P1] Contract validation (read `base.json` / `theme.json` and warn on mismatch or missing files)
- [P1] Path handling improvements in `ArticulateViewLocationExpander` and `ArticulateConstants.Paths`
- [P2] New theme scaffolder (template + README, with HeadAssets/FootAssets stubs)
- [P3] Optional integration tests for layout/asset rendering via `WebApplicationFactory`
- [P2] Backoffice UX for theme selection/validation surfacing (notifications/logs)
- [P1] Expand Shared theme to cover all Articulate features with usage examples (docs + sample partials/views)
- [P1] Structured data: implement and document `Partials/StructuredData.cshtml` and mapping for posts/list/site

- [P1] Shared: introduce `Partials/Share.cshtml` with accessible buttons/links and integrate guidance into `Post.cshtml`
- [P1] Docs: add social share endpoints reference and examples (Theme Author Guide)
- [P2] Docs: optional `Sidebar` sample using `@section Sidebar`

### 13.1 Shared Theme Coverage — Checklist (P1)

- Views/Pages
  - [ ] Archives (year/month) listing view and link surfacing from List/Post
  - [ ] Search results page (usage example and styling guidance)
  - [ ] Author listing page (aggregate) with usage example
  - [ ] Category listing page (if applicable) with usage example
  - [ ] Tags listing enhancements (usage snippets beyond TagCloud)

- Partials/Components
  - [ ] Comments provider example block (switchable) with docs — providers to consider: Disqus, giscus, utterances, Hyvor Talk, Isso
  - [ ] Pagination pattern variants (numeric vs. prev/next emphasis)
  - [ ] Share partial (`Partials/Share.cshtml`) with multi-network endpoints and accessibility notes
  - [ ] Breadcrumbs (optional pattern) with accessibility notes
  - [ ] Featured post card variant (usage + BEM naming)

- Assets/Accessibility
  - [ ] A11y patterns: skip-link, focus outlines, landmarks (header/nav/main/aside/footer)
  - [ ] Print stylesheet stub and guidance
  - [ ] Dark mode token example (opt-in) and override notes
  - [ ] WCAG 2.2 AA baseline review complete (keyboard operability, contrast, reduced motion, semantics, headings)

- Metadata/Feeds
  - [ ] RSS link placement and styling example (from helpers)
  - [ ] OpenSearch link placement example (from helpers)

- Documentation
  - [ ] Short usage snippets embedded near each partial/view (in-code comments)
  - [ ] README section in Shared describing how to override each component in a theme

## 13.2 Pico CSS Integration — Suggested Next Steps

- Decision
  - Adopt Pico CSS class-based build as the foundation for the Shared base theme.
  - No mandatory build step for theme authors; we ship a pinned, prebuilt vendor CSS locally.

- Distribution strategy
  - Vendor file (pinned, local): `Themes/Shared/assets/vendor/pico.min.css` (prefer local over CDN for stability/CSP).
  - Base overrides: `Themes/Shared/assets/css/articulate-base.css` to set CSS variables (colors, radius, spacing, typography) and minimal tokens.
  - Document an optional CDN link for quick trials, but default to local vendor file.
  - Note: We use `Themes/Shared/assets/css/pico.min.css` (under `css/`) in this implementation.

- Asset inclusion (order)
  1. `pico.min.css` (vendor)
  2. `articulate-base.css` (variables/tokens)
  3. Shared base CSS (existing `assets/css/base.css`, if retained) or migrate essentials into `articulate-base.css`
  4. Theme CSS (Aurora and others) — loaded after Shared to allow overrides

- Implementation notes
  - Update `Shared/Partials/BaseHeadAssets.cshtml` to include the vendor and base overrides in the order above.
  - Theme-first resolution remains: themes can extend (include base partials) or replace.
  - Include order (Option A) for CSS in Shared base:
    1. `Themes/Shared/assets/css/pico.min.css`
    2. `Themes/Shared/assets/css/articulate-base.css` (tokens, `.prose`, motion, responsive helpers)
    3. `Themes/Shared/assets/css/base.css` (temporary Shared components layer; later `shared-components.css`)
  - Token mapping (progressively refactor `base.css` to use Pico variables):
    - `--border` → `--pico-muted-border-color`
    - `--muted` → `--pico-muted-color`
    - `--link` → consider using default link styling or map to `--pico-primary` if a neutral accent is desired
  - Recent polish (implemented):
    - AuthorCard uses a two-column grid at ≥768px; single column on small screens.
    - Pager and Share spacing tightened; Prev/Next navigation spacing added.
    - `.sr-only` utility added in `articulate-base.css` for accessible, visually hidden text.

- Minimal markup updates in Shared (additive, non-breaking)
  - `Partials/Menu.cshtml`: use `.container` for layout; apply Pico button/link classes where appropriate.
  - `Partials/Pager.cshtml`: use `.grid` and button classes for previous/next.
  - `Partials/AuthorCard.cshtml`: wrap in `.card`; use `.grid` for avatar/text alignment; `.button` for profile links.
  - `Partials/SearchBox.cshtml`: apply Pico form classes to input/button.
  - Preserve existing BEM classes as the contract; Pico classes are additive and opt-in.

- Theming/overrides (for theme authors)
  - No build tools required: include vendor/base via `HeadAssets` (extend-by-default) and override CSS variables in theme CSS.
  - Keep theme CSS loaded after Shared to ensure predictable overrides.

- Optional maintainer-only build (future, not required for rollout)
  - If needed, a tiny build step can subset Pico or add namespacing; compiled CSS would be committed and shipped.

- Acceptance criteria
  - Shared renders with Pico baseline without breaking Aurora visuals.
  - Minimal Shared partial updates compile and pass existing tests.
  - Theme Author Guide updated with Pico variable override examples.
  - Legacy themes remain unaffected if they don’t include Shared assets.
  - Shared renders responsively across mobile (<576), tablet (≥768), desktop (≥1024), and wide (≥1280) breakpoints.
  - Shared/base meets WCAG 2.2 AA baseline: skip-link present, semantic landmarks, visible focus indicators, sufficient color contrast, keyboard operability, reduced motion respected.
  - Structured data present where applicable: `BlogPosting` on posts, `Blog`/`CollectionPage` on lists/home, and `WebSite` where search is available; no duplicate JSON-LD blocks.

- Risks / mitigations
  - Specificity conflicts: mitigate by load order (theme CSS last) and keeping Pico classes additive.
  - Third‑party widgets: class-based Pico is opt-in, minimizing unintended styling.

- Tasks
  - [P1] Add vendor: `Themes/Shared/assets/css/pico.min.css` — completed
  - [P1] Add variables file: `Themes/Shared/assets/css/articulate-base.css` — completed
  - [P1] Update `Shared/Partials/BaseHeadAssets.cshtml` to include vendor + base overrides — completed
  - [P1] Apply minimal Pico classes to Shared partials: `Menu`, `Pager`, `AuthorCard`, `SearchBox` — completed
  - [P1] Create `Shared/Partials/Share.cshtml` implementing Web Share API with fallback social links; integrate into `Shared/Post.cshtml` — completed
  - [P1] Update docs: Theme Author Guide section on Pico variables and class usage — completed
  - [P1] Add Theme Author Guide subsection documenting the Share block strategy (Web Share API + fallback links) — completed
  - [P3] Document CDN alternative as an optional approach for experimentation
  - [P1] Add `.prose` typography styles in `articulate-base.css` and wrap post body in `Shared/Post.cshtml` — completed
  - [P1] Set light grayscale tokens in `articulate-base.css` (no dark yet) — completed
  - [P1] Add minimal transitions and `prefers-reduced-motion` handling in `articulate-base.css` — completed
  - [P1] Temporarily disable Aurora overrides to rely on Shared during base work (comment/rename `Aurora/Partials/HeadAssets.cshtml` and `FootAssets.cshtml`, avoid view overrides) — completed
  - [P1] Refactor `Themes/Shared/assets/css/base.css` to use Pico variables per token mapping and remove redundant rules over time — completed
  - [P1] Add a skip-link in `Shared/_Layout.cshtml` targeting the main region (e.g., `#main`); ensure it is visible on focus — completed
  - [P1] Ensure semantic landmarks in Shared layout (`header`, `nav`, `main`, `aside`, `footer`) and a logical heading hierarchy — completed
  - [P1] Provide visible focus indicator styles in `articulate-base.css` (do not remove outlines) — completed
  - [P1] Differentiate links by more than color in content areas (e.g., underline in `.prose`) — completed
  - [P1] Tables: add guidance and styles for `th[scope]`, optional `caption`, and horizontal scroll on small screens — completed
  - [P1] Add `Shared/Partials/StructuredData.cshtml` and include from `HeadAssets` to emit Schema.org JSON-LD per page type — completed

- Execution plan (ordered)

  1. Use the existing branch; do not create a new branch.
  2. Temporarily disable Aurora overrides to rely on Shared: comment/rename `Aurora/Partials/HeadAssets.cshtml` and `FootAssets.cshtml` (or make them pass-through to base), and avoid view/partial overrides.
  3. Pin Pico version and add `Themes/Shared/assets/vendor/pico.min.css`.
  4. Create `Themes/Shared/assets/css/articulate-base.css` with:
     - Font variables (system stacks) and token surface.
     - Light grayscale tokens (background, text, muted, borders, primary).
     - `.prose` scoped typography styles for article content.
     - Minimal transitions and `prefers-reduced-motion` rules.
  5. Update `Shared/Partials/BaseHeadAssets.cshtml` to load vendor first, then base overrides.
  6. Apply minimal Pico classes to Shared partials: `Menu`, `Pager`, `AuthorCard`, `SearchBox` (keep BEM selectors intact).
  7. Add `Shared/Partials/Share.cshtml` (Web Share API + fallback links) and include it from `Shared/Post.cshtml`.
  8. Update Theme Author Guide with:
     - Pico variables/overrides, Fonts & Typography (system first), Prose usage, Share strategy, Social share endpoints.
  9. (Optional, later) Add dark mode token block using `prefers-color-scheme: dark`.
  10. (Optional) Document CDN alternative in the docs.
  11. Manual QA pass (next task):
      - Keyboard-only: verify skip link, focus order, visible focus, operable controls.
      - Responsiveness: small/tablet/desktop/wide; AuthorCard grid; tables scroll.
      - Structured data: validate JSON-LD on post and list/home via Google Rich Results Test.
      - A11y tooling: Axe/Lighthouse quick scan; NVDA/VoiceOver spot checks for labels and landmarks.

1. Conditional styling with Pico (approach)

- We use the standard class-based build (`pico.min.css`). Conditional behavior is implemented with regular CSS (media queries, user-preference queries), flipping Pico CSS variables (tokens) inside those conditions.
- Light/dark: use `prefers-color-scheme` later by overriding `:root` tokens; optional manual toggle via `[data-theme]` if a theme needs it.
- Reduced motion: use `prefers-reduced-motion` to minimize/disable transitions and animations.
- Responsiveness: mobile-first media queries and Pico’s fluid components; add minimal queries where needed.
- If a theme needs to isolate Pico styles to a subtree, it may opt into Pico’s conditional build (`pico.conditional.min.css`) and wrap markup in `.pico` — not the default for Shared.

  Notes

- Consider a scoped “prose/classless” variant for article body as a separate, optional enhancement (would require a small scoping/build step); not part of the initial rollout.

## 14. Metadata JSON Examples

Use these as minimal examples for the Shared base and Aurora theme metadata files.

```json
{
  "name": "Shared",
  "contractVersion": 1
}
```

Aurora `theme.json` (at `Themes/Aurora/assets/theme.json`):

```json
{
  "name": "Aurora",
  "extends": "Shared",
  "contractVersion": 1
}
```

## 15. Appendix: Theme Resources

- Aurora README:
  - `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Aurora/README.md`
- Shared base (partials, assets):
  - `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Shared/`
  - Key files:
    - `Partials/BaseHeadAssets.cshtml`
    - `Partials/BaseFootAssets.cshtml`
    - `Partials/HeadAssets.cshtml`
    - `Partials/FootAssets.cshtml`
    - `Partials/CommentsProvider.cshtml`
    - `Post.cshtml` (renders `CommentsProvider` under `Model.EnableComments`)

## 16. Contract Versioning Policy

The theme contract is versioned via the numeric `contractVersion` in `base.json` (Shared) and `theme.json` (themes).

- When to bump (breaking):
  - Changes to required HTML structure/class names used by contract (e.g., BEM blocks/elements).
  - Adding/removing required sections or changing their semantics.
  - Removing or renaming Shared partials that themes are encouraged to use/override.

- Non-breaking (no bump):
  - Purely additive optional sections or partials.
  - Internal CSS tweaks that do not change contract selectors or semantics.
  - Documentation/README updates.

- Guidance for theme authors:
