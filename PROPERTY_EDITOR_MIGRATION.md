# Umbraco 15 Property Editor Migration Guide

This document explains how we migrated the Articulate property editors from the old AngularJS format to the new Umbraco 15 Lit-based web components.

## What Changed

### From Old Format (Pre-Umbraco 15)
- **AngularJS controllers** (`themepicker.controller.js`)
- **HTML templates** (`ThemePicker.html`)
- **package.manifest** with JavaScript array
- **C# DataEditor** with multiple constructor parameters

### To New Format (Umbraco 15)
- **Lit web components** (`theme-picker.element.js`)
- **ES6 modules** with modern JavaScript
- **umbraco-package.json** with extension manifests
- **Simplified C# DataEditor** with minimal dependencies

## File Structure

### New Umbraco 15 Structure
```
App_Plugins/Articulate/
├── umbraco-package.json                    # Main package definition
├── articulate.js                           # Bundle entry point
└── PropertyEditors/
    └── theme-picker/
        ├── theme-picker.element.js         # Lit web component
        └── manifests.js                     # Property editor manifest
```

### Old Structure (kept for reference)
```
App_Plugins/Articulate/
├── package.manifest                        # Old manifest format
└── BackOffice/PropertyEditors/
    ├── themepicker.controller.js           # AngularJS controller
    └── ThemePicker.html                     # HTML template
```

## Key Components Explained

### 1. Web Component (`theme-picker.element.js`)
```javascript
// Uses Lit for modern web component development
import { LitElement, html, css } from 'lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';

export default class ArticulateThemePickerElement extends UmbElementMixin(LitElement) {
    // Modern reactive properties
    static properties = {
        value: { type: String },
        themes: { type: Array },
        loading: { type: Boolean }
    };
    
    // Fetch API instead of AngularJS $http
    async loadThemes() {
        const response = await fetch(`${baseUrl}GetThemes`);
        this.themes = await response.json();
    }
}
```

### 2. Property Editor Manifest (`manifests.js`)
```javascript
export const manifests = [
    {
        type: 'propertyEditorUi',
        alias: 'ArticulateThemePicker.UI',
        element: () => import('./theme-picker.element.js'),
        meta: {
            propertyEditorSchemaAlias: 'ArticulateThemePicker'
        }
    }
];
```

### 3. Package Definition (`umbraco-package.json`)
```json
{
    "name": "Articulate",
    "extensions": [
        {
            "type": "bundle",
            "alias": "Articulate.Bundle",
            "js": "/App_Plugins/Articulate/articulate.js"
        }
    ]
}
```

### 4. Updated C# Property Editor
```csharp
[DataEditor("ArticulateThemePicker")]
public class ThemePickerPropertyEditor : DataEditor
{
    public ThemePickerPropertyEditor(IDataValueEditorFactory dataValueEditorFactory, IIOHelper ioHelper) 
        : base(dataValueEditorFactory)
    {
        _ioHelper = ioHelper;
    }
}
```

## Migration Steps for Other Property Editors

1. **Create the web component**
   - Convert AngularJS controller to Lit component
   - Replace `$scope` with reactive properties
   - Replace `$http` with fetch API
   - Use modern CSS and HTML

2. **Create the manifest**
   - Define the property editor UI manifest
   - Link to the web component
   - Set proper aliases and metadata

3. **Update the C# class**
   - Simplify constructor parameters
   - Add configuration editor if needed
   - Ensure proper DataEditor attribute

4. **Update package definition**
   - Create/update `umbraco-package.json`
   - Reference the main bundle file
   - Remove old `package.manifest` references

5. **Create bundle entry point**
   - Import all manifests
   - Export for Umbraco to consume

## Benefits of New Format

- **Modern JavaScript**: ES6 modules, async/await, modern browser APIs
- **Better Performance**: Lit components are more efficient than AngularJS
- **TypeScript Support**: Can be easily converted to TypeScript
- **Tree Shaking**: Better bundling and smaller file sizes
- **Future Proof**: Follows web standards and modern practices

## Backward Compatibility

- The C# API endpoints remain unchanged
- Data storage format is the same
- Existing content continues to work
- Only the frontend UI is modernized

## Testing

To test the migrated property editor:
1. Build the project: `dotnet build`
2. Run the test website
3. Create a new data type using "Articulate Theme Picker"
4. Add it to a document type
5. Verify themes load correctly in the back office

## Future Improvements

- Add TypeScript support
- Add unit tests for web components
- Improve error handling and loading states
- Add more sophisticated styling
- Consider using Umbraco's design system components