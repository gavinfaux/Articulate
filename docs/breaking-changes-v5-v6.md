# Articulate C# API Breaking Changes: v5 vs v6

This document provides a detailed list of breaking changes to the public C# API between Articulate version 5.x and 6.0.0 (including prerelease builds). It is intended for developers who are extending Articulate or have custom code that interacts with its C# services, controllers, or models.

## 1. Package Structure

**Reasoning:** The package structure has been updated to align with modern .NET and Umbraco standards for Razor Class Libraries (RCL) and package definitions.

**Impact:** Project files (`.csproj`) must be updated to reference the new package ID. The way client-side assets are located and served has also changed.

### Key Package Structure Changes

| Old Approach | New Approach | Status & Notes |
| --- | --- | --- |
| NuGet ID: `Articulate` | NuGet ID: `Articulate.Core` | **Changed**. The NuGet package identifier has been renamed. You must update your project references. |
| Assets in `/App_Plugins/` | Assets in `wwwroot/App_Plugins/Articulate/` | **Moved**. As a Razor Class Library, client-side assets are now served from the `wwwroot` directory. |
| `package.manifest` | `umbraco-package.json` | **Replaced**. The package manifest now uses the modern `umbraco-package.json` format, which supports Vite asset paths and more. |

## 2. Project Restructuring: Introduction of `Articulate.Api.Management`

The most significant architectural change in v6 is the introduction of a new, separate project: `Articulate.Api.Management`. This project now contains all the back-office API controllers, property editors, and related models that were previously part of the main `Articulate` project.

**Reasoning:** This separation isolates the back-office management API from the core front-end rendering logic, leading to a cleaner, more maintainable architecture.

**Impact:** If you have custom code that references any of the back-office API controllers or property editors, you will need to update your references to target the types within the `Articulate.Api.Management` assembly.

### Moved and Replaced API Controllers

Many of the old API controllers have been removed from the `Articulate` project and replaced with new, more focused controllers in `Articulate.Api.Management`. Below is a summary of the key changes.

| Old Controller (in `Articulate`) | New Controller (in `Articulate.Api.Management`) | Status & Notes |
| --- | --- | --- |
| `ArticulateBlogImportController` | `BlogMlApiController` | **Replaced**. The new controller handles both BlogML import and export. |
| `ThemeEditorController` | `ThemeOptionsApiController` | **Replaced**. Manages theme settings and copying. |
| `ArticulatePropertyEditorsController` | `ThemePickerApiController` | **Replaced & Refactored**. Logic is now split. `ThemePickerApiController` handles theme selection. |
| `MardownEditorApiController` | `MarkdownEditorApiController` | **Replaced**. Handles server-side markdown operations like image uploads. |

## 3. Theming and View Resolution Overhaul

The entire system for resolving and rendering theme views has been modernized to align with current Umbraco and ASP.NET Core best practices.

**Reasoning:** The old `IViewEngine`-based approach was complex and not standard for modern .NET. The new system is more robust, easier to maintain, and leverages built-in ASP.NET Core features.

**Impact:** Any custom code that interacted with the old view engines or relied on `PathHelper` for view resolution will be broken and must be migrated.

### Key Theming Changes

| Old Component | New Component / Approach | Status & Notes |
| --- | --- | --- |
| Manual path resolution via `PathHelper` | `ArticulateViewLocationExpander` | **Replaced**. In v5, controllers manually resolved view paths using `PathHelper.GetThemeViewPath`. In v6, this is handled automatically by the `ArticulateViewLocationExpander`, which integrates with the standard MVC view resolution pipeline. |
| Direct theme folder access | `IArticulateThemeRepository` | **Replaced**. Business logic for managing themes (listing, copying) is now handled by the `ArticulateThemeRepository` service. |

## 4. Property Editor Refactoring and Removal

The custom property editors included with Articulate have been significantly refactored. The C# definitions have been moved to the `Articulate.Api.Management` project, and several editors have been removed entirely.

**Reasoning:** This change simplifies the core package by removing specialized editors that can be replaced by standard Umbraco components (e.g., the built-in Tag editor). It also aligns the remaining editors with the new back-office architecture.

**Impact:** If you were using the removed property editors in your document types, you will need to replace them with alternatives. If you were customizing the remaining editors, you will need to update your code to reflect their new location and structure.

### Key Property Editor Changes

| Property Editor | Status & Notes |
| --- | --- |
| `ArticulateMarkdownPropertyEditor` | **Moved**. The C# definition is now in `Articulate.Api.Management`. The front-end is now Lit-based. |
| `ThemePickerPropertyEditor` | **Moved**. The C# definition is now in `Articulate.Api.Management`. The front-end is now Lit-based. |

## 5. Startup, Composition, and Components

The way Articulate hooks into the Umbraco startup lifecycle has been updated to align with modern .NET Core and Umbraco 9+ patterns.

**Reasoning:** The removal of `IComponent` and the shift towards dependency injection and the options pattern required a full refactoring of the startup logic.

**Impact:** Any custom code that relied on the old `ArticulateComponent` or the `ServerVariablesParsingHandler` will be broken.

### Key Startup Changes

| Old Component | New Component / Approach | Status & Notes |
| --- | --- | --- |
| `ArticulateComponent` | N/A | **Removed**. The `IComponent` interface is obsolete. Logic has been moved into composers and services. |
| `ArticulateComposer` | `ArticulateComposer` & `ArticulateApiComposer` | **Refactored**. The main composer's role is refined. A new `ArticulateApiComposer` in `Articulate.Api.Management` now handles back-office API setup. |
| `ServerVariablesParsingHandler` | N/A | **Removed**. The new Lit-based back-office does not use the legacy `serverVars` object for configuration. |
| `ConfigureArticulateMvcOptions` | Standard `IConfigureOptions` | **Refactored**. This class now implements the standard `IConfigureOptions<MvcOptions>` pattern to configure MVC, replacing older methods of configuration. |

## 6. Models and Helper Classes

Several core models and helper classes have been updated or replaced.

### Key Model & Helper Changes

| Old Component | New Component / Approach | Status & Notes |
| --- | --- | --- |
| `Theme` (model) | `ThemeCopyModel` / `IEnumerable<string>` | **Replaced**. The rich `Theme` model from v5 has been removed. API endpoints now return simple theme names (`string`) or use specific models like `ThemeCopyModel` for operations. |
| `ExportBlogMlModel` | N/A | **Removed**. This model, used for BlogML export, has been removed as this functionality is now handled by the back-office API. |
| `ImportBlogMlModel` | N/A | **Removed**. This model, used for BlogML import, has been removed as this functionality is now handled by the back-office API. |
| `ImportModel` | N/A | **Removed**. This model, used for BlogML import, has been removed as this functionality is now handled by the back-office API. |
| `MardownEditorModel` | N/A | **Removed**. This model, used for the back-office Markdown editor, has been removed. |
| `MarkdownEditorInitModel` | N/A | **Removed**. This model, used for the back-office Markdown editor, has been removed. |
| `PostCopyThemeModel` | N/A | **Removed**. This model, used for copying themes, has been removed as this functionality is now handled by the back-office API. |

## 7. Public Method Signature Changes

Several public helper methods have had their signatures changed or have been marked as obsolete.

### Key Method Changes

| Class | Method | Status & Notes |
| --- | --- | --- |
| `PublishedContentExtensions` | `GetArticulateCropUrl(...)` | **Obsolete**. This extension method is now obsolete and will be removed in a future version. Use the standard `.GetCropUrl()` extension method provided by Umbraco instead. The `variationContext` parameter is no longer used in the v6 implementation. |
| `UrlHelperExtensions` | All Methods | **Obsolete & Replaced**. The entire `UrlHelperExtensions` class is obsolete. All URL generation methods (e.g., `ArticulateRssUrl`, `ArticulateTagsUrl`) have been moved to extension methods on the models themselves (e.g., `IMasterModel`, `PostModel`). Instead of `@Url.ArticulateRssUrl(Model)`, you should now use `@Model.ArticulateRssUrl()`. |

## 8. New Projects and Back-Office API Refactoring

In v6, all back-office API controllers and related logic have been moved into a new, separate project: `Articulate.Api.Management`. A new `Articulate.Web` project has also been introduced to serve front-end assets.

**Reasoning:** This creates a clear separation between the core Articulate functionality, the back-office management API, and front-end components. It aligns with modern .NET architecture and makes the solution easier to maintain and extend.

**Impact:** Any integrations that were directly calling the old back-office API controllers will be broken. The old controllers have been removed and replaced by new ones in the `Articulate.Api.Management` project with different routes and authorization policies. The table below summarizes the replacements.

### Back-Office API Controller Replacements

| Old Controller (in `Articulate`) | New Controller (in `Articulate.Api.Management`) | Status & Notes |
| --- | --- | --- |
| `ArticulateBlogImportController` | `BlogMlApiController` | **Replaced**. Handles BlogML import and export. |
| `MardownEditorApiController` | `MarkdownEditorApiController` | **Replaced**. Provides the back-end for the Markdown editor. |
| `ThemeEditorController` | `ThemeOptionsApiController` | **Replaced**. Manages theme files and options. |
| `ArticulatePropertyEditorsController` | `ThemePickerApiController` | **Replaced**. The theme picker logic is now in its own dedicated controller. |

## 9. Development and Build Process

**Reasoning:** The front-end has been modernized from legacy AngularJS to a Lit and TypeScript stack, which requires a modern client-side build pipeline.

**Impact:** The development workflow is fundamentally different. Developers working on the source code or building from source will need to install Node.js and use pnpm scripts. Projects hosting Articulate for testing will also require a configuration change.

### Key Development & Build Changes

| Area | Change | Status & Notes |
| --- | --- | --- |
| **Build Tools** | Node.js/pnpm Requirement | **New Requirement**. A Node.js-based build process (using Vite) is now required to build the back-office client-side assets. You must have Node.js and pnpm installed. |
| **Build Commands** | `pnpm run build` | **New Requirement**. To produce the final client-side assets, you must run `pnpm install` followed by `pnpm run build` from the `src/Articulate/` directory. |
| **Host Project Setup** | `<CopyStaticWebAssetsToPublish>` | **New Requirement**. Any web project that references the `Articulate` project (e.g., a test site) must include `<CopyStaticWebAssetsToPublish>true</CopyStaticWebAssetsToPublish>` in its `.csproj` file to ensure the back-office assets are correctly copied on build. |

## 10. Front‑end Markdown Editor route disabled

| Area | Change | Status & Notes |
| --- | --- | --- |
| Front‑end editor route | `/a-new` | **Disabled/Redirected**. In v6 the front‑end editor is removed. Requests to `/a-new` now 302‑redirect to the blog home. Creating new posts is handled by the backoffice Markdown editor (Articulate.Api.Management). |

