using System;
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

    public class ArticulateApiComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            _ = builder.Services.AddSingleton<IOperationIdHandler, ArticulateApiOperationHandler>();

            _ = builder.Services.ConfigureOptions<ArticulateApiSwaggerOptions>();

        }
    }
    public class ArticulateApiOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        protected override string ApiName => ArticulateConstants.ApiName;
    }

    public class ArticulateApiOperationHandler : OperationIdHandler
    {
        public ArticulateApiOperationHandler(IOptions<ApiVersioningOptions> apiVersioningOptions) : base(apiVersioningOptions)
        {
        }

        protected override bool CanHandle(ApiDescription apiDescription, ControllerActionDescriptor controllerActionDescriptor) => controllerActionDescriptor.ControllerTypeInfo.Namespace?.StartsWith($"{ArticulateConstants.Articulate}.Controllers", comparisonType: StringComparison.InvariantCultureIgnoreCase) is true;

        public override string Handle(ApiDescription apiDescription)
        {

            var httpMethod = apiDescription.HttpMethod?.ToLowerInvariant();
            var version = apiDescription.GetApiVersion()?.ToString();
            var majorVersion = version.Split('.')[0];
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
            var segments = route
                .Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Replace("{", "").Replace("}", ""))
                .Where(s =>
                    !s.Equals("umbraco", StringComparison.OrdinalIgnoreCase) &&
                    !s.Equals("management", StringComparison.OrdinalIgnoreCase) &&
                    !s.Equals("api", StringComparison.OrdinalIgnoreCase) &&
                    !s.Equals($"v{majorVersion}", StringComparison.OrdinalIgnoreCase)
                ).Select(s => s.Transform(To.TitleCase).Replace("-", "").Replace(" ", ""))
                .ToArray();
            var routePart = string.Concat(segments);

            // previously default was "postUmbracoManagementApiV1ArticulateBlogImportBegin"
            // "umbraco/management/api/v1/articulate/blog/import/begin" becomes "postArticulateBlogImportBeginV1"

            return $"{httpMethod}{routePart}{versionPart}";
        }
    }
    public class ArticulateApiSwaggerOptions : IConfigureOptions<SwaggerGenOptions>
    {
        public void Configure(SwaggerGenOptions options)
        {
            var year = DateTime.Now.Year.ToString();
            options.SwaggerDoc(
                ArticulateConstants.ApiName,
                new OpenApiInfo
                {
                    Title = $"{ArticulateConstants.Articulate} Management API",
                    Description = $"API for the back office dashboard section {ArticulateConstants.Articulate}, a wonderful Blog engine built on Umbraco. ",
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

            options.IncludeXmlComments(typeof(Controllers.ArticulatePropertyEditorsController).Assembly);

            options.OperationFilter<ArticulateApiOperationSecurityFilter>();
        }
    }
}
