# Build utility

The build utility restores, builds, tests and packs the Umbraco 17 target. Packages are written to `build/<Configuration>`.

## Commands

```text
dotnet run --file build/build.cs -- build [--configuration Debug|Release] [--tests] [--client true|false] [--sample] [--clean]
dotnet run --file build/build.cs -- client
dotnet run --file build/build.cs -- site [--configuration Debug|Release] [--reset]
```

### build

`build` restores the solution, builds it, optionally runs tests, and packs `Articulate.Web` and the sample theme. Release builds enable the client unless `--client false` is supplied.

### client

`client` performs a frozen install and runs the v17 workspace check, build and lint commands.

### site

`site` runs the test website. `--reset` removes its local database first.
