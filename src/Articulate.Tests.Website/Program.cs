using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

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

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100000000;
});

// Increase upload limits, e.g. importing larger BlogML XML files; also ensure Umbraco:CMS:Runtime:MaxRequestLength is set
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100MB
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 104857600; // 100MB
});

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 104857600; // 100MB
});

/* NOTE: For legacy IIS web.config settings to work, you also need to update the following:

<configuration>
     <system.web>
       <httpRuntime maxRequestLength="102400" />
     </system.web>
     <system.webServer>
       <security>
         <requestFiltering>
           <requestLimits maxAllowedContentLength="104857600" />
         </requestFiltering>
       </security>
     </system.webServer>
   </configuration>

*/

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

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

await app.RunAsync();
