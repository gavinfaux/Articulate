# Articulate Shared Theme (Base)

The Shared theme provides the base views, partials, and minimal CSS that all child themes inherit.
It is intended to avoid copy-based themes and enable small, focused overrides.

## Structure
```
App_Plugins/Articulate/Themes/Shared/
├─ _Layout.cshtml           # Base layout (exposes optional sections)
├─ _ViewStart.cshtml        # Centralized layout selection via DI
├─ _ViewImports.cshtml      # Imports and tag helpers
├─ List.cshtml              # Post listing page
├─ Post.cshtml              # Single post page
├─ Author.cshtml            # Author listing page
├─ Tags.cshtml              # Tags/categories listing page
├─ Partials/
│  ├─ Menu.cshtml
│  ├─ HeaderDescription.cshtml
│  ├─ FooterDescription.cshtml
│  ├─ PostTags.cshtml
│  ├─ Pager.cshtml
│  └─ Comments.cshtml       # Neutral placeholder (override in your theme)
└─ assets/
   ├─ css/base.css
   └─ base.json             # Theme contract metadata (see below)
```

## Inheritance model
- Views and partials are resolved by the `ArticulateViewLocationExpander`.
- If a view/partial is not found in the active theme, it will fall back to `Shared/`.
- Layouts are selected in `_ViewStart.cshtml` via DI:
  - `@inject Articulate.Services.IArticulateThemeResolver ThemeResolver`
  - `Layout` is set to `~/App_Plugins/Articulate/Themes/{activeTheme}/_Layout.cshtml`, falling back to Shared when no theme is resolved.

## Optional sections (slots)
The base layout exposes optional sections that child themes or views may define:
- `@section Header { /* injected head content */ }`
- `@section Sidebar { /* sidebar content */ }`
- `@section Scripts { /* page-level scripts */ }`

These are rendered in Shared and Aurora layouts in predictable places.

## Naming conventions (Theme Contract)
Adopt BEM-like classes so child themes can target structure safely:
- Blocks: `.site-header`, `.post-list`, `.post-preview`
- Elements: `.post-preview__title`, `.site-header__brand`
- Modifiers: `.post-preview--featured`

Keep semantics, headings, and ARIA roles accessible (banner, main, region, navigation).

## Comments integration
`Partials/Comments.cshtml` is a neutral placeholder. Override it inside your theme to integrate
with a provider (e.g., Disqus, Giscus, Facebook). Shared `Post.cshtml` includes the partial only
when `Model.EnableComments` is true.

## Assets
- Shared provides minimal CSS (`assets/css/base.css`).
- Child themes may include their own CSS bundle or separate files and can load Shared CSS first.

## Theme metadata (base.json / theme.json)
- `Shared/assets/base.json` describes the base contract.
- `{Theme}/assets/theme.json` describes the child theme and its overrides.
- Field: `contractVersion` allows checking compatibility between Shared and a child theme.

Current status: runtime validation is not yet wired. See TODO in `ArticulateComposer` to
validate `contractVersion` and optionally surface a backoffice notification/log warning when
mismatched.

## How to override in your theme
- Create matching view/partial names under `App_Plugins/Articulate/Themes/{YourTheme}/`.
- Provide `_ViewStart.cshtml` (minimal: `@{ Layout = "_Layout.cshtml"; }`).
- Keep overrides minimal—only add files you actually change.
