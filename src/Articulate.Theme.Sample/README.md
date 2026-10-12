# Articulate Theme Sample

Build the Articulate 8 sample theme with:

```text
dotnet run --file build/build.cs -- build --sample
```

The sample registers a Razor Class Library theme named `Sample`. Its views and assets live under `App_Plugins/Articulate/Themes/Sample/`. The comments partial preserves Disqus as the first-choice provider. If Disqus is not configured, Giscus renders when all four `giscus*` properties or the `Articulate:Comments:Giscus` settings are configured; otherwise the partial renders no comments UI.

Theme packages can provide `assets/giscus.css` for Giscus. Articulate serves that stylesheet through its same-origin endpoint with a restricted CORS response for Giscus's iframe. The built-in sample includes this stylesheet.
