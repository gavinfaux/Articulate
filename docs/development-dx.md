## Development DX: Hot Reload + HMR

This repository supports a fast inner loop for Razor views, HTML, CSS, and JS when working on Articulate.

### Prerequisites

- .NET 9 SDK
- Node 22+ and pnpm 10.17+

### Backend + Razor hot reload (same origin)

Run the test website with Hot Reload; in Development it enables:

- Razor runtime compilation for `.cshtml`
- LiveReload for static assets (css/js/images/json)

Commands:

```
dotnet watch run --project src/Articulate.Tests.Website
```

Navigate to `https://localhost:44366/`.

Notes:

- This setup avoids a separate proxy/port so auth callbacks, cookies and management API calls remain on the same origin.
- Development-only packages/middleware are conditioned to Debug/Development builds and are not used in production.
- To prevent automatic live reload run `dotnet watch` with the `--no-hot-reload` argument, use when manual reload is preferable DX.

### Backoffice client HMR (Vite)

Run in parallel for the backoffice extension (Lit + TypeScript):

```
cd src/Articulate.Api.Management/Client
pnpm install
pnpm run dev
```

Tips:

- Use `pnpm run build` to emit assets into `wwwroot/App_Plugins/Articulate/BackOffice` when validating a full .NET build or packing.
- `pnpm run lint` and `pnpm run check` help keep the client codebase healthy during edits.

### Regenerating the client SDK (optional)

If OpenAPI changes, regenerate the typed client:

```
cd src/Articulate.Api.Management/Client
pnpm run generate:api
```

