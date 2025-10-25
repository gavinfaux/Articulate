# Articulate 6.0.0-beta Release Notes

## Overview

Articulate 6.0.0-beta represents a major version upgrade that introduces significant architectural improvements and modernizes the entire codebase. This prerelease transitions from the legacy AngularJS backoffice to a modern Lit and TypeScript architecture, while also upgrading to the latest .NET and Umbraco versions. Feedback from this beta will shape the general-availability release.

**Previous Version:** Articulate 5.1.1  
**New Version:** Articulate 6.0.0-beta  
**Release Type:** Prerelease (Beta)

## 🚀 Major Updates & New Features

### Architectural Overhaul

- **Framework Modernization**: Upgraded to .NET 9.0 and converted projects to `Microsoft.NET.Sdk.Razor` (Razor Class Library).
- **Backoffice Rewrite**: The backoffice has been completely rewritten from AngularJS to a modern stack using Lit, TypeScript, and Vite for a faster, type-safe, and more maintainable experience.
- **API Enhancements**: Introduced new RESTful API controllers with comprehensive, auto-generated OpenAPI/Swagger documentation and strongly-typed TypeScript client generation.
- **Enhanced Development Workflow**: Integrated modern tooling including Vite, ESLint, and Prettier to improve code quality and developer experience.
- **Modernized Theming**: The theme and view resolution system has been updated to use modern ASP.NET Core MVC patterns, via an `IViewLocationExpander` that resolves first to custom user themes in the `Views\Articulate` folder, then falls back to the built-in themes.

### Package Restructuring

To improve modularity and maintainability, the single Articulate package from v5 has been partitioned into three distinct NuGet packages:

- **`Articulate`**: The main package that includes theme files (`.cshtml` templates and assets). Installing this package will automatically pull in the other required dependencies.
- **`Articulate.Core`**: Contains the core business logic, models, controllers, and public APIs.
- **`Articulate.Api.Management`**: Provides the backoffice extension and the supporting management API.
- Installing or updating to the latest `Articulate` package will  install all necessary dependencies.

## ⚠️ Breaking Changes

### System Requirements

- **Umbraco Version**: Requires Umbraco 15.2.3+ (previously 10.1.0).
- **.NET Version**: Requires .NET 9.0 (previously .NET 6.0/7.0/8.0).
- **Node.js**: A new requirement for client-side development is Node.js ≥22 and pnpm ≥10.17.0.

### Package & API Changes

- **Default Themes** - The default built-in themes still use MasterPage layouts and have been updated work with modern browsers, there are no breaking changes to the built-in themes. The built-in themes are now packaged as `Articulate.Web` and are located in the `Themes` folder. 
- **Project names vs NuGet Package IDs**
  - The package structure has changed. The main `Articulate` project still contains the front end models, controllers, core logic and public API, but is now packaged as `Articulate.Core`.
  - The backoffice extension and related management API is now in `Articulate.Api.Management`
  - Views (themes) and related assets are now in the `Articulate.Web` project and are packaged as `Articulate`.
  - Installing/updating to the v6 `Articulate` package will bring in the API and Web package dependencies.
- **Asset Locations**
  - Client-side assets have moved from `App_Plugins\Articulate` to `wwwroot\App_Plugins\Articulate` to align with modern .NET static asset handling.
  - Views are now compiled into the `Articulate.Web` project and are no longer in `App_Plugins\Articulate\Themes` folder when package installed. Custom themes and overrides are still supported in installations via the `Views\Articulate` folder (changed from `Views\ArticulateThemes`).
- **API Endpoints**: All backoffice API endpoints have been restructured. Custom integrations will need to be updated.
- **Build Process**: The client-side build process is now managed by pnpm/Vite. See the Client development setup for new commands.
- **Public API**: The public API has been updated to use modern Umbraco/.NET patterns and conventions, some methods or signatures will have changed, been marked as obsolete (replaced with alternative method calls) or removed. For example ILocalizationService has changed to ILanguageService, IVariationContextAccessor has been removed. If you have custom themes or integrations, you will need to update your code to use the new APIs.

## 🔄 Migration Guide

### For Existing Articulate 5.x Users

1. **Export/Import** - In the back office export BlogML from Articulate 5 instance and then import the BlogML file into Articulate 6.x instance. This will migrate all blog posts and managed media; assets stored in the `media\articulate` folder are **not** migrated.

2. **Upgrade**
  - **Backup**: Create full backup of your Umbraco installation and Articulate content
  - **Umbraco Upgrade**: Upgrade to Umbraco 15.2.3+ or 16+ first
  - **Package Installation**: Install Articulate 6.0.0-beta via NuGet or Umbraco package
  - **Post-Installation**: Follow the new post-installation checks in the README
  - **Data Migration**: Re-run Articulate package migrations if needed
  - **Theme Updates**: Verify and update custom themes and extension points for compatibility

### Development Setup

The backoffice extension is now a modern web application built with `@umbraco-cms/backoffice`, Web components (Lit + Umbraco UUI) and TypeScript. This is now located in the `Articulate.Api.Management` projects `Client` folder. Building/packaging the solution will run the Vite build process and copy the output files to the `wwwroot/App_Plugins/Articulate/BackOffice` folder where the .NET build will package as static web assets.

```powershell
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Generate API client (after starting Umbraco)
pnpm run generate:api

# Build for production
pnpm run build
```

## 🐛 Known Issues & Limitations

### Current Limitations

- **Migration Complexity**: Major version upgrade requires careful planning
- **Custom Themes**: May require updates for full compatibility
- **Third-party Integrations**: Custom API consumers need updates

### Recommended Actions

- Test thoroughly in development environment before production deployment
- Review custom themes and extensions for compatibility
- Update any custom API integrations
- Plan for extended testing period due to architectural changes

## 📚 Additional Resources

- **GitHub Issues**: Report issues at <https://github.com/Shazwazza/Articulate/issues>
- **Umbraco Forums**: Community discussions at <https://forum.umbraco.com/>
- **Documentation**: <https://github.com/Shazwazza/Articulate/wiki>

## 🙏 Acknowledgments

This major version represents a significant investment in modernizing Articulate for the future. Special thanks to the Umbraco community and contributors who helped shape this release.

---

**Release Date:** September 2025  
**Compatibility:** Umbraco 15.2.3+ and 16+  
**License:** MIT  
**Repository:** <https://github.com/Shazwazza/Articulate>





