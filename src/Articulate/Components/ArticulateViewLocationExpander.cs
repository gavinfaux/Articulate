using System.Collections.Generic;
using System.Linq;
using Articulate.Services;
using Microsoft.AspNetCore.Mvc.Razor;

namespace Articulate.Components
{

    /*
     * TODO: Future refactor - Modernize the Articulate Theming System
     *
     * GOAL: Move from a "copy-based" theme system to a more flexible and maintainable "inheritance-based" system.
     *
     * 1. CREATE A BASE/FALLBACK THEME:
     *  - Establish a complete, working "base" theme in a dedicated folder (e.g., /App_Plugins/Articulate/Themes/Shared/).
     *  - This base theme should provide all structural views and partials.
     *  - Use optional @sections to define "slots" for features (e.g., @await RenderSectionAsync("Pager", required: false)). This allows child themes to easily remove features by not defining the section.
     *
     * 2. DEFINE A THEME "CONTRACT":
     *   - Establish and document a common HTML/CSS naming scheme (e.g., BEM: .articulate-pager__button) so that theme CSS can reliably target the base theme's HTML.
     *   - Document JavaScript extension points (e.g., custom events fired by a base theme's core.js that a theme.js can listen for).
     *  - Versioning - if we make a breaking change to base theme contract (HTML skeleton or naming conventions), or bump Articulate from v6 to v7 with changes, the system will need a way to handle this, e.g. store version in base.json and notify user if using an older theme version.
     *
     * 3. SIMPLIFY CHILD/USER THEMES:
     *   - A theme (e.g., "VAPOR") should only contain the files it needs to override. If it uses the base Pager, it should not have a Pager.cshtml file.
     *   - Consider the Asset bundling strategy, e.g. Master bundles both base and theme css, or theme imports base, or need for theme to exclude base and just use own specific theme.
     *
     * 4. REPURPOSE THE 'COPY THEME' FEATURE:
     *   - Modify the 'Copy Theme' service so it either no longer clones an entire theme, or add a 'New Theme' option that acts as a "scaffolding" tool, creating a new, empty theme folder with perhaps a readme.txt and a few example override files to get the user started.
     *
     Views/
       Articulate/
       |-- _ViewImports.cshtml             <-- GLOBAL imports for ALL views (themes, frontend, backoffice, etc.)
       |-- MarkdownEditor.cshtml           <-- Markdown editor (other non theme views can be added here)
       |-- Themes/                         <-- Parent folder for ALL theme-related views.
       |   |-- Shared/                     <-- "BASE" or "FALLBACK" THEME.
       |   |   |-- _Layout.cshtml
       |   |   |-- _ViewStart.cshtml       <-- Layout, View bag etc. EVERY theme has even if 'same', for clarity/control/override
       |   |   |-- Assets/
       |   |       |-- base.css
       |   |       |-- base.js
       |   |       |-- base.json
       |   |   |-- List.cshtml
       |   |   |-- Post.cshtml
       |   |   |-- Partials/
       |   |     |-- Pager.cshtml
       |   |-- VAPOR/                      <-- Specific theme override.
       |   |   |-- _Layout.cshtml          <-- Override the Shared/_Layout.cshtml, own layout or slot overrides, or no layout
       |   |   |-- _ViewStart.cshtml
       |   |   |-- _ViewImports.cshtml     <-- OPTIONAL: Adds VAPOR-specific @using statements or tag helpers
       |   |   |-- Post.cshtml             <-- Overrides the Shared/Post.cshtml
       |   |     |-- Partials/
       |   |           |-- Pager.cshtml    <-- Overrides the Shared/Partials/Pager.cshtml
       |   |   |-- Assets/
       |   |       |-- theme.css           <-- Overrides/extends the Shared/Assets/base.css
       |   |       |-- theme.js            <-- Overrides/extends the Shared/Assets/base.js
       |   |       |-- theme.json          <-- Overrides/extends system settings (e.g. number of posts per page)
       |   |-- Material/
       |   |   |-- _ViewStart.cshtml       <-- REQUIRED, minimal @{ Layout = "_Layout.cshtml"; }, uses theme or fallback to shared
       |   |-- ... etc ...
     */

    // This will first try to find the View in User themes, then in System themes.
    // User themes can override System themes (a Post.cshtml in User theme folder with the same name as a system theme will take precedence).
    // Routes based off Articulate root node, so this covers all views, not just themes.
    public class ArticulateViewLocationExpander(IArticulateThemeResolver themeResolver) : IViewLocationExpander
    {
        private const string ThemeKey = "articulate-theme";

        public void PopulateValues(ViewLocationExpanderContext context)
        {
            var themeName = themeResolver.GetCurrentThemeName();
            context.Values[ThemeKey] = themeName;
        }

        public IEnumerable<string> ExpandViewLocations(ViewLocationExpanderContext context, IEnumerable<string> viewLocations)
        {
            if (context.Values.TryGetValue(ThemeKey, out var themeName) && !string.IsNullOrEmpty(themeName))
            {
                var articulateLocations = new[]
                {
                    // User themes take priority over system themes, allows overriding system themes.
                    $"/Views/ArticulateThemes/{themeName}/{{0}}.cshtml",
                    $"/Views/ArticulateThemes/{themeName}/Partials/{{0}}.cshtml",

                    // System themes
                    $"/Views/Articulate/Themes/{themeName}/{{0}}.cshtml",
                    $"/Views/Articulate/Themes/{themeName}/Partials/{{0}}.cshtml",

                    // Future base theme
                    // "/Views/Articulate/Themes/Shared/{0}.cshtml",
                    // "/Views/Articulate/Themes/Shared/Partials/{0}.cshtml",

                    // Other Views (not themes related, e.g. markdown editor)
                    "/Views/Articulate/{0}.cshtml",
                    "/Views/Articulate/Partials/{0}.cshtml",

                };

                return articulateLocations.Concat(viewLocations);
            }

            return viewLocations;
        }
    }
}
