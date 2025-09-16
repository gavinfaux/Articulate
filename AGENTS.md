# AGENTS.md - Development Guide for Articulate

## Build/Test Commands

- **Build**: `dotnet build src/Articulate.sln --configuration Release`
- **Clean**: `dotnet clean src/Articulate.sln --configuration Release`
- **Pack**: `dotnet pack src/Articulate.sln --output build/Release --configuration Release`
- **Test (single)**: `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj --filter "FullyQualifiedName~TestName"`
- **Test (all)**: `dotnet test src/Articulate.UnitTests/Articulate.UnitTests.csproj`
- **Client build**: `cd src/Articulate.Api.Management/Client && npm run build`
- **Client dev**: `cd src/Articulate.Api.Management/Client && npm run dev`
- **Client lint**: `cd src/Articulate.Api.Management/Client && npm run lint`
- **Client typecheck**: `cd src/Articulate.Api.Management/Client && npm run check`

## Architecture

- **Main Project**: `src/Articulate/` - Core blog engine library for Umbraco
- **Web Project**: `src/Articulate.Web/` - Razor views / front end/ Themes
- **API**: `src/Articulate.Api.Management/` - Management API with TypeScript client
- **Backoffice Extension**: `src/Articulate.Api.Management/Client/` - Lit/TypeScript Umbraco backoffice extension
- **Tests**: `src/Articulate.UnitTests/` - xUnit test project with FluentAssertions
- **WebSite Project**: `src/Articulate.Tests.WebSite/` - Demo/development web application
- **Models**: Content models (PostModel, ListModel, MasterModel) with theme inheritance
- **Themes**: Located in `wwwroot/App_Plugins/Articulate/Themes/` with shared base theme system (in Web project)

## Code Style

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
