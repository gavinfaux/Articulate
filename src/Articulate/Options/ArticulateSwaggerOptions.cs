using System;
using System.IO;
using Articulate.Components.ManagementApi;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Articulate.Options
{
    /// <summary>
    /// Configures SwaggerGen options for the Articulate API, including documentation, tags, and XML comments.
    /// </summary>
    public class ArticulateSwaggerOptions(ILogger<ArticulateSwaggerOptions> logger) : IConfigureOptions<SwaggerGenOptions>
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
                    Version = "Latest",
                    Contact = new OpenApiContact
                    {
                        Name = "https://github.com/Shazwazza/Articulate",
                        Url = new Uri("https://github.com/Shazwazza/Articulate"),
                    },
                    License = new OpenApiLicense
                    {
                        Name = $"MIT License, © {year} Shannon Deminick",
                        Url = new Uri("https://opensource.org/license/MIT")
                    }
                });

            try
            {
                var assembly = typeof(ArticulateSwaggerOptions).Assembly;
                var xmlFile = $"{assembly.GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(xmlPath))
                {
                    options.IncludeXmlComments(typeof(ArticulateSwaggerOptions).Assembly);
                }

                logger.LogWarning("Articulate XML comments not available for Swagger UI");
            }
            catch (Exception e)
            {
                logger.LogWarning(e, "Articulate XML comments not available for Swagger UI");
            }

            options.OperationFilter<ArticulateOperationSecurityFilter>();

            options.TagActionsBy(api =>
            {
                return api.GroupName != null
                    ? [api.GroupName]
                    : api.ActionDescriptor is ControllerActionDescriptor controllerActionDescriptor
                        ? new[] { controllerActionDescriptor.ControllerName }
                        : throw new InvalidOperationException("Unable to determine tag for endpoint.");
            });

            options.DocInclusionPredicate((name, api) => true);
        }
    }
}
