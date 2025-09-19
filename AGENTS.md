# AGENTS.md - Development Guide for Articulate

## Build/Test Commands


## Project Structure & Module Organization

- `src/Articulate/` hosts the core Umbraco blog engine; solution entry is `src/Articulate.sln`.
- `src/Articulate.Web/` delivers Razor views, layouts, and packaged themes under `wwwroot/App_Plugins/Articulate/Themes/`.
- `src/Articulate.Api.Management/` provides the management API; the `Client/` subfolder contains the Lit + TypeScript backoffice extension.
- `src/Articulate.UnitTests/` stores automated xUnit suites, while `src/Articulate.Tests.WebSite/` is the demo site for manual validation.

## Build, Test & Development Commands

- **Build**: `dotnet build src/Articulate.sln --configuration Release`
- **Clean**: `dotnet clean src/Articulate.sln --configuration Release`
- **Pack**: `dotnet pack src/Articulate.sln --output build/Release --configuration Release`
- **Test (single)**: `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj --filter "FullyQualifiedName~TestName"`
- **Test (all)**: `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj`
- From `src/Articulate.Api.Management/Client`, use `pnpm install && pnpm approve-builds` to restore dependencies, `pnpm run build` or `pnpm run build:release` for assets, `pnpm run dev` for HMR, `pnpm run lint` for ESLint/Prettier, and `pnpm run check` for TypeScript validation.
## Coding Style & Naming Conventions

- **.NET 9.0** target framework with C# latest version
- **Nullable warnings** enabled, treat as errors
- **Implicit usings** enabled
- **4-space indentation**, UTF-8 encoding, CRLF line endings
- **Instance fields**: camelCase with `_` prefix (e.g., `_fieldName`)
- **Public members**: PascalCase for classes, methods, properties
- **Interfaces**: PascalCase with `I` prefix
- **Expression-bodied members** preferred where appropriate
- **StyleCop analyzers** enforced for code quality
- **TypeScript/Client**: ES2020 target, 2-space indentation, single quotes, Prettier formatting

## Testing Guidelines

- Author xUnit tests with descriptive names like `MethodUnderTest_ShouldExpectedBehavior` and FluentAssertions for readability.
- Cover new features with unit tests and sanity-check UI changes via the demo website.
- Run `pnpm run lint` and `dotnet test` before packaging to surface analyzer warnings early.

## Commit & Pull Request Guidelines
- Keep commit messages short, imperative, and scoped (e.g., `Switch client tooling to pnpm`).
- Reference related issues in the body, explain behaviour changes, and call out migrations or breaking impacts.
- Pull requests should document test evidence (`dotnet test`, `pnpm run lint`/`pnpm run build`) and include UI screenshots when modifying themes or the backoffice extension.
