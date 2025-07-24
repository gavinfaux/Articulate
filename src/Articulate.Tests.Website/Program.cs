using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smidge;
using Smidge.Cache;
using Smidge.Options;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;

var builder = WebApplication.CreateBuilder(args);

// only required for SDK style projects not RCL
builder.Services.AddControllersWithViews()
    .AddRazorRuntimeCompilation();

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
        //change some of the bundle options for rendering in Debug mode:
        options.DefaultBundleOptions.DebugOptions.SetCacheBusterType<TimestampCacheBuster>();
        options.DefaultBundleOptions.DebugOptions.FileWatchOptions.Enabled = true;
    }
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

// Only required for Razor page support in Pages folder (just a Debug helper at present)
builder.Services.AddRazorPages();

// Only required for static assets in Release mode when running from IDE (e.g. back office) - not required for published release
builder.WebHost.UseStaticWebAssets();

var app = builder.Build();

await app.BootUmbracoAsync();

var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
var startupLogger = loggerFactory.CreateLogger("Articulate.StartupDiagnostics");

try
{
    // Get the configured options for the runtime compiler
    var runtimeCompilationOptions = app.Services.GetRequiredService<IOptions<MvcRazorRuntimeCompilationOptions>>().Value;

    startupLogger.LogCritical("--- Articulate: Verifying Registered File Providers ---");

    // Check how many providers are registered.
    var providerCount = runtimeCompilationOptions.FileProviders.Count;
    if (providerCount > 0)
    {
        startupLogger.LogCritical("{Count} file providers are registered with the runtime compiler.", providerCount);
        var i = 0;
        foreach (var provider in runtimeCompilationOptions.FileProviders)
        {
            // Try to cast to PhysicalFileProvider to get useful path information
            if (provider is PhysicalFileProvider pfp)
            {
                startupLogger.LogCritical("  [{Index}] Provider Type: PhysicalFileProvider, Root: '{Root}'", i, pfp.Root);
            }
            else
            {
                startupLogger.LogCritical("  [{Index}] Provider Type: {Type}", i, provider.GetType().Name);
            }

            i++;
        }
    }
    else
    {
        startupLogger.LogCritical("No file providers are registered with the runtime compiler. Custom views may not be found.");
    }

    startupLogger.LogCritical("--- End of Verification ---");
}
catch (Exception ex)
{
    startupLogger.LogError(ex, "An error occurred during Articulate startup diagnostics.");
}

if(app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseUmbraco()
    .WithMiddleware(u =>
    {
         u.UseBackOffice();
         u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        // // NOTE: debugging routes
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
         u.EndpointRouteBuilder.MapRazorPages();

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
