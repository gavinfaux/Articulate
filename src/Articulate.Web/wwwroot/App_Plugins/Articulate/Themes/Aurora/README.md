# Aurora Theme

Aurora is the modern default theme for Articulate. It builds on the Shared base theme and overrides selectively. This README explains how to extend or replace Shared assets and where to place your files.

## Structure

- Layout: `_Layout.cshtml`
- Views override (optional): `Views/` (e.g., `Views/List.cshtml`)
- Asset partials:
  - `Partials/HeadAssets.cshtml` (CSS, fonts, meta)
  - `Partials/FootAssets.cshtml` (JS)
- Source assets:
  - `src/css/` — `reset.css`, `tokens.css`, `base.css`, `components.css`, `utilities.css`
  - `src/js/` — add your bundles as needed

## Asset strategy: extend vs replace

The Shared theme provides minimal base assets via:

- `Shared/Partials/BaseHeadAssets.cshtml` (CSS)
- `Shared/Partials/BaseFootAssets.cshtml` (JS)

Layouts call `HeadAssets` and `FootAssets`. Resolution is theme-first, then Shared fallback.

- Extend Shared (default): include base partials first, then Aurora assets.

```cshtml
@* Partials/HeadAssets.cshtml *@
@await Html.PartialAsync("BaseHeadAssets")
<link href="~/App_Plugins/Articulate/Themes/Aurora/src/css/reset.css" rel="stylesheet" asp-append-version="true" />
<link href="~/App_Plugins/Articulate/Themes/Aurora/src/css/tokens.css" rel="stylesheet" asp-append-version="true" />
<link href="~/App_Plugins/Articulate/Themes/Aurora/src/css/base.css" rel="stylesheet" asp-append-version="true" />
<link href="~/App_Plugins/Articulate/Themes/Aurora/src/css/components.css" rel="stylesheet" asp-append-version="true" />
<link href="~/App_Plugins/Articulate/Themes/Aurora/src/css/utilities.css" rel="stylesheet" asp-append-version="true" />
```

```cshtml
@* Partials/FootAssets.cshtml *@
@await Html.PartialAsync("BaseFootAssets")
@* <script src="~/App_Plugins/Articulate/Themes/Aurora/src/js/app.js" asp-append-version="true"></script> *@
```

- Replace Shared (full override): omit `BaseHeadAssets`/`BaseFootAssets` includes and provide only Aurora assets.

## Layout and sections

Expose optional sections where needed to keep views flexible:

```cshtml
@RenderSection("Header", required: false)
@RenderSection("Sidebar", required: false)
@RenderSection("Scripts", required: false)
```

Keep Shared views generic; place Aurora-specific chrome in `_Layout.cshtml`.

## Referencing assets

- Always use virtual paths with `~` and `asp-append-version="true"` for cache busting, e.g.:
  - `~/App_Plugins/Articulate/Themes/Aurora/src/css/base.css`
- Keep forward slashes for virtual paths (avoid `Path.Combine`).

## Conventions

- CSS naming: BEM-like (`.block__elem--mod`) for stable overrides.
- Accessibility: include a skip-link, maintain focus styles, sufficient contrast.
- SEO/meta: call existing helpers (`@Model.MetaTags()`, `@Html.SocialMetaTags(Model)`), consider RSS/OpenSearch.

## Comments

Aurora ships with a theme override for comments at `Partials/CommentsProvider.cshtml` (Giscus example).
You have two ways to enable comments:

1. Config-driven (Shared partial)

- Remove/rename `Aurora/Partials/CommentsProvider.cshtml` so the Shared partial is used.
- Set configuration in `appsettings.json` under the `Articulate` section.

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

2. Theme override (default here)

- Keep `Aurora/Partials/CommentsProvider.cshtml` and replace placeholders (`OWNER/REPO`, `REPO_ID`, `CATEGORY_ID`) with your values.
- This override takes precedence over Shared and ignores config sub-options in `Articulate:Giscus`.

For provider configuration examples beyond Giscus (Disqus, Utterances, Hyvor Talk, Isso), see:

- `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/Shared/README.md` (Config-driven vs Theme Override section)

## Quick verification

1. Activate the Aurora theme.
2. Load a page that uses a Shared view (e.g., List) and confirm:
   - Aurora layout is applied (if you add a sentinel like `<body class="aurora">`).
   - Network shows Shared + Aurora CSS when extending; only Aurora CSS when replacing.
3. If assets don’t load, verify:
   - `Partials/HeadAssets.cshtml` and/or `Partials/FootAssets.cshtml` exist in Aurora.
   - Paths are correct and use `asp-append-version`.
