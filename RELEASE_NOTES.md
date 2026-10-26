# Articulate Release Notes

## Version 8.0.0

### Breaking changes for v8.0.0

> [!WARNING]
> Requires Umbraco 18.2.1 through 18.x on .NET 10.
>
> Articulate 8 is a separate package line from Articulate 7 because Umbraco 18 APIs and backoffice extension points are not binary-compatible.

- Adds the Articulate 8 package line for Umbraco 18.
- Includes the functional changes listed under [Version 7.0.0](#version-700).

## Version 7.0.0

### Breaking changes for v7.0.0

> [!WARNING]
> Requires Umbraco 17.7.1 through 17.x on .NET 10. Umbraco 16 is not supported.
>
> Articulate 7 is a separate package line from Articulate 6 because Umbraco 17 APIs and backoffice extension points are not binary-compatible.

- Adds the Articulate 7 package line for Umbraco 17.
- Adds lane-specific OpenAPI, Swagger, and generated backoffice API support.
- Adds the Umbraco 17 backoffice client lane and updated Markdown editor assets.
- Requires the standalone Markdown editor OpenID client to be public and use PKCE; client secrets are not supported.
- Open Live Writer and MetaWeblog routes are disabled by default because this desktop integration uses direct username/password authentication rather than the current Back Office OAuth/2FA flow. Set `Articulate:EnableMetaWeblog` to `true` and restart the application to keep using them.
- When converting from TinyMCE, the upgrade applies Articulate's default TipTap settings.
  - Existing custom TipTap configuration is preserved.
- Organizes the built-in post URL-alias and import-ID properties into SEO and System property groups during migration.
- Adds Giscus as an alternative comment provider. Configure it in
  appsettings.json under Articulate:Comments:Giscus, or per blog with four
  giscus* properties. Themes can ship a giscus.css stylesheet that Articulate
  serves to the giscus iframe.
- BlogML export records each post's archive. Import restores posts to the matching archive under the chosen blog root, creating it if needed. Posts without archive markers use the blog's first archive, or a new default archive if none exists.
- For posts carrying the Articulate archive marker, BlogML re-import matches import IDs across all archives under the selected blog root. Matching posts stay in their current archive and are updated when overwrite is enabled.
- If no import ID matches, BlogML import can match an exact slug in the target archive only when the existing post has no stored import ID. With overwrite disabled, that post is left untouched and no copy is created. With overwrite enabled, that post is updated and receives the incoming import ID. This can replace manually created content.
- New BlogML archives retain available source archive keys. If a new post's archive cannot be identified safely, import reports a clear error instead of silently merging distinct source archives. Name-only markers cannot distinguish same-named source archives.
- BlogML import preserves existing post URLs, handles duplicate IDs within one file and accepts root-only URLs without aborting later posts.
- Newly created BlogML archives are published when "publish all" is enabled.
- BlogML export includes only categories referenced by exported posts and writes its generation time in UTC.
- BlogML rich-text export writes HTML markup instead of stored editor JSON. Embedded blocks are not rendered.
- BlogML import and export show an error when the blog picker context is unavailable.
- BlogML import temp files are stored under the host's local temp path instead of the site folder.

## Version 6.0.0

### Breaking changes for v6.0.0

> [!WARNING]
> Supports Umbraco **16.5.1–16.x** on .NET 9 and Umbraco **17.4.0–17.x** on .NET 10.
> [Version 7.0.0](#version-700) supersedes this line from Umbraco 17.7.1.
> Umbraco 15 and earlier are no longer supported by Articulate 6.

- Articulate 6 is deprecated; these notes document compatibility for existing installations.
- Articulate 6 is multi-targeted for `net9.0` and `net10.0`, supporting Umbraco 16 and 17 from a single package.
- The old split-project/package layout has been consolidated. Articulate now ships as the main package with the backoffice extension and static assets included.
- `ListModel` now requires an explicit `listItems` collection. The older fallback behavior that discovered posts through Umbraco services is no longer available.
- Built-in Articulate themes can still be copied, but copied themes cannot use a built-in theme name as the destination.
- `redirectArchive` no longer controls the `/authors/` directory. Themes that provide `Authors.cshtml` render the authors directory; themes without it redirect `/authors/` to the blog root.

### Theme Migration

When migrating Razor themes from older Articulate versions, replace the `Html` and `Url` helpers with model extension methods:

| Old (v5)                               | New (v6)                           |
|----------------------------------------|------------------------------------|
| `@Html.AuthorCitation(Model)`          | `@Model.AuthorCitation()`          |
| `@Html.RenderOpenSearch(Model)`        | `@Model.RenderOpenSearch()`        |
| `@Html.RssFeed(Model)`                 | `@Model.RssFeed()`                 |
| `@Html.MetaTags(Model)`                | `@Model.MetaTags()`                |
| `@Html.GoogleAnalyticsTracking(Model)` | `@Model.GoogleAnalyticsTracking()` |
| `@Html.TagCloud(...)`                  | `@Model.Tags.TagCloud(...)`        |
| `@Html.ThemedPartialAsync("Name")`     | `@await Html.PartialAsync("Name")` |
| `@Url.ArticulateSearchUrl(Model)`      | `@Model.ArticulateSearchUrl()`     |
| `@Url.ArticulateRssUrl(Model)`         | `@Model.ArticulateRssUrl()`        |

URL-bearing background images in Razor themes should be assigned through CSS custom properties with `ToCssBackgroundImageVariableValue(...)`. The legacy `BlogLogoCss` and `BlogBannerCss` APIs remain as obsolete compatibility shims, but are scheduled for removal in a future release.

### Notes

- The standalone post editor now keeps its access token in memory. Refreshing the page clears the token and requires sign-in again.
- Custom themes should provide the expected views, including `Authors.cshtml`, where applicable.

---

## Version 5.x

For release notes from previous versions, see the [GitHub Releases](https://github.com/Shazwazza/Articulate/releases) page.
