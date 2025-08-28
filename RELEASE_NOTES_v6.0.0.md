# Articulate 6.0.0 Release Notes

## Overview

Articulate 6.0.0 represents a major version upgrade that introduces significant architectural improvements and modernizes the entire codebase. This release transitions from the legacy AngularJS backoffice to a modern Lit and TypeScript architecture, while also upgrading to the latest .NET and Umbraco versions.

**Previous Version:** Articulate 5.1.2  
**New Version:** Articulate 6.0.0  
**Release Type:** Major Version (Breaking Changes Included)

## 🚀 Major Architectural Changes

### Framework Modernization

- **.NET Upgrade**: Migrated from .NET 6.0/7.0/8.0 to .NET 9.0
- **Project Structure**: Converted from `Microsoft.NET.Sdk` to `Microsoft.NET.Sdk.Razor` (Razor Class Library)
- **Build System**: Introduced modern Vite-based client-side build system

### Front-end Architecture Overhaul

- **Technology Stack Migration**: Complete rewrite from AngularJS 1.2 to Lit Web Components and TypeScript
- **Markdown Editor**: Migrated mobile-optimized Markdown Editor from AngularJS to Alpine.JS (CSP-compliant)
- **Build Tools**: Integrated Vite, ESLint, Prettier, and modern development workflow
- **API Integration**: Implemented OpenAPI/Swagger with strongly-typed TypeScript client generation

### Back-end Improvements

- **Umbraco Compatibility**: Updated to support Umbraco 15.2.3+ and 16+
- **Static Asset Management**: Moved client-side assets to `wwwroot` directory for better static web asset handling
- **API Architecture**: New RESTful API controllers with comprehensive Swagger documentation
- **Theme Resolution**: Modernized theme and view resolution system using ASP.NET Core MVC patterns

## ✨ New Features

### Enhanced Development Experience

- **Type Safety**: Full TypeScript integration with strongly-typed API clients
- **Modern Development Tools**: Vite for fast development builds, hot reloading, and optimized production builds
- **Code Quality**: Integrated ESLint, Prettier, and comprehensive linting rules
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation for all endpoints

### Backoffice Improvements

- **Modern UI Components**: Lit-based web components with Umbraco UI Library integration
- **Enhanced Property Editors**: Redesigned theme picker and markdown editor with improved UX
- **Better Error Handling**: Comprehensive error handling and user feedback systems
- **Responsive Design**: Improved mobile experience across all backoffice interfaces

### API Enhancements

- **RESTful Endpoints**: New API controllers for themes, BlogML operations, and markdown editing
- **OpenAPI Integration**: Complete API documentation and client SDK generation
- **Strongly-typed Clients**: Auto-generated TypeScript clients for seamless front-end integration

## ⚠️ Breaking Changes

### Compatibility Requirements

- **Umbraco Version**: Minimum version increased from 10.1.0 to 15.2.3
- **.NET Version**: Now requires .NET 9.0 (previously supported .NET 6.0/7.0/8.0)
- **Node.js**: New requirement for Node.js ≥22 and npm ≥10.9.2 for client-side development

### Package Structure

- **Package Name**: Changed from `Articulate` to `Articulate.Core` (NuGet package ID)
- **Asset Locations**: Client-side assets moved from `App_Plugins` to `wwwroot/App_Plugins/Articulate/Backoffice`
- **Build Process**: Completely new build pipeline requiring npm/Node.js for client-side compilation

### API Changes

- **Endpoint URLs**: All backoffice API endpoints have been restructured
- **Authentication**: Updated authentication patterns for Umbraco 15+ compatibility
- **Data Contracts**: Modified request/response models for improved type safety

### Development Workflow

- **Project References**: New requirement for `<CopyStaticWebAssetsToPublish>true</CopyStaticWebAssetsToPublish>` in test websites
- **Build Commands**: New npm scripts required for client-side development (`npm run dev`, `npm run build`)
- **Package Manifest**: Replaced `package.manifest` with modern `umbraco-package.json`

## 📦 Dependencies & Compatibility

### Runtime Dependencies

- **Umbraco.Cms.Web.Website**: [15.2.3, 16.999.999)
- **Argotic.Core**: 3001.0.0
- **Markdig**: 0.41.3
- **.NET**: 9.0

### Development Dependencies

- **Node.js**: ≥22.0.0
- **npm**: ≥10.9.2
- **TypeScript**: ~5.9.2
- **Lit**: Latest stable
- **Vite**: ^7.1.2
- **ESLint**: ^9.33.0

### Client-side Dependencies

- **@umbraco-cms/backoffice**: ^15.4.4
- **monaco-editor**: ^0.52.2 (for enhanced markdown editing)
- **@hey-api/openapi-ts**: ^0.80.14 (for API client generation)

## 🔄 Migration Guide

### For Existing Articulate 5.x Users

1. **Backup**: Create full backup of your Umbraco installation and Articulate content
2. **Umbraco Upgrade**: Upgrade to Umbraco 15.2.3+ or 16+ first
3. **Package Installation**: Install Articulate 6.0.0 via NuGet or Umbraco package
4. **Post-Installation**: Follow the new post-installation checks in the README
5. **Data Migration**: Re-run Articulate package migrations if needed
6. **Theme Updates**: Verify and update custom themes for compatibility

### For Developers

1. **Environment Setup**: Install Node.js ≥22 and npm ≥10.9.2
2. **Project Structure**: Familiarize with new Client/ directory structure
3. **Build Process**: Learn new npm-based development workflow
4. **API Integration**: Update any custom API integrations to use new endpoints
5. **Property Editors**: Review and update custom property editor implementations

## 🛠️ Installation & Setup

### Post-Installation Steps

1. **Package Verification**: Check Umbraco backoffice for pending migrations
2. **Umbraco 13+ Fix**: For Umbraco 13+, update the "Articulate Image Picker" data type
3. **Theme Setup**: Verify default themes are properly installed
4. **Permissions**: Ensure proper user permissions for Articulate sections

### Development Setup

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

- **Umbraco 13+ Image Display**: Known issue with example media display (resolved by saving data type)
- **Migration Complexity**: Major version upgrade requires careful planning
- **Custom Themes**: May require updates for full compatibility
- **Third-party Integrations**: Custom API consumers need updates

### Recommended Actions

- Test thoroughly in development environment before production deployment
- Review custom themes and property editors for compatibility
- Update any custom API integrations
- Plan for extended testing period due to architectural changes

## 📚 Additional Resources

- **[Migration Guide](MIGRATION_GUIDE.md)**: Comprehensive developer migration guide
- **GitHub Issues**: Report issues at <https://github.com/Shazwazza/Articulate/issues>
- **Umbraco Forums**: Community discussions at <https://our.umbraco.org/projects/starter-kits/articulate/discussions>
- **Documentation**: <https://github.com/Shazwazza/Articulate/wiki>

## 🙏 Acknowledgments

This major version represents a significant investment in modernizing Articulate for the future. Special thanks to the Umbraco community and contributors who helped shape this release.

---

**Release Date:** January 2025  
**Compatibility:** Umbraco 15.2.3+ and 16+  
**License:** MIT  
**Repository:** <https://github.com/Shazwazza/Articulate>
