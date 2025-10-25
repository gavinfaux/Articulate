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
    public class ArticulateComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            IServiceCollection services = builder.Services;
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
            services.TryAddEnumerable(
                ServiceDescriptor.Singleton<MatcherPolicy, ArticulateDynamicRouteSelectorPolicy>());
            services.AddSingleton<IArticulateThemeRepository, ArticulateThemeRepository>();
            services.AddTransient<IArticulateThemeResolver, ArticulateThemeResolver>();
            services.AddScoped<BackOfficeAuthService>();

            // Register DI-driven view location provider and configure Razor view engine without BuildServiceProvider
            services.AddSingleton<IArticulateViewLocationProvider, DefaultArticulateViewLocationProvider>();
            services.Configure<RazorViewEngineOptions>(options =>
            {
                options.ViewLocationExpanders.Add(new ArticulateViewLocationExpander());
            });

            // TODO(theme-contract): Read theme metadata files (Shared/assets/base.json and {Theme}/assets/theme.json)
            // to validate contractVersion compatibility and optionally surface a backoffice notification or log warning
            // when a site is using a theme that targets an incompatible contract version.
            builder.UrlProviders().InsertBefore<NewDefaultUrlProvider, DateFormattedUrlProvider>();
            builder.ContentFinders().InsertBefore<ContentFinderByUrlNew, DateFormattedPostContentFinder>();

            services.AddOptions<ArticulateOptions>()
                .BindConfiguration("Articulate");

            builder.AddNotificationHandler<ContentSavingNotification, ContentSavingHandler>();
            builder.AddNotificationHandler<ContentSavedNotification, ContentSavedHandler>();
            builder.AddNotificationHandler<ContentTypeSavingNotification, ContentTypeSavingHandler>();
            builder.AddNotificationHandler<ContentCacheRefresherNotification, ContentCacheRefresherHandler>();
            builder.AddNotificationHandler<DomainCacheRefresherNotification, DomainCacheRefresherHandler>();

            services.ConfigureOptions<ArticulatePipelineStartupFilter>();
            services.ConfigureOptions<ConfigureArticulateMvcOptions>();

            services.AddOutputCache(options =>
            {
                // Vary by a normalized variant header to avoid cache-key fragmentation on raw Accept
                options.AddPolicy("Articulate120", policyBuilder =>
                    policyBuilder
                        .Expire(TimeSpan.FromSeconds(120))
                        .SetVaryByHeader("X-Content-Variant")
                        // Fallback for environments not yet normalizing at the edge
                        .SetVaryByHeader("Accept"));
                options.AddPolicy("Articulate300", policyBuilder =>
                    policyBuilder
                        .Expire(TimeSpan.FromSeconds(300))
                        .SetVaryByHeader("X-Content-Variant")
                        .SetVaryByHeader("Accept"));
                options.AddPolicy("Articulate60", policyBuilder =>
                    policyBuilder
                        .Expire(TimeSpan.FromSeconds(60))
                        .SetVaryByHeader("X-Content-Variant")
                        .SetVaryByHeader("Accept"));
            });
        }
    }
}
