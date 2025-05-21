// Import the dashboard element so it's bundled
import './articulate-dashboard.element';

const dashboardManifest = {
    type: 'dashboard',
    alias: 'Articulate.Dashboard',
    name: 'Articulate Dashboard',
    elementName: 'articulate-dashboard',
    weight: 10,
    meta: {
        label: 'Articulate',
        pathname: 'articulate',
    },
    conditions: [
        {
            alias: 'Umb.Condition.SectionAlias',
            match: 'Umb.Section.Settings',
        },
    ],
};

export const manifests = [dashboardManifest];
