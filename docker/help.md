# Articulate Docker utility

```text
dotnet run docker/run.cs -- <command> [options]
dotnet run docker/run.cs -- help [command]
```

| Command | Purpose |
|---|---|
| `docker-build` | Build the standalone chiseled image. |
| `docker-dev` | Start the development stack and run publish/confirm smoke. |
| `docker-prod` | Restart the existing image in Production mode and run smoke. |
| `docker-down` | Stop one or both lanes; optionally remove volumes or all resources. |
| `docker-status` | Inspect containers and packaged Backoffice assets. |
| `docker-test` | Run the full Docker validation for one or both lanes. |
| `docker-ca` | Export and trust Caddy's local root CA. |

Commands default to lane `v17`; `docker-test` defaults to both lanes.

### docker-build

```text
dotnet run docker/run.cs -- docker-build [--lane v17|v18] [--clean] [--tag image:tag]
```

Builds current packages through `build/build.cs` before creating
`articulate-local:<lane>` unless a tag is supplied. `--clean` rebuilds the
package lane from clean outputs.

### docker-dev

```text
dotnet run docker/run.cs -- docker-dev [--lane v17|v18] [--clean] [--reset] [--skip-smoke] [--fixture]
```

Builds current packages through `build/build.cs` and builds the Docker image,
starts the development stack, then runs the smoke phases selected by the runner.
For direct smoke modes, use the usage header in `docker/smoke.mjs` as the single
source of truth. Docker package refreshes preserve the host test site's
`umbraco` state; Docker database state lives in named volumes. `--reset` removes
the lane's Docker volumes first; `--skip-smoke` stops after readiness succeeds
without publishing content, so the public root may return 404.
Without `--fixture`, the runner leaves the package's starter content alone and
runs only publish/confirm smoke. `--fixture` imports `docker/fixtures/blogml-fixture.xml`,
restarts, enables the scoped author fixture, and runs the Markdown,
MetaWeblog, and export smokes. With `--skip-smoke`, the runner also disables
the harness API and fixture; this is a plain package/startup check.

### docker-prod

```text
dotnet run docker/run.cs -- docker-prod [--lane v17|v18] [--skip-smoke]
```

Recreates the lane's existing image in Production mode. Run `docker-dev` or
`docker-build` first when package contents changed.

### docker-down

```text
dotnet run docker/run.cs -- docker-down [--lane v17|v18|all] [--volumes|--purge]
```

`--lane all` stops both lanes. `--volumes` removes volumes for the selected
lane. `--purge` removes the selected lane's containers, volumes, service images,
and orphans.

### docker-status

```text
dotnet run docker/run.cs -- docker-status [--lane v17|v18]
```

Shows the lane's containers and verifies the packaged Backoffice files inside
the running site.

### docker-test

```text
dotnet run docker/run.cs -- docker-test [--lane v17|v18|all] [--fixtures] [--keep] [--skip-smoke]
```

Each lane removes its existing Docker volumes first, builds fresh packages and
images, then runs the normal development publish/confirm smoke. Add
`--fixtures` to import `docker/fixtures/blogml-fixture.xml`, create the scoped author
fixture, and run the Markdown, MetaWeblog, and export smokes. It then switches
to Production for production/theme smoke. `--keep` only leaves the final stack
running; without it, successful stacks are removed. `--fixtures` and
`--skip-smoke` cannot be combined.

### docker-ca

```text
dotnet run docker/run.cs -- docker-ca [--lane v17|v18]
```

Exports and trusts the running lane's Caddy root CA.
On Windows, the certificate-store step requires user confirmation.
