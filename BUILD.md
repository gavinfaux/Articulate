# Build

Articulate 8.x targets Umbraco 18. The repository uses the .NET 10 SDK, Node 24.x, pnpm 11.19.0 and the `nbgv` CLI.

## Build

```text
dotnet run --file build/build.cs -- build --client true --tests --sample --clean
node build/smoke-package.mjs build/Release
```

The package and sample package are written to `build/Release`. Use `build --clean` when you need to remove local build outputs.

## Client

```text
pnpm --dir src/Articulate.Web/Client install --frozen-lockfile
pnpm --dir src/Articulate.Web/Client/v18 run check
pnpm --dir src/Articulate.Web/Client/v18 run build
pnpm --dir src/Articulate.Web/Client/v18 run lint
```

The checked-in API client is generated from the v18 Swagger document. Start the test website, then run:

```text
pnpm --dir src/Articulate.Web/Client/v18 run generate:api
```

Review generated routes and wire formats before replacing `common/src/api`.

## Lock files

The packable projects use `packages.lock.json`. Restore updates are local only:

```text
dotnet restore ./src/Articulate.sln -p:RestoreLockedMode=false --force-evaluate
```

## Local site

```text
dotnet run --file build/build.cs -- site --reset
```

Set `UseTinyMceUmbraco` in `Directory.Build.props.user` when the test website needs TinyMCE.
