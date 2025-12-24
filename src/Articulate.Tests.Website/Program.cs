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
