// Main entry point for Articulate property editors
import { manifests as themePickerManifests } from './PropertyEditors/theme-picker/manifests.js';

// Register all manifests with Umbraco
const allManifests = [
    ...themePickerManifests
];

// Export for Umbraco to consume
export const manifests = allManifests;

// Also register with the global extension registry if available
if (window.umbracoExtensionRegistry) {
    allManifests.forEach(manifest => {
        window.umbracoExtensionRegistry.register(manifest);
    });
}