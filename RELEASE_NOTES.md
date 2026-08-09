# Articulate Release Notes

## Version 8.0.0

- Adds the Articulate 8 line for Umbraco 18 on .NET 10.
- Adds Giscus as a comment provider alongside Disqus. Configure the required
  repository and category values under `Articulate:Comments:Giscus`; existing
  blogs can override them on the blog document type. Disqus remains selected
  when a valid Disqus shortname is present.
- Giscus can follow the active theme's comment styling or use a configured
  built-in or hosted theme. See the [Comments wiki page](https://github.com/Shazwazza/Articulate/wiki/Comments).
- Existing installs receive the per-blog Giscus fields without changing
  behavior until Giscus is configured.
- Hardens external-image imports against SSRF, malicious redirects, and
  HTTPS-downgrade attacks.

## Version 7.0.0

- Targets Umbraco 17.5.3 and later on .NET 10.
- Continues the Articulate 7 package line for supported Umbraco 17 sites.
- Articulate 6.0 remains the compatibility line for Umbraco 16 and 17.

## Version 6.0.0

### Breaking Changes

> [!WARNING]
> **Platform requirements**
>
> - Minimum Umbraco version: **16.5.1** on .NET 9
> - Umbraco 15 and earlier are no longer supported by Articulate 6

- Articulate 6 is multi-targeted for `net9.0` and `net10.0`, supporting Umbraco 16 and 17 from a single package.
- The old split-project/package layout has been consolidated. Articulate now ships as the main package with the backoffice extension and static assets included.
- `ListModel` now requires an explicit `listItems` collection. The older fallback behavior that discovered posts through Umbraco services is no longer available.
- Built-in Articulate themes can still be copied, but copied themes cannot use a built-in theme name as the destination.
- `redirectArchive` no longer controls the `/authors/` directory. Themes that provide `Authors.cshtml` render the authors directory; themes without it redirect `/authors/` to the blog root.

### Theme Migration

For Razor themes migrating from older Articulate versions, helper usage should move from `Html` and `Url` helpers to model extension methods:

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

- The standalone Markdown editor now keeps its access token in memory. Refreshing the page clears the token and requires sign-in again.
- Custom themes should provide the expected views, including `Authors.cshtml`, where applicable.

---

## Version 5.x

For release notes from previous versions, see the [GitHub Releases](https://github.com/Shazwazza/Articulate/releases) page.
