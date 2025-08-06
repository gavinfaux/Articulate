// using Microsoft.AspNetCore.Http.Features;
// using Microsoft.AspNetCore.Server.Kestrel.Core;
// using Smidge;
// using Smidge.Cache;
// using Smidge.Options;

// WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// builder.CreateUmbracoBuilder()
//    .AddBackOffice()
//    .AddWebsite()
//    .AddComposers()
//    .Build();

//// TODO: move all these comments to docs/wiki

// /*
// * Articulate requires Smidge
// *   add the following to your appsettings.json
// *   "smidge": {
// *   "dataFolder": "Smidge",
// *   "version": "1"
// *   }
// */

//// DX: dotnet watch run --environment Development
//// only works with DEBUG tag helpers: <script src="js-bundle" type="text/javascript" debug="true"></script>
//builder.Services.AddSmidge(builder.Configuration.GetSection("smidge")).Configure<SmidgeOptions>(options =>
//{
//    if (builder.Environment.IsDevelopment())
//    {
//        options.CacheOptions.UseInMemoryCache = true;
//        //change some of the bundle options for rendering in Debug mode:
//        options.DefaultBundleOptions.DebugOptions.SetCacheBusterType<TimestampCacheBuster>();
//        options.DefaultBundleOptions.DebugOptions.FileWatchOptions.Enabled = true;
//    }
//});

//// Articulate may require increasing the maximum request size in order to process large requests,
//// e.g. import BlogML files or multiple attachments in a single request (Mobile Markdown Editor and Live Writer)

//// Defaults to 30,000,000 bytes (~28.6 MB)
//builder.Services.Configure<IISServerOptions>(options => options.MaxRequestBodySize = int.MaxValue);

// /*
// * For IIS you may need to increase the maximum request size in your web.config file
// * For development this is located in src\.vs\Articulate\config\applicationhost.config

// <configuration>
//   <system.webServer>
//     <security>
//       <requestFiltering>
//         <!-- Default: 30,000,000 bytes (~28.6 MB); 52428800 (~50 MB); 2147483647 (~2.GB)  -->
//         <requestLimits maxAllowedContentLength="2147483647" />
//       </requestFiltering>
//     </security>
//   </system.webServer>
// </configuration>

//*/

//// Defaults to 30,000,000 bytes (~28.6 MB)
//builder.Services.Configure<KestrelServerOptions>(options => options.Limits.MaxRequestBodySize = int.MaxValue);

//builder.Services.Configure<FormOptions>(x =>
//{
//    //  Defaults to 4,194,304 bytes, which is approximately 4MB.
//    x.ValueLengthLimit = int.MaxValue;
//    // Defaults to 134,217,728 bytes, which is approximately 128MB.
//    x.MultipartBodyLengthLimit = int.MaxValue;
//    // Defaults to 16,384 bytes, which is approximately 16KB.
//    x.MultipartHeadersLengthLimit = int.MaxValue;
//});

//// Only required for Razor page support in Pages folder (just a Debug helper at present)
//builder.Services.AddRazorPages();

//// Only required when running from IDE in 'hybrid' Production mode, static assets will not load without this
//// Do not use in development mode or published releases, Umbraco will not start with a circular reference exception
//if (builder.Environment.IsProduction())
//{
//    builder.WebHost.UseStaticWebAssets();
//}

//WebApplication app = builder.Build();



//await app.BootUmbracoAsync();

//if (app.Environment.IsDevelopment())
//{
//    app.UseDeveloperExceptionPage();
//}

//app.UseUmbraco()
//    .WithMiddleware(u =>
//    {
//        u.UseBackOffice();
//        u.UseWebsite();
//    })
//    .WithEndpoints(u =>
//    {
//        // // NOTE: debugging routes
//        //if (app.Environment.IsDevelopment())
//        //{
//        //    u.EndpointRouteBuilder.MapGet("/debug/routes", (IEnumerable<EndpointDataSource> endpointSources) =>
//        //    {
//        //        var endpoints = endpointSources
//        //            .SelectMany(es => es.Endpoints)
//        //            .OfType<RouteEndpoint>();

//        //        var output = endpoints.Select(e => new
//        //        {
//        //            Priority = e.Order,
//        //            Name = e.DisplayName,
//        //            Route = e.RoutePattern.RawText,
//        //            Method = e.Metadata.OfType<HttpMethodMetadata>().FirstOrDefault()?.HttpMethods.FirstOrDefault()
//        //        })
//        //        .OrderBy(e => e.Priority)
//        //        .ToList();

//        //        return Results.Ok(output);
//        //    });
//        //}

//        // Only required for Razor page support in Pages folder (just a Debug helper at present)
//        u.EndpointRouteBuilder.MapRazorPages();

//        // Enables the Umbraco Preview Hub for previewing content unpublished content
//        u.UseUmbracoPreviewEndpoints();

//        u.UseBackOfficeEndpoints();
//        u.UseWebsiteEndpoints();
//    });

//if (!app.Environment.IsDevelopment())
//{
//    app.UseHttpsRedirection();
//}

//// Articulate requires Smidge
//app.UseSmidge();

//app.Run();

using Smidge;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

builder.Services.AddSmidge(builder.Configuration.GetSection("smidge"));

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseUmbraco()
    .WithMiddleware(u =>
    {
        u.UseBackOffice();
        u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        u.UseUmbracoPreviewEndpoints();
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
    });

app.UseSmidge();
await app.RunAsync();

