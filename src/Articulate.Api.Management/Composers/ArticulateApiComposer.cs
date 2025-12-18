#nullable enable
using Articulate.Api.Management.Options;
using Articulate.Api.Management.Services;
using Articulate.Api.Management.Swagger;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;

namespace Articulate.Api.Management.Composers
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
            IServiceCollection services = builder.Services;
            _ = services.AddSingleton<IOperationIdHandler, ArticulateOperationIdHandler>();
            _ = services.ConfigureOptions<ArticulateSwaggerOptions>();
            _ = services.Configure<ArticulateOpenIdClientOptions>(
                builder.Config.GetSection(ArticulateOpenIdClientOptions.SectionName));
            _ = services.AddSingleton<IValidateOptions<ArticulateOpenIdClientOptions>, ArticulateOpenIdClientOptionsValidator>();
            _ = builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, ArticulateApplicationManager>();
        }
    }
}
