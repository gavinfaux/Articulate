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
using Umbraco.Cms.Core.DependencyInjection;
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
            builder.Services.TryAddEnumerable(ServiceDescriptor.Singleton<MatcherPolicy, ArticulateDynamicRouteSelectorPolicy>());
            builder.Services.AddSingleton<IArticulateThemeRepository, ArticulateThemeRepository>();
            builder.Services.AddScoped<IArticulateThemeResolver, ArticulateThemeResolver>();
            builder.Services.Configure<RazorViewEngineOptions>(options =>
            {
                IArticulateThemeResolver themeResolver = builder.Services.BuildServiceProvider().GetRequiredService<IArticulateThemeResolver>();
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

            builder.Services.ConfigureOptions<ArticulatePipelineStartupFilter>();
            builder.Services.ConfigureOptions<ConfigureArticulateMvcOptions>();

            builder.Services.AddOutputCache(options =>
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
