# Build

Articulate 7.x targets Umbraco 17. The repository uses the .NET 10 SDK, Node 24.x, pnpm 11.19.0 and the `nbgv` CLI.

## Build

```text
dotnet run --file build/build.cs -- build --client true --tests --sample --clean
node build/smoke-package.mjs build/Release
```

The package and sample package are written to `build/Release`. Use `build --clean` when you need to remove local build outputs.

The test host uses ImageSharp 3.2.0 and ImageSharp.Web 3.3.0. CI restores with NuGet auditing enabled and suppresses only five advisories whose upstream affected ranges have not yet been corrected. The evaluated versions and suppression set are checked by the native E2E runner.

## Client

```text
pnpm --dir src/Articulate.Web/Client install --frozen-lockfile
pnpm --dir src/Articulate.Web/Client/v17 run check
pnpm --dir src/Articulate.Web/Client/v17 run build
pnpm --dir src/Articulate.Web/Client/v17 run lint
```

The checked-in API client is generated from the v17 Swagger document. Start the test website, then run:

```text
pnpm --dir src/Articulate.Web/Client/v17 run generate:api
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

## CI jobs and E2E

CI always builds and tests the v17 packages, then inspects package contents. Fresh-site HTTP E2E is opt-in for routine runs: add the `e2e` pull request label, set the repository variable `E2E=true`, or enable the **Run fresh packaged-site HTTP E2E** input on a manual workflow run. Release branches, release-targeted pull requests and `v*` tags run E2E automatically.

The build job hands its packages to an isolated native-host E2E job. The final package artifact is uploaded only after the build succeeds and E2E either passes or was not selected. A failed or cancelled E2E run blocks upload. CI retains E2E reports, test artefacts and native host logs.

Run the same packaged-host check locally after building with `--sample`:

```text
dotnet run --file build/test.cs -- fresh
dotnet run --file build/test.cs -- report
```

The runner uses no Docker containers or browser installation. It isolates the temporary site, database, certificate and secret, verifies package hashes, and cleans up its own host and directory. See the [E2E guide](src/Articulate.Web/Client/e2e/README.md) for coverage and reports.
