# Build utility

The build utility restores, builds, tests and packs the Umbraco 18 target. Packages are written to `build/<Configuration>`.

## Commands

```text
dotnet run --file build/build.cs -- build [--configuration Debug|Release] [--tests] [--client true|false] [--sample] [--clean]
dotnet run --file build/build.cs -- client
dotnet run --file build/build.cs -- site [--configuration Debug|Release] [--reset]
dotnet run --file build/giscus-migrate.cs -- [export.xml] [options]
```

### build

`build` restores the solution, builds it, optionally runs tests, and packs `Articulate.Web` and the sample theme. Release builds enable the client unless `--client false` is supplied.

### client

`client` performs a frozen install and runs the v18 workspace check, build and lint commands.

### site

`site` runs the test website. `--reset` removes its local database first.

### giscus-migrate

`dotnet run --file build/giscus-migrate.cs -- --help` prints the migration utility options. It reads a Disqus XML export and is dry-run by default. `--go` performs writes to GitHub Discussions; do not use it without an approved migration, carefully verified arguments and credentials. The utility never reads or migrates author email addresses.
