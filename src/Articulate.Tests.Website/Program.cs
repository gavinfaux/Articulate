#if DEBUG
using Westwind.AspNetCore.LiveReload;
#endif

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Development hotload DX: Razor runtime compilation + Live Reload
if (builder.Environment.IsDevelopment())
{
    // Enable runtime compilation and wire additional file providers to watch RCL/view folders
    builder.Services
        .AddControllersWithViews()
        .AddRazorRuntimeCompilation(options =>
        {
            var env = builder.Environment;
            // Watch the Articulate.Web plugin views and assets directly from source during development
            var pluginRoot = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "Articulate.Web", "wwwroot"));
            if (Directory.Exists(pluginRoot))
            {
                options.FileProviders.Add(new Microsoft.Extensions.FileProviders.PhysicalFileProvider(pluginRoot));
            }

            // Optionally watch this website's own Views/Pages if present
            var viewsRoot = Path.Combine(env.ContentRootPath, "Views");
            if (Directory.Exists(viewsRoot))
            {
                options.FileProviders.Add(new Microsoft.Extensions.FileProviders.PhysicalFileProvider(viewsRoot));
            }
        });

#if DEBUG

    // Live reload for static assets (css/js) and cshtml changes without proxying
    builder.Services.AddLiveReload(opt =>
    {
        opt.ServerRefreshTimeout = 300;
        // Monitor this website's content root; runtime compilation watches RCL view folders
        opt.FolderToMonitor = builder.Environment.ContentRootPath;
        opt.ClientFileExtensions = ".cshtml,.css,.js,.png,.jpg,.jpeg,.gif,.svg,.webp,.json";
    });

#endif
}

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddDeliveryApi()
    .AddComposers()
    .Build();

if (builder.Environment.IsProduction())
{
    // Only required when running from IDE in 'hybrid' Production mode, static assets will not load without this
    // Do not use in development mode or published releases, Umbraco will not start with a circular reference exception
    // builder.WebHost.UseStaticWebAssets();
}

WebApplication app = builder.Build();

await app.BootUmbracoAsync().ConfigureAwait(false);

if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

if (app.Environment.IsDevelopment())
{
#if DEBUG
    // Inject live reload websocket + script in development
    app.UseLiveReload();
#endif
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
        u.UseUmbracoPreviewEndpoints();
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
    });

await app.RunAsync().ConfigureAwait(false);
