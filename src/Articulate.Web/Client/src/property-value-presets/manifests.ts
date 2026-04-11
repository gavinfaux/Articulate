import type { ManifestPropertyValuePreset } from '@umbraco-cms/backoffice/property';

const articulatePreset: ManifestPropertyValuePreset = {
    type: 'propertyValuePreset',
    alias: 'Articulate.PropertyValuePreset.BlogDefaults',
    name: 'Articulate Blog Defaults Preset',
    api: () => import('./articulate.property-value-preset.js')
};

export const manifests: Array<ManifestPropertyValuePreset> = [
    articulatePreset
];
