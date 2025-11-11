# Developer Onboarding Guide

## Who is this guide for?

This guide is intended for developers who are maintaining or contributing to the Articulate package. It provides a comprehensive overview of the migration from the legacy AngularJS backoffice to the modern Lit and TypeScript architecture for Umbraco 15/16/17 on .NET 9/10. It details the key architectural changes, the new development workflow, and the structure of both the front-end and back-end code to facilitate a smooth onboarding process.

> Source of truth for commands
>
> - Build/test/run commands now live in `AGENTS.md` and the scoped guides:
>   - Root: `AGENTS.md`
>   - Core: `src/Articulate/AGENTS.md`
>   - RCL/Themes: `src/Articulate.Web/AGENTS.md`
>   - Management API: `src/Articulate.Api.Management/AGENTS.md`
>   - Backoffice client: `src/Articulate.Api.Management/Client/AGENTS.md`
>   - Unit tests: `src/Articulate.UnitTests/AGENTS.md`
>   - Demo website: `src/Articulate.Tests.Website/AGENTS.md`
>
> - This doc focuses on background and workflow context; defer to scoped AGENTS for exact steps.

## 1. Core Architectural Changes

Several fundamental architectural changes were made during the migration to multi-targeted .NET 9/10 builds for Umbraco 15, 16, and 17.

### [Razor Class Library (RCL)](https://learn.microsoft.com/en-us/aspnet/core/razor-pages/ui-class?view=aspnetcore-9.0&tabs=visual-studio)

The project SDK was migrated from `Microsoft.NET.Sdk` to `Microsoft.NET.Sdk.Razor`. This turns the project into a Razor Class Library (RCL), which is the modern, standardized way to ship .NET packages with compiled Razor views and static assets (`.js`, `.css`, etc.).

### `wwwroot` for Static Assets

As part of the move to RCL, all shipped `/App_Plugins/Articulate/**` assets live under the Razor Class Library (`src/Articulate.Web/wwwroot/App_Plugins/Articulate`). Those assets are produced by the pnpm/Vite build and committed to source so NuGet consumers get the final `dist/` outputs:

- `src/Articulate.Api.Management/wwwroot/App_Plugins/Articulate/BackOffice` - compiled backoffice client application.
- `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes/*/dist/**` - bundled Razor themes (CSS/JS) generated from each theme's `src/` tree.
- `src/Articulate.Web/wwwroot/App_Plugins/Articulate/MarkdownEditor/dist/**` - the mobile-optimized Markdown editor SPA that replaces the legacy Angular implementation.

These folders are published as static web assets through the `Articulate` and `Articulate.StaticAssets` packages, which is the modern approach for Umbraco extensions.

### Markdown Editor Migration (AngularJS to [Alpine.JS](https://alpinejs.dev/))

The mobile-optimized Markdown Editor, a key feature of Articulate, has been migrated from its original AngularJS 1.2 implementation to a modern, lightweight version using the CSP-compliant build of Alpine.JS. This removes the last dependency on AngularJS and improves security and performance.

## 2. The Old Architecture: AngularJS

The legacy backoffice implementation for Articulate was built using AngularJS. This approach involved a combination of JavaScript controllers and HTML views, which were registered with Umbraco through a `package.manifest` file.

### Key Characteristics

- **AngularJS Controllers**: Separate JavaScript files (e.g., `themepicker.controller.js`, `articulatemgmt.controller.js`) contained the logic for property editors and dashboards.
- **HTML Templates**: Each controller was paired with an HTML template (e.g., `ThemePicker.html`, `articulatemgmt.html`) that defined the UI.
- **`package.manifest`**: A JSON file was used to register all components, including property editors, dashboards, and their associated JavaScript and CSS files.
- **C# DataEditors**: The server-side implementation of property editors often required complex constructors with multiple dependencies.
- **Fragmented Structure**: The codebase was often fragmented into multiple small files for controllers and views, making it harder to maintain.

## 3. The New Architecture: [Lit](https://lit.dev/) & [TypeScript](https://www.typescriptlang.org/)

The new backoffice is built on a modern front-end stack that leverages Lit, TypeScript, and ES6 modules. This aligns with Umbraco's shift towards a more standardized and maintainable extension model. The new architecture promotes the use of single-file components, which encapsulate both the template and logic, making them easier to manage.

### Key Components

- **Lit Web Components**: For building reactive and maintainable UI elements.
- **TypeScript**: For type safety and an improved developer experience.
- **[@umbraco-cms/backoffice](https://www.nuget.org/packages/Umbraco.Cms.StaticAssets)**: The official package for building backoffice extensions.
- **UUI (Umbraco UI Library)**: A set of reusable web components for a consistent look and feel.

## 4. API Client Generation with [OpenAPI/Swagger](https://swagger.io/specification/)

The new architecture leverages OpenAPI (formerly Swagger) to generate a strongly-typed TypeScript API client. This eliminates the need for manual API interaction and ensures that the front-end client is always in sync with the back-end API.

### The Process

1. **API Definition**: The C# API controllers in `src/Articulate.Api.Management/Controllers` are decorated with attributes that allow for the automatic generation of an `openapi.json` specification.
2. **Swagger Configuration**:
   - `ArticulateApiComposer.cs`: This class registers the necessary services for Swagger generation.
   - `ArticulateSwaggerOptions.cs`: This class configures the Swagger document, including metadata like the title, description, and license. It also includes XML comments from the C# code to provide detailed descriptions of the API endpoints.
3. **Client Generation**: The [`hey-api/openapi-ts`](https://github.com/hey-api/openapi-ts) tool is used to read the generated `openapi.json` file and produce a TypeScript client. This client provides strongly-typed methods for all API endpoints, making it easy and safe to consume the API from the front-end.

## 5. Key Files and Locations

Here is a list of key files and directories in the current architecture:

- **Client-Side Source Code**: `src/Articulate.Api.Management/Client/src`
  - This directory contains all the TypeScript source files for the Lit-based web components.
- **Generated API Client**: `src/Articulate.Api.Management/Client/src/api`
  - The OpenAPI-generated TypeScript client is emitted here. Regenerate it with the `generate:api` script when the C# API changes.
- **Compiled Backoffice Assets**: `src/Articulate.Api.Management/wwwroot/App_Plugins/Articulate/BackOffice`
  - `pnpm run build` writes the production bundles to this folder. Umbraco ships these files via static-web-asset packaging.
- **API Controllers**: `src/Articulate.Api.Management/Controllers`
  - The C# controllers that define the backoffice API endpoints.
- **API Models**: `src/Articulate.Api.Management/Models`
  - The C# models used by the API controllers.
- **Swagger Configuration**:
  - `src/Articulate.Api.Management/Composers/ArticulateApiComposer.cs`
  - `src/Articulate.Api.Management/Options/ArticulateSwaggerOptions.cs`
  - These files are responsible for configuring the Swagger/OpenAPI generation.
- **Backoffice Markdown Editor Package**: `src/Articulate.Api.Management/Client/src/packages/articulate-markdown-editor`
  - Contains the Lit wrapper and manifest glue for the Umbraco markdown editor property editor used inside the backoffice.

## 6. Markdown Editors

Articulate ships two markdown editing experiences:

1. **Backoffice property editor (Lit + Umbraco markdown package)**  
   - Location: `src/Articulate.Api.Management/Client/src/packages/articulate-markdown-editor`.  
   - Purpose: wraps the official Umbraco markdown editor package in Lit components so it can be registered as a backoffice property editor, keeping the editing UX aligned with core Umbraco while allowing Articulate-specific defaults.

2. **Mobile/front-end Markdown editor SPA (Alpine.js)**  
   - Location: `src/Articulate.Web/wwwroot/App_Plugins/Articulate/MarkdownEditor`.  
   - Purpose: replaces the legacy AngularJS mobile editor with a lightweight Alpine.js implementation that authenticates against the management API (OpenIddict) and lets authors compose posts from any device.

Keeping both implementations in-repo ensures we can react quickly to upstream changes, harden routing/auth flows, and ship working bundles inside the NuGet packages.

## 7. Development Workflow and Build Process

This section details how the front-end assets are developed, built, and integrated with Umbraco. The entire process is managed through pnpm scripts and a set of custom Node.js scripts.

### `package.json` & [Vite](https://vitejs.dev/)

Located in `src/Articulate.Api.Management/Client`, `package.json` is the heart of the front-end project. It defines:

- **Dependencies**: Third-party libraries like Lit, TypeScript, and the Vite build tool are managed here.
- **Scripts**: The `scripts` section contains commands for common tasks:
  - `dev`: Starts a Vite development server for live-reloading.
  - `build`: Compiles the TypeScript code and bundles it for production.
  - `generate:api`: Runs a custom script to generate the TypeScript API client.
  - `lint`: Lints the codebase to ensure code quality.

Before running `.NET` builds make sure client dependencies are installed manually:

- From `src/Articulate.Api.Management/Client`, run `pnpm install` to hydrate `node_modules/`.
- Re-run `pnpm install` whenever you clean out the workspace or update dependencies.

### Custom Build Scripts (`src/Articulate.Api.Management/Client/scripts`)

- **`generate-api.js`**: This script uses `@hey-api/openapi-ts` to connect to a running instance of the Articulate site, fetch the OpenAPI/Swagger JSON definition, and generate a fully typed TypeScript client. This ensures the front-end is always in sync with the back-end API.
- **`post-build.js`**: After Vite creates the production build, this script moves the compiled bundles into `src/Articulate.Api.Management/wwwroot/App_Plugins/Articulate/BackOffice`, making them available to the Razor Class Library.
- **`set-version.js`**: This utility synchronizes the version number across `package.json` and `umbraco-package.json`, ensuring consistency for releases.

### `umbraco-package.json`

This file, located in `src/Articulate.Api.Management/Client/public`, is the modern manifest for Umbraco extensions. It tells Umbraco how to load the backoffice assets. In this case, it registers a single JavaScript bundle (`articulate.js`) which contains all the necessary code for the property editors and dashboards.

### Putting It All Together: The End-to-End Flow

1. **Development**: Run `pnpm run dev` from `src/Articulate.Api.Management/Client` to start the Vite development server. Changes under `Client/src` hot-reload into the Umbraco backoffice.
2. **API Changes**: If a C# API endpoint is modified, run `pnpm run generate:api` in the same folder to regenerate the typed client.
3. **Building for Production**: Execute `pnpm run build` (locally or as part of the release pipeline). The command compiles TypeScript, bundles with Vite, and invokes `post-build.js`.
4. **Integration with Umbraco**: `post-build.js` moves the bundles into `src/Articulate.Api.Management/wwwroot/App_Plugins/Articulate/BackOffice` alongside the `umbraco-package.json` manifest so the Razor Class Library can expose them as static web assets.
5. **Full Release Build**: Use `pwsh build/build.ps1` to reproduce the CI flow-restore, clean, build, and pack the solution in Release mode. GitHub Actions (`.github/workflows/build.yml`) runs the same sequence on Windows with Node/pnpm setup to produce signed artifacts.

#### Troubleshooting client builds

If `pnpm run build` fails during `dotnet build`, make sure the client dependencies are installed locally:

1. From `src/Articulate.Api.Management/Client`, run `pnpm install` (ensure pnpm 10.17+ is available via corepack or manual install).
2. Retry `pnpm run build` (or `pnpm run build:release`); Vite should complete without errors.
3. If build output looks stale, remove `node_modules/` and rerun `pnpm install`.
4. When in doubt, clear `node_modules/`, `pnpm-lock.yaml`, and rerun `pnpm install`.

```powershell
# From src/Articulate.Api.Management/Client
pnpm dlx rimraf node_modules pnpm-lock.yaml
pnpm install
```

If you prefer plain PowerShell commands without `pnpm dlx`, run:

```powershell
Remove-Item -Recurse -Force .\node_modules
Remove-Item -Force .\pnpm-lock.yaml
pnpm install
```

## 8. Anatomy of a Backoffice Component

This section breaks down the structure of a typical backoffice component, using the `theme-picker.element.ts` property editor as an example.

### Component Structure and Decorators

- **Base Class**: Components extend `UmbLitElement` and use the `UmbElementMixin` to hook into the Umbraco backoffice context.
- **`@customElement`**: This decorator registers the component with the browser as a custom HTML element (e.g., `<theme-picker-element>`).
- **`@property`**: This decorator defines a public property that can be set from outside the component. For property editors, the `value` property is essential, as it receives the saved data from Umbraco.
- **`@state`**: This is used for internal, private reactive state. When a state property changes, the component re-renders, but the property is not exposed externally.

### Integration with Umbraco

- **`UmbPropertyEditorUiElement`**: By implementing this interface, the component signals that it is a property editor UI, adhering to a specific contract.
- **Dispatching Events**: To notify Umbraco that a property's value has changed, the component dispatches a `UmbPropertyValueChangeEvent`. This is the key mechanism for saving data.

### Consuming the API Client

- **Importing the SDK**: The component imports the generated API client directly (e.g., `import { ThemePicker } from '../api/sdk.gen.js';`).
- **Calling API Methods**: It can then call methods on the imported service (e.g., `ThemePicker.getArticulateEditorsThemePickerThemes()`) to fetch data from the C# back-end. This provides a fully typed and predictable way to interact with the server.

### Using the UUI Library

- **UI Components**: The component's `render()` method uses components from the Umbraco UI (UUI) library, such as `<uui-select>`. This ensures a consistent look and feel with the rest of the backoffice.
- **Styling**: Shared styles from Umbraco, like `UmbTextStyles`, can be imported and used alongside component-specific styles.

## 9. Front-end Deep Dive

This section explores the different parts of the client-side application and how they work together.

### The Main Dashboard (`dashboards/dashboard.element.ts`)

The `articulate-dashboard` component is the main entry point for the Articulate section in the backoffice. Its primary responsibility is to set up the routing for the different management views (e.g., BlogML import/export, theme options). It uses the `umb-router-slot` component from Umbraco to dynamically render the correct view based on the URL.

### Reusable Components (`src/Articulate.Api.Management/Client/src/components`)

This directory contains the individual views that are managed by the main dashboard router. These are standalone components that handle specific tasks:

- **`blogml-importer.element.ts` / `blogml-exporter.element.ts`**: Handle the logic for importing and exporting BlogML data.
- **`theme-options.element.ts`**: Provides UI for managing theme settings.
- **`dashboard-options.element.ts`**: The default view for the dashboard, providing links to the other sections.

### Utilities (`src/Articulate.Api.Management/Client/src/utils`)

This directory contains helper functions that are used across multiple components:

- **`error-utils.ts`**: Provides a standardized way to format and display API errors.
- **`form-utils.ts`**: Contains helpers for working with forms and form data.
- **`notification-utils.ts`**: A wrapper around the Umbraco notification service for displaying success or error messages.
- **`template-utils.ts`**: Contains shared Lit templates and styles.

### Entrypoints and Manifests

- **`entrypoints/entrypoint.ts`**: This file is the initial JavaScript that runs for the Articulate backoffice extension. It is responsible for setting up the API client with the correct authentication context.
- **`bundle.manifests.ts`**: This crucial file acts as a central aggregator for all the extension manifests. It imports the manifest arrays from the dashboards, property editors, and entrypoints, and exports a single combined array. This is the array that is ultimately referenced by the `umbraco-package.json` to register all the different parts of the extension with Umbraco.

## 10. Back-end Deep Dive

This section covers the C# server-side architecture that supports the backoffice front-end.

### API Controllers (`src/Articulate.Api.Management/Controllers`)

These are standard Umbraco API controllers that handle requests from the backoffice. They are the bridge between the front-end Lit components and the back-end services.

- **`ThemePickerApiController.cs`**: Provides an endpoint to get a list of available themes.
- **`ThemeOptionsApiController.cs`**: Exposes endpoints for managing theme settings, such as copying a default theme to create a user-editable version.
- **`BlogMlApiController.cs`**: Handles the logic for importing and exporting BlogML files.
- **`MarkdownEditorApiController.cs`**: Provides server-side functionality for the Markdown editor, such as handling image uploads.

#### Markdown Editor Authentication (OpenIddict)

- The mobile Markdown editor authenticates against the management API using OpenIddict client credentials. On successful sign-in it exchanges the authorization code for tokens, stores them in session storage, and uses the generated SDK to perform post operations.
- The end-to-end "happy path" (authorize -> compose -> upload images -> publish) is implemented and tested in the demo site. Ensure `Articulate:ManagementApi:OpenIddict` settings are present so the editor can obtain a client ID/secret.
- The authentication flow spans both C# and client-side components:
  - **`ArticulateApplicationManager.cs`** wires up OpenIddict server registrations, token lifetimes, allowed flows (authorization code + PKCE), and the OAuth callback endpoints that the Markdown editor consumes.
  - **`BackOfficeAuthService.cs`** executes the server-side exchange for backoffice users, mapping Umbraco identities into JWT claims and enforcing the scopes the markdown editor relies on (posts, uploads, profile).
  - **`authService.js`** (inside `src/Articulate.Web/wwwroot/App_Plugins/Articulate/MarkdownEditor/src/js/`) owns the client portion: launching the login window, completing the callback, persisting tokens in `sessionStorage`, and exposing helpers for logout, token refresh, and user profile fetches.
- Best practices already implemented:
  - Authorization code flow with PKCE and short-lived access tokens, refresh token rotation handled by OpenIddict.
  - Session-scoped storage (no long-term persistence) and explicit logout handling that revokes the refresh token and clears cached data.
  - Callback hardening via state/nonce checks in `authService.js` to mitigate replay attacks.
- Remaining improvements to track:
  - Harden logout to call the OpenIddict end-session endpoint when available and fall back gracefully if the backoffice session has already expired.
  - Add structured logging/telemetry around token failures in `BackOfficeAuthService` so operators can diagnose client credential issues quickly.
  - Expand the Alpine component error handling to surface expired/invalid token states and offer a one-click re-auth experience.
- Upcoming hardening tasks: improve token refresh handling, report API/auth errors in the UI, and validate failure cases (expired tokens, revoked clients, offline usage) during QA.

### API Models (`src/Articulate.Api.Management/Models`)

These are simple C# classes (POCOs) that define the data structures (Data Transfer Objects or DTOs) for requests and responses used by the API controllers. They ensure that data is consistently structured between the client and server.

### Theme & View Resolution (The New Way)

In older versions, view resolution was handled by a custom `IViewEngine` and `PathHelper`. This has been replaced with a modern, idiomatic Umbraco approach using view location expanders and resolvers.

- **`ArticulateThemeResolver.cs`**: This service is responsible for determining which theme should be active for a given request. It inspects the current content node and its ancestors to find the configured theme.
- **`ArticulateViewLocationExpander.cs`**: This is the core of the new view resolution system. It plugs into the ASP.NET Core MVC rendering pipeline and tells it where to find the Razor views for a given theme. It uses `ArticulateThemeResolver` to get the active theme and then points MVC to the correct view paths within the theme's directory (e.g., `~/Views/ArticulateThemes/{ThemeName}/{ViewName}.cshtml`).

### Asset Bundling & The Service Layer

With the move to RCL, the bundling and serving of theme assets (CSS, JS) has also been modernized.

- **`ArticulateConstants.DefaultThemes`** (inside `src/Articulate/ArticulateConstants.cs`): defines the list of built-in themes that ship with the package and feed the theme copy logic.
- **`PathHelper.cs`**: The role of this class has been significantly reduced. It is no longer used for resolving view paths. Instead, it now primarily serves as a helper to provide the correct virtual paths to theme *assets* (CSS/JS) for the bundling process, distinguishing between built-in themes (served from `_content/Articulate/Themes/...`) and user-created themes (served from `~/Views/ArticulateThemes/...`).
- **`ArticulateThemeRepository.cs`**: This service remains responsible for the business logic of managing themes, such as retrieving theme lists and handling the copying of default themes to the user-editable `~/Views/ArticulateThemes` directory.

### C# Property Editors (`src/Articulate.Api.Management/PropertyEditors`)

These classes define the server-side configuration for the custom property editors.

- **`ThemePickerPropertyEditor.cs`**: Defines the `Articulate.ThemePicker` property editor, linking it to the front-end `<theme-picker-element>`.
- **`ThemePickerConfigurationEditor.cs`**: Provides the configuration UI for the theme picker, allowing developers to set default values.
- **`ArticulateMarkdownPropertyEditor.cs`**: The server-side definition for the custom Markdown editor.

### Swagger & API Generation (`Articulate.Api.Management/Composers` and `Articulate.Api.Management/Options`)

- **`ArticulateApiComposer.cs`**: This composer runs on startup and registers the Swagger/OpenAPI services with Umbraco's dependency injection container.
- **`ArticulateSwaggerOptions.cs`**: This class configures Swagger to generate the API documentation for the Articulate controllers. It defines the document info (title, version) and ensures that the XML comments from the C# code are included in the generated `swagger.json` file. This file is the single source of truth for the front-end API client.

## 11. Project, Build & Deployment

This section covers the low-level details of the project setup, build process, and deployment, which are critical for both development and creating official releases.

### The Articulate Project (`Articulate.csproj`)

The main `Articulate.csproj` file contains important logic for packaging themes and exposing static assets.

- **Client Assets**: `pnpm run build` (or `pnpm run build:release`) inside `src/Articulate.Api.Management/Client` writes the management bundles to `src/Articulate.Api.Management/wwwroot/App_Plugins/Articulate/BackOffice` and refreshes the theme/Markdown editor `dist/` folders under `src/Articulate.Web/wwwroot/App_Plugins/Articulate`. Run that command before packing so the checked-in `dist/` folders stay in sync. `build/build.ps1` turns on `ENABLE_CLIENT_BUILD` automatically in CI (and when you opt in locally) to run pnpm before MSBuild; otherwise it uses the last committed assets.
- **Theme Embedding**: Built-in themes live in `src/Articulate.Web/wwwroot/App_Plugins/Articulate/Themes`. The project embeds them as resources so they ship as static web assets and can be copied into `~/Views/ArticulateThemes` via `ArticulateThemeRepository`.

### The Test Website (`Articulate.Tests.Website`)

The test website is the primary environment for developing and debugging the Articulate package.

- **Project Reference**: `Articulate.Tests.Website.csproj` references the main `Articulate` project using a `<ProjectReference>`. The setting `<CopyStaticWebAssetsToPublish>true</CopyStaticWebAssetsToPublish>` is crucial, as it ensures that the backoffice assets from the `Articulate` RCL are correctly copied to the test site for development and testing.
- **`Program.cs` Configuration**:
  - **Runtime compilation helpers**: In Debug/Development the site enables Razor runtime compilation and wires `src/Articulate.Web/wwwroot` as an additional file provider so theme/asset edits show up without rebuilding. Because runtime compilation conflicts with .NET hot reload, run `dotnet watch run --no-hot-reload --project src/Articulate.Tests.Website` and manually refresh the browser after each Razor change.
  - **Delivery API enabled**: `AddDeliveryApi()` runs by default so the demo site mirrors real deployments that expose management and delivery endpoints together.
  - **`UseStaticWebAssets` guidance**: The `builder.WebHost.UseStaticWebAssets()` call remains commented with a note explaining that it is only required when you intentionally run the test site in a simulated Production mode from the IDE. Leave it disabled for normal development to avoid circular static-asset references.

### Supported SDK & Umbraco versions

- Install `.NET 9.0.100` plus the `.NET 10 RC` (`10.0.0-rc.2`) SDK so both TFMs build locally; Visual Studio uses the repo `global.json` to enforce the baseline 9.0 SDK while roll-forward keeps the RC available for `net10`.
- The `net10.0` TFM targets Umbraco 17 RC1 (`17.0.0-rc1`), while `net9.0` covers Umbraco 15.4.4+ / 16 via the NuGet version ranges defined in `Directory.Build.props`.

### AI/LLM Content Negotiation & Caching

Articulate supports serving text-friendly representations for AI agents via the `Accept` header.

- Controllers
  - Single posts negotiate in `BlogPostControllerBase` (markdown/plain/html) and set `X-Content-Variant` + `Cache-Control`.
  - Lists negotiate in `ListControllerBase` for archive/tags/categories/search.
- Request filter
  - `ContentVariantRequestFilter` normalizes a request header `X-Content-Variant` (md|txt|html) from `Accept` so server output caching varies on a stable key.
- OutputCache policies
  - Registered in `ArticulateComposer` (`Articulate60/120/300`) and configured to vary by `X-Content-Variant` (and `Accept` as fallback).
- Response headers
  - Posts: `Cache-Control: public, max-age=0, s-maxage=120`, `Vary: X-Content-Variant`, `X-Content-Variant: md|txt|html`.
  - Lists: `Cache-Control: public, max-age=0, s-maxage=60`, same `Vary`/variant.
- HTML discoverability
  - The shared layout emits `<link rel="alternate" type="text/markdown|text/plain" ...>` for posts.

CDN strategy (recommended): normalize at the edge and key on `X-Content-Variant`. See `docs/ai-content-negotiation.md` for Cloudflare/CloudFront/Fastly examples.

### Dynamic routes overview

The router maps dynamic endpoints under your Articulate root ("mount path"), based on settings:

- Search: `/{searchUrlName}`
- Tags/Categories:
  - Index: `/{tagsUrlName}` / `/{categoriesUrlName}`
  - Filtered list: `/{tagsUrlName}/{tag}` / `/{categoriesUrlName}/{tag}`
  - RSS: `/{tagsUrlName}/{tag}/rss` / `/{categoriesUrlName}/{tag}/rss`
- RSS: `/rss`, `/rss/xslt`, `/author/{authorId}/rss`
- OpenSearch: `/opensearch/{id}`
- RSD: `/rsd/{id}`
- Live Writer Manifest: `/wlwmanifest/{id}`
- MetaWeblog: `/metaweblog/{id}`

### Front-end Markdown editor (`/a-new`)

Important: the legacy front-end Markdown editor route `/a-new` is still mapped, but the controller in `src/Articulate/Controllers/MarkdownEditorController.cs` now returns a **302 temporary redirect** to the blog home (`master.RootBlogNode.Url(mode: UrlMode.Absolute)`). This keeps existing links working and preserves the correct hostname in multi-tenant installs, while steering authors toward the backoffice editor supplied by `Articulate.Api.Management`.

#### Switching back to the full front-end editor

For beta builds we intentionally issue the 302. When it is time to ship the new front-end Markdown editor experience (beta2/GA), swap the controller back to the rendering implementation that lives in the web project:

1. Remove (or rename) the redirect shim at `src/Articulate/Controllers/MarkdownEditorController.cs`.
2. Ensure `src/Articulate.Web/Controllers/MarkdownEditorController.cs` stays in place; Umbraco will now resolve this controller for `/a-new/`.
3. That controller constructs the `MarkdownEditorInitModel`, loads routing/config values from the management API, and renders `src/Articulate.Web/wwwroot/App_Plugins/Articulate/MarkdownEditor/MarkdownEditor.cshtml`, which is the new SPA.

If you prefer to keep a single controller, replace the `Redirect(target)` call in the core shim with the view rendering logic from the web controller (see commit history before the beta redirect, e.g. `git show HEAD^:src/Articulate/Controllers/MarkdownEditorController.cs`).

### Packaging for Release

The CLI and IDE paths now produce identical NuGet packages-no Visual Studio-only workaround required.

1. Run `pwsh build/build.ps1` (Windows) or `bash build/build.sh` (Linux/WSL). The scripts restore, build both TFMs, and pack the four distributable projects into `build/Release`.
2. During the pack step the scripts simply run `dotnet pack` for each project. Because `Articulate.Web` references `Articulate.StaticAssets` directly, the generated `Articulate` nupkg automatically declares the dependency without any extra flags or version math.
3. `Articulate.StaticAssets` remains a pure RCL that mirrors the built `dist/` folders from `Articulate.Web`. With the dependency expressed in the project graph, no manual `<Content>` fallbacks or `.targets` hooks are required-the standard static-web-asset pipeline lights up in consuming Umbraco sites.

Direct `dotnet pack` invocations still work if you prefer granular control; just run `dotnet pack src/Articulate.Web/Articulate.Web.csproj` (and the other projects) normally. The `ProjectReference` ensures the StaticAssets dependency is recorded automatically.

