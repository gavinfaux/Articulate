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