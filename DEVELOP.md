# Development

Articulate 8.x targets Umbraco 18. Install the .NET 10 SDK, Node 24.x, pnpm 11.19.0 and `nbgv`.

Run the test site with:

```text
dotnet run --file build/build.cs -- site --reset
```

Build and validate the product with the commands in `BUILD.md`. The v18 Swagger implementation, routing code, models, importer, MetaWeblog provider and tests are the canonical target implementation. Client feature source remains under `src/Articulate.Web/Client/common`; the v18 workspace contains its build configuration.
