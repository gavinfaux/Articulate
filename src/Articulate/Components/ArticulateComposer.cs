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
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Routing;

namespace Articulate.Components
{
    public class ArticulateComposer : IComposer
    {
        /// <inheritdoc/>
        public void Compose(IUmbracoBuilder builder)
        {
            IServiceCollection services = builder.Services;
            _ = services.AddSingleton<BlogMlExporter>();
            _ = services.AddSingleton<ArticulateTempFileSystem>();
            _ = services.AddSingleton<IRssFeedGenerator, RssFeedGenerator>();

            _ = services.AddSingleton<IArticulateTagRepository, ArticulateTagRepository>();
            _ = services.AddSingleton<ArticulateTagService>();

            _ = services.AddSingleton<DisqusXmlExporter>();
            _ = services.AddSingleton<BlogMlImporter>();
            _ = services.AddSingleton<IArticulateSearcher, DefaultArticulateSearcher>();
            _ = services.AddSingleton<ArticulateRouteValueTransformer>();
            _ = services.AddSingleton<ArticulateRouter>();
            _ = services.AddSingleton<RouteCacheRefresherFilter>();
            _ = services.AddSingleton<ArticulateFrontEndFilterConvention>();
            services.TryAddEnumerable(
                ServiceDescriptor.Singleton<MatcherPolicy, ArticulateDynamicRouteSelectorPolicy>());
            _ = services.AddSingleton<IArticulateThemeRepository, ArticulateThemeRepository>();
            _ = services.AddTransient<IArticulateThemeResolver, ArticulateThemeResolver>();
            _ = services.AddScoped<BackOfficeAuthService>();

            // Register DI-driven view location provider and configure Razor view engine without BuildServiceProvider
            _ = services.AddSingleton<IArticulateViewLocationProvider, DefaultArticulateViewLocationProvider>();
            _ = services.Configure<RazorViewEngineOptions>(options =>
            {
                options.ViewLocationExpanders.Add(new ArticulateViewLocationExpander());
            });

            // TODO(theme-contract): Read theme metadata files (Shared/assets/base.json and {Theme}/assets/theme.json)
            // to validate contractVersion compatibility and optionally surface a backoffice notification or log warning
            // when a site is using a theme that targets an incompatible contract version.
            _ = builder.UrlProviders().InsertBefore<NewDefaultUrlProvider, DateFormattedUrlProvider>();
            _ = builder.ContentFinders().InsertBefore<ContentFinderByUrlNew, DateFormattedPostContentFinder>();

            _ = services.AddOptions<ArticulateOptions>()
                .BindConfiguration("Articulate");
            _ = services.AddSingleton<IValidateOptions<ArticulateOptions>, ArticulateOptionsValidator>();

            _ = builder.AddNotificationHandler<ContentSavingNotification, ContentSavingHandler>();
            _ = builder.AddNotificationHandler<ContentSavedNotification, ContentSavedHandler>();
            _ = builder.AddNotificationHandler<ContentTypeSavingNotification, ContentTypeSavingHandler>();
            _ = builder.AddNotificationHandler<ContentCacheRefresherNotification, ContentCacheRefresherHandler>();
            _ = builder.AddNotificationHandler<DomainCacheRefresherNotification, DomainCacheRefresherHandler>();

            _ = services.ConfigureOptions<ArticulatePipelineStartupFilter>();
            _ = services.ConfigureOptions<ConfigureArticulateMvcOptions>();

            _ = services.AddOutputCache(options =>
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
