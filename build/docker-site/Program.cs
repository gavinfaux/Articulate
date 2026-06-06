using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure forwarded headers for reverse proxy (Caddy)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;

    // Trust proxies from Docker network
#if NET10_0_OR_GREATER
    options.KnownIPNetworks.Clear();
#else
    options.KnownNetworks.Clear();
#endif
    options.KnownProxies.Clear();
});

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddDeliveryApi()
    .AddComposers()
    .Build();

// Increase upload limits, e.g. importing larger BlogML XML files; also ensure Umbraco:CMS:Runtime:MaxRequestLength is set
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

await app.RunAsync().ConfigureAwait(false);
