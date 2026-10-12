# Articulate Theme Sample

`Articulate.Theme.Sample` is a small Razor Class Library theme package for Articulate 7 and Umbraco 17.

- Canonical theme key: `Sample`
- Views live under `App_Plugins/Articulate/Themes/Sample/Views/`
- Theme assets live under `wwwroot/App_Plugins/Articulate/Themes/Sample/assets/`
- The package registers the `Sample` theme through `IArticulateThemeDescriptorProvider`.

Build the sample package for local validation:

```text
dotnet run --file build/build.cs -- build --sample
```

The native packaged-host E2E runner uses the sample package from `build/Release`. It is not published to the general NuGet feed.

## View contract

Articulate controllers render `List.cshtml`, `Post.cshtml` and `Author.cshtml` directly. `Tags.cshtml` and `Authors.cshtml` are optional. Theme-owned partials include `Menu.cshtml`, `Pager.cshtml`, `PostCard.cshtml` and `CommentsDisqus.cshtml`.

`CommentsDisqus.cshtml` retains its existing name and model contract. It renders Disqus when the blog root has a valid `disqusShortname`. Otherwise, it renders Giscus when all four `giscusRepo`, `giscusRepoId`, `giscusCategory` and `giscusCategoryId` values are set on the blog root, or when `Articulate:Comments:Giscus` is configured. Disqus takes precedence if both providers are configured. With neither provider configured, the partial renders no comments UI.

The built-in themes and sample theme include `giscus.css`. Articulate serves a theme's stylesheet through `/articulate/giscus-theme/{theme}` so the Giscus iframe receives the configured CORS headers. A custom theme can provide its own `assets/giscus.css`; without one, Giscus uses its built-in palette. An explicit `DataTheme` setting takes precedence over the theme stylesheet.

See the [Creating Themes](https://github.com/Shazwazza/Articulate/wiki/Creating-a-theme) and [Theme File Structure](https://github.com/Shazwazza/Articulate/wiki/Theme-File-Structure) guides.
