# Articulate 6.0.0 Release Notes

## Overview

Articulate 6.0.0 represents a major version upgrade that introduces significant architectural improvements and modernizes the entire codebase. This release transitions from the legacy AngularJS backoffice to a modern Lit and TypeScript architecture, while also upgrading to the latest .NET and Umbraco versions.

**Previous Version:** Articulate 5.1.1  
**New Version:** Articulate 6.0.0  
**Release Type:** Major Version (Breaking Changes Included)

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
- **Node.js**: A new requirement for client-side development is Node.js ≥22 and npm ≥10.9.2.

### Package & API Changes

- **Project names vs NuGet Package IDs**
  - The package structure has changed. The main `Articulate` project still contains the front end models, controllers, core logic and public API, but is now packaged as `Articulate.Core`.
  - The backoffice extension and related management API is now in `Articulate.Api.Management`
  - Views (themes) and related assets are now in the `Articulate.Web` project and are packaged as `Articulate`.
  - Installing/updating to the v6 `Articulate` package will bring in the API and Web package dependencies.
- **Asset Locations**
  - Client-side assets have moved from `App_Plugins\Articulate` to `wwwroot\App_Plugins\Articulate` to align with modern .NET static asset handling.
  - Views are now compiled into the `Articulate.Web` project and are no longer in `App_Plugins\Articulate\Themes` folder when package installed. Custom themes and overrides are still supported in installations via the `Views\Articulate` folder (changed from `Views\ArticulateThemes`).
- **API Endpoints**: All backoffice API endpoints have been restructured. Custom integrations will need to be updated.
- **Build Process**: The client-side build process is now managed by npm/Vite. See the Client development setup for new commands.
- **Public API**: The public API has been updated to use modern Umbraco/.NET patterns and conventions, some methods or signatures will have changed, been marked as obsolete (replaced with alternative method calls) or removed. For example ILocalizationService has changed to ILanguageService, IVariationContextAccessor has been removed.

## 🔄 Migration Guide

### For Existing Articulate 5.x Users

1. **Backup**: Create full backup of your Umbraco installation and Articulate content
2. **Umbraco Upgrade**: Upgrade to Umbraco 15.2.3+ or 16+ first
3. **Package Installation**: Install Articulate 6.0.0 via NuGet or Umbraco package
4. **Post-Installation**: Follow the new post-installation checks in the README
5. **Data Migration**: Re-run Articulate package migrations if needed
6. **Theme Updates**: Verify and update custom themes for compatibility

- NOTE: Built in themes still use the older MasterPage based system rather than the newer MVC Layout system, these may be updated in a future release.
- You can use the backoffice Theme copy feature to copy a built in theme to the user themes folder and then customize the Master page and related Views/Partials/Assets; this is the recommended approach for customizing themes.
- If you want to override a built in themes layout or assets (CSS/JS etc) you will need to clone the complete theme and customize the Master page and related Views/Partials/Assets.
- If you just want to override specific Views or Partials in a built-in theme, for example amend the VAPOUR List view render or use an infinite pager you just need to place your custom version in the user themes folder with the same theme name, e.g. `Views\Articulate\VAPOR\List.cshtml` or `Views\Articulate\VAPOR\Partials\Pager.cshtml`. You can either use the Theme clone feature for this and then delete any file you don't need to change, or manually get the file(s) from the GitHub repository and place it in the user themes folder.

### Development Setup

The backoffice extension is now a modern web application built with `@umbraco-cms/backoffice`, Web components (Lit + Umbraco UUI) and TypeScript. This is now located in the `Articulate.Api.Management` projects `Client` folder. Building/packaging the solution will run the Vite build process and copy the output files to the `wwwroot/App_Plugins/Articulate/BackOffice` folder where the .NET build will package as static web assets.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Generate API client (after starting Umbraco)
npm run generate:api

# Build for production
npm run build
```

## 🐛 Known Issues & Limitations

### Current Limitations

- **Umbraco 13+ Image Display**: Known issue with **example** media display (resolved by saving the `Articulate Image Picker` data type in the backoffice)
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
