#nullable enable
using Articulate.Routing;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Web.Common.ApplicationBuilder;

namespace Articulate.Components
{
    /// <summary>
    /// Adds Articulate's endpoints to the pipeline ahead of Umbraco's catch-all route, and sets Umbraco's route
    /// values for them straight after routing.
    /// </summary>
    public class ArticulatePipelineStartupFilter : IConfigureOptions<UmbracoPipelineOptions>
    {
        /// <inheritdoc/>
        public void Configure(UmbracoPipelineOptions options)
            => options.AddFilter(new UmbracoPipelineFilter(nameof(ArticulatePipelineStartupFilter))
            {
                PostRouting = app => app.Use(ArticulateEndpointDataSource.SetRouteValuesAsync),
                Endpoints = app => app.UseEndpoints(endpoints =>
                    endpoints.DataSources.Add(endpoints.ServiceProvider.GetRequiredService<ArticulateEndpointDataSource>())),
            });
    }
}
