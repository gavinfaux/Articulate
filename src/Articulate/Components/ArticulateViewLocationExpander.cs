#nullable enable
using Articulate.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.Extensions.DependencyInjection;

namespace Articulate.Components
{
    internal class ArticulateViewLocationExpander : IViewLocationExpander
    {
        private const string ThemeKey = "articulate-theme";

        /// <inheritdoc/>
        public IEnumerable<string> ExpandViewLocations(ViewLocationExpanderContext context, IEnumerable<string> viewLocations)
        {
            IDictionary<string, string?>? values = context.Values;
            string? themeName = null;

            _ = values?.TryGetValue(ThemeKey, out themeName);

            if (string.IsNullOrEmpty(themeName))
            {
                // Fallback: try HttpContext.Items when Values is unavailable (e.g., in unit tests)
                HttpContext? httpContextForItems = context.ActionContext?.HttpContext;
                if (httpContextForItems?.Items["ThemeName"] is string fromItems &&
                    !string.IsNullOrWhiteSpace(fromItems))
                {
                    themeName = fromItems;
                }
            }

            if (string.IsNullOrEmpty(themeName))
            {
                return viewLocations;
            }

            HttpContext? httpContext = context.ActionContext?.HttpContext;
            if (httpContext is null)
            {
                return viewLocations;
            }

            IArticulateViewLocationProvider? locationProvider =
                httpContext.RequestServices.GetService<IArticulateViewLocationProvider>();
            if (locationProvider is null)
            {
                return viewLocations;
            }

            IEnumerable<string> themeLocations = locationProvider.GetLocations(themeName);
            return themeLocations.Concat(viewLocations);
        }

        /// <inheritdoc/>
        public void PopulateValues(ViewLocationExpanderContext context)
        {
            HttpContext? httpContext = context.ActionContext?.HttpContext;
            if (httpContext is null)
            {
                return;
            }

            IArticulateThemeResolver? themeResolver =
                httpContext.RequestServices.GetService<IArticulateThemeResolver>();
            string themeName = themeResolver?.GetCurrentThemeName() ?? string.Empty;

            // Values may be null in unit testing scenarios when constructed directly.
            IDictionary<string, string?>? values = context.Values;
            values?[ThemeKey] = themeName;

            if (string.IsNullOrWhiteSpace(themeName))
            {
                _ = httpContext.Items.Remove("ThemeName");
            }
            else
            {
                httpContext.Items["ThemeName"] = themeName;
            }
        }
    }
}
