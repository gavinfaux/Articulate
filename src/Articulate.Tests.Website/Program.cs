using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Smidge;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

builder.Services.AddSmidge(builder.Configuration.GetSection("smidge"));

builder.Services.Configure<IISServerOptions>(options => options.MaxRequestBodySize = int.MaxValue);

builder.Services.Configure<KestrelServerOptions>(options => options.Limits.MaxRequestBodySize = int.MaxValue);

builder.Services.Configure<FormOptions>(x =>
{
    x.ValueLengthLimit = int.MaxValue;
    x.MultipartBodyLengthLimit = int.MaxValue;
    x.MultipartHeadersLengthLimit = int.MaxValue;
});

var app = builder.Build();

await app.BootUmbracoAsync();

if (app.Environment.IsDevelopment())
{
    _ = app.UseDeveloperExceptionPage();
}

app.UseUmbraco()
    .WithMiddleware(u =>
    {
        _ = u.UseBackOffice();
        _ = u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        if (app.Environment.IsDevelopment())
        {
            _ = u.EndpointRouteBuilder.MapGet("/debug/routes", (IEnumerable<EndpointDataSource> endpointSources) =>
            {
                var endpoints = endpointSources
                    .SelectMany(es => es.Endpoints)
                    .OfType<RouteEndpoint>();

                var output = endpoints.Select(e => new
                {
                    Priority = e.Order,
                    Name = e.DisplayName,
                    Route = e.RoutePattern.RawText,
                    Method = e.Metadata.OfType<HttpMethodMetadata>().FirstOrDefault()?.HttpMethods.FirstOrDefault()
                })
                .OrderBy(e => e.Priority)
                .ToList();

                return Results.Ok(output);
            });
        }

        _ = u.UseUmbracoPreviewEndpoints();
        _ = u.UseBackOfficeEndpoints();
        _ = u.UseWebsiteEndpoints();
    });

app.UseSmidge();

app.Run();
