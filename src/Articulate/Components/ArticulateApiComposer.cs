#nullable enable
using Articulate.Options;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Articulate.Components
{
    /// <summary>
    /// Composes the Articulate API by registering Swagger/OpenAPI configuration and operation handlers.
    /// </summary>
    public class ArticulateApiComposer : IComposer
    {
        /// <summary>
        /// Registers services and configures Swagger/OpenAPI for the Articulate API.
        /// </summary>
        /// <param name="builder">The Umbraco builder used for service registration.</param>
        public void Compose(IUmbracoBuilder builder)
        {
            builder.Services.AddSingleton<IOperationIdHandler, ArticulateOperationIdHandler>();

            builder.Services.ConfigureOptions<ArticulateSwaggerOptions>();

        }
    }
}
