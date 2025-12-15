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
with a provider (e.g., Disqus, Giscus). Shared `Post.cshtml` includes the partial only
when `Model.EnableComments` is true.

Additionally, Shared provides a switch-based partial: `Partials/CommentsProvider.cshtml`.

- You can select a provider via `ViewData["CommentsProvider"] = "disqus" | "giscus" | "utterances" | "hyvor" | "isso"`.
- Override `CommentsProvider.cshtml` in your theme to hardcode your provider and configure required IDs.

Example usage in a view:

```cshtml
@{
    // Choose a provider at runtime (or set this in your controller/view model)
    ViewData["CommentsProvider"] = "disqus"; // or giscus | utterances | hyvor | isso
}

@* Render the provider switch partial *@
@await Html.PartialAsync("CommentsProvider", Model)
```

Notes:

- Replace placeholder values in the partial (shortnames, repo IDs, website IDs) with your own, preferably via configuration.
- If you prefer, continue using the neutral `Comments.cshtml` and override it in your theme for a single provider.

### Config-driven vs Theme Override

- By default, `Shared/Post.cshtml` renders `Partials/CommentsProvider.cshtml` when `Model.EnableComments` is true.
- Provider selection order:
  1. `ViewData["CommentsProvider"]` (highest priority)
  2. `Articulate:DefaultCommentsProvider` from configuration
  3. Placeholder (if neither is set)
- Theme override precedence: if your theme defines `Partials/CommentsProvider.cshtml`, it overrides Shared and can hardcode a provider/config.

Example `appsettings.json` to enable Giscus via configuration (no code):

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

### Troubleshooting

General

- Ensure `Model.EnableComments` is true; `Shared/Post.cshtml` renders `CommentsProvider` by default.
- Provider precedence: `ViewData["CommentsProvider"]` → `Articulate:DefaultCommentsProvider` → placeholder.
- Theme overrides take precedence over Shared: `{Theme}/Partials/CommentsProvider.cshtml`.
- Clear caches / hard-refresh. Verify network requests. Check CSP for blocked scripts.
- Ad/tracker blockers may block certain providers (e.g., Disqus). Test without extensions.

Disqus

- `Articulate:Disqus:Shortname` must match your site shortname; loads from `https://{Shortname}.disqus.com`.
- If threads don’t attach, confirm `page.url` and `page.identifier` stability and Disqus domain settings.

Giscus

- Verify `Repo`, `RepoId`, `CategoryId`. Install the Giscus GitHub App on the repo.
- `Mapping` must match your identification method (e.g., `pathname`). Changing mapping creates new threads.

Utterances

- Verify `Repo` and that the Utterances GitHub App is installed with proper permissions.
- Check `IssueTerm`/`Label` values.

Hyvor Talk

- `Website` must be a valid numeric site ID. Set `Host` if self-hosted.
- Ensure your domain is allowed in Hyvor site settings; verify script URL loads.

Isso

- `Host` should be the Isso base URL (no trailing slash). Confirm reachability and CORS.
- Ensure embed `@host/js/embed.min.js` exists and `data-isso` points to the same host.

Other providers (examples):

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
