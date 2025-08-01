#nullable enable
using Articulate.ImportExport;
using Articulate.Options;
using Articulate.Routing;
using Articulate.Services;
using Articulate.Syndication;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Routing;

namespace Articulate.Components
{

    public class ArticulateComposer : ComponentComposer<ArticulateComponent>
    {
        public override void Compose(IUmbracoBuilder builder)
        {
            base.Compose(builder);

            IServiceCollection services = builder.Services;
            services.AddSingleton<ContentUrls>();
            services.AddSingleton<BlogMlExporter>();
            services.AddSingleton<ArticulateTempFileSystem>();
            services.AddSingleton<IRssFeedGenerator, RssFeedGenerator>();

            services.AddSingleton<IArticulateTagRepository, ArticulateTagRepository>();
            services.AddSingleton<ArticulateTagService>();

            services.AddSingleton<DisqusXmlExporter>();
            services.AddSingleton<BlogMlImporter>();
            services.AddSingleton<IArticulateSearcher, DefaultArticulateSearcher>();
            services.AddSingleton<ArticulateRouteValueTransformer>();
            services.AddSingleton<ArticulateRouter>();
            services.AddSingleton<RouteCacheRefresherFilter>();
            services.AddSingleton<ArticulateFrontEndFilterConvention>();
            services.TryAddEnumerable(ServiceDescriptor.Singleton<MatcherPolicy, ArticulateDynamicRouteSelectorPolicy>());
            services.AddSingleton<IArticulateThemeRepository, ArticulateThemeRepository>();
            services.AddScoped<IArticulateThemeResolver, ArticulateThemeResolver>();
            services.AddScoped<BackOfficeAuthService>();
            services.Configure<RazorViewEngineOptions>(options =>
            {
                IArticulateThemeResolver themeResolver = services.BuildServiceProvider().GetRequiredService<IArticulateThemeResolver>();
                options.ViewLocationExpanders.Add(new ArticulateViewLocationExpander(themeResolver));
            });
            builder.UrlProviders().InsertBefore<NewDefaultUrlProvider, DateFormattedUrlProvider>();

            builder.ContentFinders().InsertBefore<ContentFinderByUrlNew, DateFormattedPostContentFinder>();

            services.AddOptions<ArticulateOptions>();

            builder.AddNotificationHandler<ContentSavingNotification, ContentSavingHandler>();
            builder.AddNotificationHandler<ContentSavedNotification, ContentSavedHandler>();
            builder.AddNotificationHandler<ContentTypeSavingNotification, ContentTypeSavingHandler>();
            builder.AddNotificationHandler<ContentCacheRefresherNotification, ContentCacheRefresherHandler>();
            builder.AddNotificationHandler<DomainCacheRefresherNotification, DomainCacheRefresherHandler>();

            services.ConfigureOptions<ArticulatePipelineStartupFilter>();
            services.ConfigureOptions<ConfigureArticulateMvcOptions>();

            services.AddOutputCache(options =>
            {
                options.AddPolicy("Articulate120", policyBuilder =>
                    policyBuilder.Expire(TimeSpan.FromSeconds(120)));
                options.AddPolicy("Articulate300", policyBuilder =>
                    policyBuilder.Expire(TimeSpan.FromSeconds(300)));
                options.AddPolicy("Articulate60", policyBuilder =>
                    policyBuilder.Expire(TimeSpan.FromSeconds(60)));
            });
        }
    }
}
