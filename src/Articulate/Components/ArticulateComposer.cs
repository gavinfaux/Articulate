using System;
using Articulate.ImportExport;
using Articulate.Options;
using Articulate.Packaging;
using Articulate.Routing;
using Articulate.Services;
using Articulate.Syndication;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Smidge;
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

            var services = builder.Services;
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

            builder.UrlProviders().InsertBefore<NewDefaultUrlProvider, DateFormattedUrlProvider>();

            builder.ContentFinders().InsertBefore<ContentFinderByUrlNew, DateFormattedPostContentFinder>();

            services.AddSingleton<IBundleManager, BundleManager>();
            services.AddOptions<ArticulateOptions>();

            builder.AddNotificationHandler<ContentSavingNotification, ContentSavingHandler>();
            builder.AddNotificationHandler<ContentSavedNotification, ContentSavedHandler>();
            builder.AddNotificationHandler<ContentTypeSavingNotification, ContentTypeSavingHandler>();
            // TODO: Deprecated: builder.AddNotificationHandler<ServerVariablesParsingNotification, ServerVariablesParsingHandler>();
            builder.AddNotificationHandler<ContentCacheRefresherNotification, ContentCacheRefresherHandler>();
            builder.AddNotificationHandler<DomainCacheRefresherNotification, DomainCacheRefresherHandler>();

            builder.Services.ConfigureOptions<ArticulatePipelineStartupFilter>();
            builder.Services.ConfigureOptions<ConfigureArticulateMvcOptions>();
            builder.Services.ConfigureOptions<ArticulateApiSwaggerOptions>();

            builder.Services.AddOutputCache(options =>
            {               
                options.AddPolicy("Articulate120", builder =>
                    builder.Expire(TimeSpan.FromSeconds(120)));
                options.AddPolicy("Articulate300", builder =>
                    builder.Expire(TimeSpan.FromSeconds(300)));
                options.AddPolicy("Articulate60", builder =>
                    builder.Expire(TimeSpan.FromSeconds(60)));
            });
        }
    }
}
