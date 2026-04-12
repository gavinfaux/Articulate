#nullable enable
using Articulate.Controllers;
using Articulate.ImportExport;
using Articulate.Migrations;
using Articulate.Options;
using Articulate.Routing;
using Articulate.Services;
using Articulate.Syndication;
using FileSignatures;
using FileSignatures.Formats;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Infrastructure.Migrations.Notifications;

namespace Articulate.Components
{
    /// <summary>
    /// Composer for Articulate dependencies and configuration.
    /// </summary>
    public class ArticulateComposer : IComposer
    {
        /// <inheritdoc/>
        public void Compose(IUmbracoBuilder builder)
        {
            IServiceCollection services = builder.Services;
            _ = services.AddScoped<BlogMlExporter>();
            _ = services.AddSingleton<ArticulateTempFileSystem>();
            _ = services.AddSingleton<IRssFeedGenerator, RssFeedGenerator>();

            _ = services.AddSingleton<IArticulateTagRepository, ArticulateTagRepository>();
            _ = services.AddSingleton<ArticulateTagService>();
            _ = services.AddSingleton<IFileFormatInspector>(_ =>
                new FileFormatInspector([new Jpeg(), new Png(), new Gif()]));
            _ = services.AddScoped<IArticulateImportMediaService, ArticulateImportMediaService>();

            _ = services.AddSingleton<DisqusXmlExporter>();
            _ = services.AddScoped<BlogMlImporter>();
            _ = services.AddSingleton<IArticulateSearcher, DefaultArticulateSearcher>();
            _ = services.AddSingleton<ArticulateRouteValueTransformer>();
            _ = services.AddSingleton<ArticulateRouter>();
            _ = services.AddSingleton<RouteCacheRefresherFilter>();
            _ = services.AddSingleton<ArticulateFrontEndFilterConvention>();
            services.TryAddEnumerable(
                ServiceDescriptor.Singleton<MatcherPolicy, ArticulateDynamicRouteSelectorPolicy>());
            _ = services.AddSingleton<IArticulateThemeRepository, ArticulateThemeRepository>();
            _ = services.AddSingleton<IArticulateMarkdownConverter, ArticulateMarkdownService>();
            _ = services.AddTransient<IArticulateThemeResolver, ArticulateThemeResolver>();
            _ = services.AddScoped<BackOfficeAuthService>();

            // Register DI-driven view location provider and configure Razor view engine with provider
            _ = services.AddSingleton<IArticulateViewLocationProvider, DefaultArticulateViewLocationProvider>();
            _ = services.Configure<RazorViewEngineOptions>(options =>
            {
                options.ViewLocationExpanders.Add(new ArticulateViewLocationExpander());
            });

            _ = builder.UrlProviders().InsertBefore<NewDefaultUrlProvider, DateFormattedUrlProvider>();
            _ = builder.ContentFinders().InsertBefore<ContentFinderByUrlNew, DateFormattedPostContentFinder>();

            _ = services.AddOptions<ArticulateOptions>()
                .BindConfiguration("Articulate");

            _ = builder.AddNotificationHandler<ContentSavingNotification, ContentSavingHandler>();
            _ = builder.AddNotificationHandler<ContentPublishingNotification, ContentPublishingHandler>();
            _ = builder.AddNotificationAsyncHandler<ContentSavedNotification, ArticulateRootContentLifecycleHandler>();
            _ = builder.AddNotificationAsyncHandler<ContentPublishedNotification, ArticulateRootContentLifecycleHandler>();
            _ = builder.AddNotificationHandler<ContentTypeSavingNotification, ContentTypeSavingHandler>();
            _ = builder.AddNotificationHandler<ContentCacheRefresherNotification, ContentCacheRefresherHandler>();
            _ = builder.AddNotificationHandler<DomainCacheRefresherNotification, DomainCacheRefresherHandler>();
            _ = builder
                .AddNotificationHandler<MigrationPlansExecutedNotification, ArticulateMigrationPlanExecutedHandler>();

            // Ensure MVC discovers controllers in the Articulate assembly.
            _ = services
                .AddControllersWithViews()
                .ConfigureApplicationPartManager(apm =>
                {
                    System.Reflection.Assembly controllersAssembly = typeof(ArticulateController).Assembly;
                    if (apm.ApplicationParts.OfType<AssemblyPart>().All(p => p.Assembly != controllersAssembly))
                    {
                        apm.ApplicationParts.Add(new AssemblyPart(controllersAssembly));
                    }
                });

            _ = services.ConfigureOptions<ArticulatePipelineStartupFilter>();
            _ = services.ConfigureOptions<ConfigureArticulateMvcOptions>();

            _ = services.AddOutputCache(options =>
            {
                options.AddPolicy("Articulate120", policyBuilder =>
                    policyBuilder
                        .Expire(TimeSpan.FromSeconds(120)));
                options.AddPolicy("Articulate300", policyBuilder =>
                    policyBuilder
                        .Expire(TimeSpan.FromSeconds(300)));
                options.AddPolicy("Articulate60", policyBuilder =>
                    policyBuilder
                        .Expire(TimeSpan.FromSeconds(60)));
            });
        }
    }
}
