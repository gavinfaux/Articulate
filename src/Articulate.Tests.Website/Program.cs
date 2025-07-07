using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Smidge;
using Smidge.Cache;
using Smidge.Options;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

/* 
* Articulate requires Smidge
*   add the following to your appsettings.json
*   "smidge": {
*   "dataFolder": "Smidge",
*   "version": "1"
*   }
*/

// DX: dotnet watch run --environment Development 
builder.Services.AddSmidge(builder.Configuration.GetSection("smidge")).Configure<SmidgeOptions>(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.CacheOptions.UseInMemoryCache = true;
    }
    //change some of the bundle options for rendering in Debug mode:
    options.DefaultBundleOptions.DebugOptions.SetCacheBusterType<TimestampCacheBuster>();
    options.DefaultBundleOptions.DebugOptions.FileWatchOptions.Enabled = true;
    //change some of the bundle options for rendering in Production mode:
    options.DefaultBundleOptions.ProductionOptions.SetCacheBusterType<AppDomainLifetimeCacheBuster>();
});

// Articulate may require increasing the maximum request size in order to process large requests,
// e.g. import BlogML files or multiple attachments in a single request (Mobile Markdown Editor and Live Writer)

// Defaults to 30,000,000 bytes (~28.6 MB)
builder.Services.Configure<IISServerOptions>(options => options.MaxRequestBodySize = int.MaxValue);

// Defaults to 30,000,000 bytes (~28.6 MB)
builder.Services.Configure<KestrelServerOptions>(options => options.Limits.MaxRequestBodySize = int.MaxValue);

builder.Services.Configure<FormOptions>(x =>
{
    //  Defaults to 4,194,304 bytes, which is approximately 4MB.
    x.ValueLengthLimit = int.MaxValue;
    // Defaults to 134,217,728 bytes, which is approximately 128MB.
    x.MultipartBodyLengthLimit = int.MaxValue;
    // Defaults to 16,384 bytes, which is approximately 16KB.
    x.MultipartHeadersLengthLimit = int.MaxValue;
});

if (builder.Environment.IsDevelopment())
{
    // Only required for local Vite development server
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", builder =>
        {
            builder.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });
}

// Only required for Razor page support in Pages folder (just a Debug helper at present)
// builder.Services.AddRazorPages();

var app = builder.Build();

await app.BootUmbracoAsync();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    // Only required for local Vite development server
    app.UseCors("AllowAll");
}

app.UseUmbraco()
    .WithMiddleware(u =>
    {
        u.UseBackOffice();
        u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        // // NOTE: Only enable this in development for debugging route issues
        //if (app.Environment.IsDevelopment())
        //{
        //    u.EndpointRouteBuilder.MapGet("/debug/routes", (IEnumerable<EndpointDataSource> endpointSources) =>
        //    {
        //        var endpoints = endpointSources
        //            .SelectMany(es => es.Endpoints)
        //            .OfType<RouteEndpoint>();

        //        var output = endpoints.Select(e => new
        //        {
        //            Priority = e.Order,
        //            Name = e.DisplayName,
        //            Route = e.RoutePattern.RawText,
        //            Method = e.Metadata.OfType<HttpMethodMetadata>().FirstOrDefault()?.HttpMethods.FirstOrDefault()
        //        })
        //        .OrderBy(e => e.Priority)
        //        .ToList();

        //        return Results.Ok(output);
        //    });
        //}

        // Only required for Razor page support in Pages folder (just a Debug helper at present)
        // u.EndpointRouteBuilder.MapRazorPages();

        // Enables the Umbraco Preview Hub for previewing content unpublished content
        u.UseUmbracoPreviewEndpoints();

        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
    });

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Articulate requires Smidge
app.UseSmidge();

app.Run();
