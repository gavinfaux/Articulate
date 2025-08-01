# Articulate Migration Guide

This guide provides a comprehensive overview of the migration of the Articulate backoffice from its legacy AngularJS implementation to the modern Lit and TypeScript-based architecture for Umbraco 15. The backoffice extensions for Articulate, including property editors and dashboards, have been rebuilt to align with the latest Umbraco standards. This migration involves moving away from deprecated AngularJS controllers and views in favor of Lit-based web components, TypeScript, and the new Umbraco UI (UUI) design system. This document details the key architectural changes, the new development workflow, and the structure of both the front-end and back-end code.

## 1. Core Architectural Changes

Several fundamental architectural changes were made during the migration to .NET 8 and Umbraco 15.

### Razor Class Library (RCL)

The project SDK was migrated from `Microsoft.NET.Sdk` to `Microsoft.NET.Sdk.Razor`. This turns the project into a Razor Class Library (RCL), which is the modern standard for shipping packages with compiled Razor views and static assets (`.js`, `.css`, etc.).

### `wwwroot` for Static Assets

As part of the move to RCL, all client-side assets have been moved from the root `App_Plugins` folder to a `wwwroot` directory within the project (`src/Articulate/wwwroot`). This includes:

- The compiled backoffice client application.
- Razor themes.
- The mobile-optimized Markdown Editor.

These assets are now published with the package and served as static web assets, which is a more robust and standard way of handling them in .NET.

### Markdown Editor Migration (AngularJS to Alpine.JS)

The mobile-optimized Markdown Editor, a key feature of Articulate, has been migrated from its original AngularJS 1.2 implementation to a modern, lightweight version using the CSP-compliant build of Alpine.JS. This removes the last dependency on AngularJS and improves security and performance.

## 2. The Old Architecture: AngularJS

The legacy backoffice implementation for Articulate was built using AngularJS. This approach involved a combination of JavaScript controllers and HTML views, which were registered with Umbraco through a `package.manifest` file.

### Key Characteristics

- **AngularJS Controllers**: Separate JavaScript files (e.g., `themepicker.controller.js`, `articulatemgmt.controller.js`) contained the logic for property editors and dashboards.
- **HTML Templates**: Each controller was paired with an HTML template (e.g., `ThemePicker.html`, `articulatemgmt.html`) that defined the UI.
- **`package.manifest`**: A JSON file was used to register all components, including property editors, dashboards, and their associated JavaScript and CSS files.
- **C# DataEditors**: The server-side implementation of property editors often required complex constructors with multiple dependencies.
- **Fragmented Structure**: The codebase was often fragmented into multiple small files for controllers and views, making it harder to maintain.

## 3. The New Architecture: Lit & TypeScript

The new backoffice is built on a modern front-end stack that leverages Lit, TypeScript, and ES6 modules. This aligns with Umbraco's shift towards a more standardized and maintainable extension model. The new architecture promotes the use of single-file components, which encapsulate both the template and logic, making them easier to manage.

### Key Components

- **Lit Web Components**: For building reactive and maintainable UI elements.
- **TypeScript**: For type safety and improved developer experience.
- **@umbraco-cms/backoffice**: The official package for building backoffice extensions.
- **UUI (Umbraco UI Library)**: A set of reusable web components for a consistent look and feel.

## 4. API Client Generation with OpenAPI/Swagger

The new architecture leverages OpenAPI (formerly Swagger) to generate a strongly-typed TypeScript API client. This eliminates the need for manual API-wrangling and ensures that the front-end client is always in sync with the back-end API.

### The Process

1. **API Definition**: The C# API controllers in `src/Articulate/Controllers/Api` are decorated with attributes that allow for the automatic generation of an `openapi.json` specification.
2. **Swagger Configuration**:

    - `ArticulateApiComposer.cs`: This class registers the necessary services for Swagger generation.
    - `ArticulateSwaggerOptions.cs`: This class configures the Swagger document, including metadata like the title, description, and license. It also includes XML comments from the C# code to provide detailed descriptions of the API endpoints.

3. **Client Generation**: The `hey-api/openapi-ts` tool is used to read the generated `openapi.json` file and produce a TypeScript client. This client provides strongly-typed methods for all API endpoints, making it easy and safe to consume the API from the front-end.

## 5. Key Files and Locations

Here is a list of key files and directories in the new architecture:

- **Client-Side Source Code**: `src/Articulate/Client/src`
  - This directory contains all the TypeScript source files for the Lit-based web components.

- **Generated API Client**: `src/Articulate/Client/src/api/client`
  - The OpenAPI-generated TypeScript client is located here. It is generated from the back-end API definition.

- **Compiled Backoffice Assets**: `src/Articulate/wwwroot/App_Plugins/Articulate/Backoffice`
  - The compiled and bundled JavaScript files that are served to the browser are located here. These are the files that Umbraco loads.

- **API Controllers**: `src/Articulate/Controllers/Api`
  - The C# controllers that define the backoffice API endpoints.

- **API Models**: `src/Articulate/Models/Api`
  - The C# models used by the API controllers.

- **Swagger Configuration**:
  - `src/Articulate/Components/ArticulateApiComposer.cs`
  - `src/Articulate/Options/ArticulateSwaggerOptions.cs`
  - These files are responsible for configuring the Swagger/OpenAPI generation.

- **Markdown Editor Package**: `src/Articulate/Client/src/packages/markdown-editor`
  - Contains the source code for the Markdown Editor, which is a clone of the `Umbraco.Web.UI.Client` markdown-editor package.

## 6. Markdown Editor

The Markdown Editor used in Articulate's backoffice is a direct clone of the `markdown-editor` package found in `Umbraco.Web.UI.Client`. This was done to ensure that Articulate has a stable, feature-rich markdown editing experience that is consistent with the Umbraco backoffice.

By maintaining a local copy, we can avoid potential breaking changes from upstream updates and have the flexibility to apply customizations if needed in the future. The source code for this component is located in `src/Articulate/Client/src/packages/markdown-editor`.

## 7. Development Workflow and Build Process

This section details how the front-end assets are developed, built, and integrated with Umbraco. The entire process is managed through npm scripts and a set of custom Node.js scripts.

### `package.json`

Located in `src/Articulate/Client`, this file is the heart of the front-end project. It defines:

- **Dependencies**: Third-party libraries like Lit, TypeScript, and Vite are managed here.
- **Scripts**: The `scripts` section contains commands for common tasks:
  - `dev`: Starts a Vite development server for live-reloading.
  - `build`: Compiles the TypeScript code and bundles it for production.
  - `generate:api`: Runs a custom script to generate the TypeScript API client.
  - `lint`: Lints the codebase to ensure code quality.

### Custom Build Scripts (`src/Articulate/Client/scripts`)

- **`generate-api.js`**: This script uses `@hey-api/openapi-ts` to connect to a running instance of the Articulate site, fetch the OpenAPI/Swagger JSON definition, and generate a fully typed TypeScript client. This ensures the front-end is always in sync with the back-end API.
- **`post-build.js`**: After Vite creates the production build in the `dist` folder, this script copies the final JavaScript bundles and assets to the correct location within `src/Articulate/wwwroot/App_Plugins/Articulate/Backoffice`, making them available to Umbraco.
- **`set-version.js`**: This utility synchronizes the version number across `package.json` and `umbraco-package.json`, ensuring consistency for releases.

### `umbraco-package.json`

This file, located in `src/Articulate/Client/public`, is the modern manifest for Umbraco extensions. It tells Umbraco how to load the backoffice assets. In this case, it registers a single JavaScript bundle (`articulate.js`) which contains all the necessary code for the property editors and dashboards.

### Putting It All Together: The End-to-End Flow

1. **Development**: A developer runs `npm run dev` to start the Vite development server. They can then make changes to the Lit components in `src/Articulate/Client/src` with hot-reloading.
2. **API Changes**: If a C# API endpoint is modified, the developer runs `npm run generate:api` to update the TypeScript client.
3. **Building for Production**: When development is complete, `npm run build` is executed. This command runs a sequence of tasks: it compiles the TypeScript, builds the assets with Vite, and then runs the `post-build.js` script.
4. **Integration with Umbraco**: The `post-build.js` script places the final assets in the `wwwroot` directory. When the Umbraco backoffice loads, it reads the `umbraco-package.json` file and includes the specified JavaScript bundle, making the new backoffice extensions available to the user.

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

### Reusable Components (`src/Articulate/Client/src/components`)

This directory contains the individual views that are managed by the main dashboard router. These are standalone components that handle specific tasks:

- **`blogml-importer.element.ts` / `blogml-exporter.element.ts`**: Handle the logic for importing and exporting BlogML data.
- **`theme-options.element.ts`**: Provides UI for managing theme settings.
- **`dashboard-options.element.ts`**: The default view for the dashboard, providing links to the other sections.

### Utilities (`src/Articulate/Client/src/utils`)

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

### API Controllers (`src/Articulate/Controllers/Api`)

These are standard Umbraco API controllers that handle requests from the backoffice. They are the bridge between the front-end Lit components and the back-end services.

- **`ThemePickerApiController.cs`**: Provides an endpoint to get a list of available themes.
- **`ThemeOptionsApiController.cs`**: Exposes endpoints for managing theme settings, such as copying a default theme to create a user-editable version.
- **`BlogMlApiController.cs`**: Handles the logic for importing and exporting BlogML files.
- **`MarkdownEditorApiController.cs`**: Provides server-side functionality for the Markdown editor, such as handling image uploads.

### API Models (`src/Articulate/Models/Api`)

These are simple C# classes (POCOs) that define the data structures (Data Transfer Objects or DTOs) for requests and responses used by the API controllers. They ensure that data is consistently structured between the client and server.

### Theme & View Resolution (The New Way)

In older versions, view resolution was handled by a custom `IViewEngine` and `PathHelper`. This has been replaced with a modern, Umbraco-idiomatic approach using view location expanders and resolvers.

- **`ArticulateThemeResolver.cs`**: This service is responsible for determining which theme should be active for a given request. It inspects the current content node and its ancestors to find the configured theme.
- **`ArticulateViewLocationExpander.cs`**: This is the core of the new view resolution system. It plugs into the ASP.NET Core MVC rendering pipeline and tells it where to find the Razor views for a given theme. It uses `ArticulateThemeResolver` to get the active theme and then points MVC to the correct view paths within the theme's directory (e.g., `~/Views/ArticulateThemes/{ThemeName}/{ViewName}.cshtml`).

### Asset Bundling & The Service Layer

With the move to RCL, the bundling and serving of theme assets (CSS, JS) has also been modernized.

- **`ArticulateComponent.cs`**: This component runs on startup and is responsible for creating the client-side bundles for each theme. It iterates through the `DefaultThemes` and uses the `IBundleManager` (from the Smidge package) to register the CSS and JS files for each theme.
- **`DefaultThemes.cs`**: This static class defines the list of built-in themes. Its primary role now is to provide the asset paths for each theme to the `ArticulateComponent` so they can be bundled correctly as RCL static web assets.
- **`PathHelper.cs`**: The role of this class has been significantly reduced. It is no longer used for resolving view paths. Instead, it now primarily serves as a helper to provide the correct virtual paths to theme *assets* (CSS/JS) for the bundling process, distinguishing between built-in themes (served from `_content/Articulate/Themes/...`) and user-created themes (served from `~/Views/ArticulateThemes/...`).
- **`ArticulateThemeRepository.cs`**: This service remains responsible for the business logic of managing themes, such as retrieving theme lists and handling the copying of default themes to the user-editable `~/Views/ArticulateThemes` directory.

### C# Property Editors (`src/Articulate/PropertyEditors`)

These classes define the server-side configuration for the custom property editors.

- **`ThemePickerPropertyEditor.cs`**: Defines the `Articulate.ThemePicker` property editor, linking it to the front-end `<theme-picker-element>`.
- **`ThemePickerConfigurationEditor.cs`**: Provides the configuration UI for the theme picker, allowing developers to set default values.
- **`ArticulateMarkdownPropertyEditor.cs`**: The server-side definition for the custom Markdown editor.

### Swagger & API Generation (`Components` and `Options`)

- **`ArticulateApiComposer.cs`**: This composer runs on startup and registers the Swagger/OpenAPI services with Umbraco's dependency injection container.
- **`ArticulateSwaggerOptions.cs`**: This class configures Swagger to generate the API documentation for the Articulate controllers. It defines the document info (title, version) and ensures that the XML comments from the C# code are included in the generated `swagger.json` file. This file is the single source of truth for the front-end API client.
