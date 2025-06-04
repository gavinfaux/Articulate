# Umbraco 15 Dashboard Migration Guide

This document explains how we migrated the Articulate custom dashboards from the old AngularJS format to the new Umbraco 15 Lit-based web components.

## What Changed

### From Old Format (Pre-Umbraco 15)
- **AngularJS controllers** (`options.controller.js`, `articulatemgmt.controller.js`, etc.)
- **HTML templates** (`package-options.html`, `articulatemgmt.html`, etc.)
- **package.manifest** with dashboard array
- **Multiple separate controllers and views**

### To New Format (Umbraco 15)
- **Lit web components** with single-file components
- **ES6 modules** with modern JavaScript
- **Manifest-based extension system**
- **Dynamic component loading**

## File Structure

### New Umbraco 15 Structure
```
App_Plugins/Articulate/
├── umbraco-package.json                    # Main package definition
├── articulate.js                           # Bundle entry point
├── Dashboards/
│   └── articulate-dashboard/
│       ├── articulate-dashboard.element.js # Main dashboard component
│       └── manifests.js                    # Dashboard manifest
└── Dashboards/components/
    └── blog-importer.element.js            # Sub-component example
```

### Old Structure (kept for reference)
```
App_Plugins/Articulate/
├── package.manifest                        # Old manifest format
└── BackOffice/PackageOptions/
    ├── options.controller.js               # Main controller
    ├── package-options.html                # Main template
    ├── articulatemgmt.controller.js        # Management controller
    ├── articulatemgmt.html                 # Management template
    ├── blogimporter.controller.js          # Importer controller
    ├── blogimporter.html                   # Importer template
    └── ...                                 # Other components
```

## Key Components Explained

### 1. Main Dashboard Component (`articulate-dashboard.element.js`)
```javascript
import { LitElement, html, css } from 'lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';

export default class ArticulateDashboardElement extends UmbElementMixin(LitElement) {
    static styles = css`
        /* Modern CSS with Grid layout, hover effects, transitions */
    `;

    static properties = {
        viewState: { type: String },      // Reactive state management
        selectedGroup: { type: Object },  // Current selection
        justInstalled: { type: Boolean }  // Installation status
    };

    // Modern async component loading
    async openGroup(group) {
        if (group.component === 'articulate-blog-importer') {
            await import('../components/blog-importer.element.js');
        }
    }
}
```

### 2. Dashboard Manifest (`manifests.js`)
```javascript
export const manifests = [
    {
        type: 'dashboard',
        alias: 'Articulate.Dashboard',
        name: 'Articulate Dashboard',
        element: () => import('./articulate-dashboard.element.js'),
        meta: {
            label: 'Articulate',
            pathname: 'articulate'
        },
        conditions: [
            {
                alias: 'Umb.Condition.SectionAlias',
                match: 'Umb.Section.Settings'
            }
        ]
    }
];
```

### 3. Sub-Components (`blog-importer.element.js`)
```javascript
export default class BlogImporterElement extends UmbElementMixin(LitElement) {
    static properties = {
        articulateNodeId: { type: String },
        blogMlFile: { type: Object },
        // ... all form properties as reactive properties
    };

    async submitImport() {
        // Modern fetch API instead of AngularJS $http
        const response = await fetch(url, { method: 'POST', body: formData });
    }
}
```

## Migration Benefits

### Modern Architecture
- **Reactive Properties**: Automatic re-rendering when data changes
- **CSS Grid & Flexbox**: Modern responsive layouts
- **ES6 Modules**: Better code organization and tree-shaking
- **Async/Await**: Cleaner asynchronous code

### Improved User Experience
- **Responsive Design**: Works on all screen sizes
- **Hover Effects**: Visual feedback for interactive elements
- **Smooth Transitions**: Professional animations
- **Better Typography**: Improved readability

### Developer Experience
- **Type Safety**: Can easily add TypeScript
- **Hot Reload**: Faster development cycles
- **Modern Tooling**: Better debugging and development tools
- **Component Isolation**: Each component is self-contained

## Key Features Implemented

### 1. Welcome Screen
- Shows installation message when first installed
- Links to documentation and setup guides
- Responsive image and text layout

### 2. Management Grid
- Card-based layout for management tools
- Hover effects with elevation
- Icon-based visual hierarchy
- Click-to-navigate functionality

### 3. Detail Views
- Dynamic component loading
- Back navigation with breadcrumb
- Full-featured sub-components
- Maintained all original functionality

### 4. Blog Importer Example
- Complete form with all original fields
- File upload handling
- Toggle switches for boolean options
- Status messages and progress indication
- Download links for exported files

## Migration Steps for Other Dashboards

1. **Analyze the old structure**
   - Identify all controllers and templates
   - Map out the data flow and interactions
   - Note any special dependencies

2. **Create the main dashboard component**
   - Convert AngularJS controller to Lit component
   - Replace `$scope` with reactive properties
   - Convert templates to Lit html templates
   - Update styling to modern CSS

3. **Create sub-components**
   - Break down complex views into separate components
   - Convert forms to use modern input handling
   - Replace `$http` with fetch API
   - Add proper error handling

4. **Create manifests**
   - Define dashboard manifest with proper conditions
   - Set up dynamic imports for code splitting
   - Configure proper section and pathway

5. **Update bundle**
   - Add manifest imports to main bundle
   - Test dynamic component loading
   - Verify all routes work correctly

## Testing the Migration

To test the migrated dashboard:

1. **Build the project**: `dotnet build`
2. **Run the test website**
3. **Navigate to Settings section**
4. **Look for "Articulate" dashboard**
5. **Test all functionality**:
   - Welcome screen (if new installation)
   - Management grid navigation
   - Blog importer form
   - File uploads and submissions
   - Back navigation

## Backward Compatibility

- **API Endpoints**: All existing endpoints remain unchanged
- **Data Format**: Same data structures and validation
- **Functionality**: All features maintained or improved
- **User Experience**: Enhanced but familiar workflow

## Future Enhancements

- **TypeScript**: Add type safety to components
- **Unit Tests**: Test individual components
- **Umbraco UI Library**: Use official Umbraco design system components
- **Progressive Enhancement**: Add offline capabilities
- **Better Error Handling**: More robust error states
- **Accessibility**: Improve screen reader support

## Performance Improvements

- **Code Splitting**: Components load only when needed
- **Smaller Bundle**: Eliminates AngularJS dependency
- **Modern Browser APIs**: Better performance on modern browsers
- **Optimized Rendering**: Lit's efficient update cycle