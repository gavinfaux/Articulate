#nullable enable
using System;
using System.IO;
using System.Linq;
using Asp.Versioning;
using Humanizer;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
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
            _ = builder.Services.AddSingleton<IOperationIdHandler, ArticulateApiOperationHandler>();

            _ = builder.Services.ConfigureOptions<ArticulateApiSwaggerOptions>();

        }
    }

    /// <summary>
    /// Adds security requirements to Articulate API operations for Swagger documentation.
    /// </summary>
    internal class ArticulateApiOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        /// <summary>
        /// Gets the API name for which security requirements are applied.
        /// </summary>
        protected override string ApiName => ArticulateConstants.ApiName;
    }

    /// <summary>
    /// Handles the generation of operation IDs for Articulate API endpoints in Swagger.
    /// </summary>
    /// <param name="apiVersioningOptions">The API versioning options.</param>
    internal class ArticulateApiOperationHandler(IOptions<ApiVersioningOptions> apiVersioningOptions)
        : OperationIdHandler(apiVersioningOptions)
    {
        /// <summary>
        /// Determines if this handler can process the given API description and controller action.
        /// </summary>
        /// <param name="apiDescription">The API description.</param>
        /// <param name="controllerActionDescriptor">The controller action descriptor.</param>
        /// <returns>True if the handler can process the API; otherwise, false.</returns>
        protected override bool CanHandle(ApiDescription apiDescription, ControllerActionDescriptor controllerActionDescriptor)
            => controllerActionDescriptor.ControllerTypeInfo.Namespace?.StartsWith("Articulate.Controllers", comparisonType: StringComparison.InvariantCultureIgnoreCase) is true;

        /// <summary>
        /// Generates a unique operation ID for the given API description.
        /// </summary>
        /// <param name="apiDescription">The API description.</param>
        /// <returns>The generated operation ID.</returns>
        public override string Handle(ApiDescription apiDescription)
        {
            var httpMethod = apiDescription.HttpMethod?.ToLowerInvariant();
            var version = apiDescription.GetApiVersion()?.ToString();
            var majorVersion = version?.Split('.')[0];
            var versionPart = "V" + majorVersion;

            /*
             * 1. Split the route into segments
             *      For example, "umbraco/management/api/v1/articulate/blog/import/begin" becomes
             *      ["umbraco", "management", "api", "v1", "articulate", "blog", "import", "begin"]
             * 2. Remove curly braces
             *      If a segment is a route parameter like {id}, it becomes id.
             * 3. Filter out management API prefix
             *      Any segment that starts with Umbraco, Management, Api, or V{majorVersion} is removed.
             *      This prevents the management API prefix from appearing in the operation ID.
             * 4. PascalCase and clean up
             *      Each segment is converted to PascalCase (e.g., import-begin → ImportBegin), and dashes/spaces are removed.
             * 5. To array
             *      The cleaned segments are collected into an array for further use (to be concatenated for the operation ID).
             */

            var route = apiDescription.RelativePath?.Split('?')[0];
            var segments = route?.Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Replace("{", "").Replace("}", ""))
                .Where(s =>
                    !s.Equals("umbraco", StringComparison.OrdinalIgnoreCase) &&
                    !s.Equals("management", StringComparison.OrdinalIgnoreCase) &&
                    !s.Equals("api", StringComparison.OrdinalIgnoreCase) &&
                    !s.Equals($"v{majorVersion}", StringComparison.OrdinalIgnoreCase)
                ).Select(s => s.Transform(To.TitleCase).Replace("-", "").Replace(" ", ""))
                .ToArray();
            if (segments != null)
            {
                var routePart = string.Concat(segments);

                // previously default was "postUmbracoManagementApiV1ArticulateBlogImportBegin"
                // "umbraco/management/api/v1/articulate/blog/import/begin" becomes "postArticulateBlogImportBeginV1"

                return $"{httpMethod}{routePart}{versionPart}";
            }

            return apiDescription.RelativePath ?? throw new InvalidOperationException();
        }
    }

    /// <summary>
    /// Configures SwaggerGen options for the Articulate API, including documentation, tags, and XML comments.
    /// </summary>
    internal class ArticulateApiSwaggerOptions : IConfigureOptions<SwaggerGenOptions>
    {
        /// <summary>
        /// Configures SwaggerGen options for the Articulate API.
        /// </summary>
        /// <param name="options">The SwaggerGen options to configure.</param>
        public void Configure(SwaggerGenOptions options)
        {
            var year = DateTime.Now.Year.ToString();
            options.SwaggerDoc(
                ArticulateConstants.ApiName,
                new OpenApiInfo
                {
                    Title = "Articulate Management API",
                    Description = "API for the back office dashboard section Articulate, a wonderful Blog engine built on Umbraco. ",
                    Version = "1.0",
                    Contact = new OpenApiContact
                    {
                        Name = "https://github.com/Shazwazza/Articulate",
                        Url = new Uri("https://github.com/Shazwazza/Articulate"),
                    },
                    License = new OpenApiLicense
                    {
                        Name = $"© 2014 - {year} by Shannon Deminick, MIT License (MIT)",
                        Url = new Uri("https://opensource.org/license/MIT")
                    }
                });

            var assembly = typeof(Controllers.ArticulatePropertyEditorsController).Assembly;
            var xmlFile = $"{assembly.GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

            // if the xml file exists then add it, otherwise ignore since a runtime exception will be thrown and Umbraco will not start
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(typeof(Controllers.ArticulatePropertyEditorsController).Assembly);
            }

            options.OperationFilter<ArticulateApiOperationSecurityFilter>();

            options.TagActionsBy(api =>
            {
                return api.GroupName != null
                    ? new[] { api.GroupName }
                    : api.ActionDescriptor is ControllerActionDescriptor controllerActionDescriptor
                        ? new[] { controllerActionDescriptor.ControllerName }
                        : throw new InvalidOperationException("Unable to determine tag for endpoint.");
            });

            options.DocInclusionPredicate((name, api) => true);
        }
    }
}
