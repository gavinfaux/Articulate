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
  - `Shared/Partials/BaseHeadAssets.cshtml` (e.g., `assets/css/base.css`)
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
- SEO/Meta: call existing helpers (`@Model.MetaTags()`, `@Html.SocialMetaTags(Model)`), and include RSS/OpenSearch if desired.

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
  - [ ] Breadcrumbs (optional pattern) with accessibility notes
  - [ ] Featured post card variant (usage + BEM naming)

- Assets/Accessibility
  - [ ] A11y patterns: skip-link, focus outlines, landmarks (header/nav/main/aside/footer)
  - [ ] Print stylesheet stub and guidance
  - [ ] Dark mode token example (opt-in) and override notes

- Metadata/Feeds
  - [ ] RSS link placement and styling example (from helpers)
  - [ ] OpenSearch link placement example (from helpers)

- Documentation
  - [ ] Short usage snippets embedded near each partial/view (in-code comments)
  - [ ] README section in Shared describing how to override each component in a theme

## 14. Metadata JSON Examples

Use these as minimal examples for the Shared base and Aurora theme metadata files.

Shared `base.json` (at `Themes/Shared/assets/base.json`):

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
