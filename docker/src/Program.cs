using ArticulateDockerSite.Options;
using ArticulateDockerSite.Services;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Umbraco.Cms.Core.Notifications;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure forwarded headers for reverse proxy (Caddy)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;

    // Trust proxies from Docker network
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

IUmbracoBuilder umbBuilder = builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddDeliveryApi()
    .AddComposers();

_ = umbBuilder.Services.AddOptions<ArticulateHarnessApiOptions>()
    .BindConfiguration(ArticulateHarnessApiOptions.SectionName);
_ = umbBuilder.Services.AddScoped<ArticulateHarnessPermissionsFixture>();
_ = umbBuilder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, ArticulateHarnessApiBootstrapper>();

umbBuilder.Build();

// Allow 100 MiB uploads, e.g. larger BlogML XML files; also set Umbraco:CMS:Runtime:MaxRequestLength.
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100MB
});
builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 104857600; // 100MB
});

WebApplication app = builder.Build();

// IMPORTANT: UseForwardedHeaders must be called before other middleware
app.UseForwardedHeaders();

await app.BootUmbracoAsync().ConfigureAwait(false);

if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

if (app.Environment.IsDevelopment())
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
        u.UseUmbracoPreviewEndpoints();
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
    });

app.MapControllers();

await app.RunAsync().ConfigureAwait(false);
