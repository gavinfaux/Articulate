using System;
using System.IO;
using System.Reflection;
using Articulate.Components;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Articulate.Options
{
    public class ArticulateApiSwaggerOptions : IConfigureOptions<SwaggerGenOptions>
    {
        public void Configure(SwaggerGenOptions options)
        {
            var year = DateTime.Now.Year.ToString();
            options.SwaggerDoc(
                "articulate-api",
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

            options.IncludeXmlComments(typeof(Controllers.ArticulatePropertyEditorsController).Assembly);

            options.OperationFilter<ArticulateApiOperationSecurityFilter>();
        }
    }
}
