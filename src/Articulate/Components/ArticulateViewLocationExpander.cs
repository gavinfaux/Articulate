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

        public IEnumerable<string> ExpandViewLocations(ViewLocationExpanderContext context, IEnumerable<string> viewLocations)
        {
            string? themeName = null;
            context.Values?.TryGetValue(ThemeKey, out themeName);
            if (string.IsNullOrEmpty(themeName))
            {
                // Fallback: try HttpContext.Items when Values is unavailable (e.g., in unit tests)
                if (context.ActionContext?.HttpContext?.Items?["ThemeName"] is string fromItems &&
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

        public void PopulateValues(ViewLocationExpanderContext context)
        {
            HttpContext? httpContext = context.ActionContext?.HttpContext;
            if (httpContext == null)
            {
                return;
            }

            IArticulateThemeResolver? themeResolver =
                httpContext.RequestServices.GetService<IArticulateThemeResolver>();
            var themeName = themeResolver?.GetCurrentThemeName() ?? string.Empty;

            // Values may be null in unit testing scenarios when constructed directly.
            if (context.Values is not null)
            {
                context.Values[ThemeKey] = themeName;
            }

            httpContext.Items ??= new Dictionary<object, object?>();
            httpContext.Items["ThemeName"] = themeName;
        }
    }
}
