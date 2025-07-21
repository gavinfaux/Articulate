using System;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PropertyEditors.ValueConverters;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;
using Umbraco.Extensions;

namespace Articulate.Migrations
{
    public class PostImageMigrationComposer : ComponentComposer<PostImageMigrationComponent>
    {
    }

    public class PostImageMigrationComponent(
        ICoreScopeProvider scopeProvider,
        IMigrationPlanExecutor migrationPlanExecutor,
        IKeyValueService keyValueService,
        IRuntimeState runtimeState)
        : IComponent
    {
        public void Initialize()
        {
            if (runtimeState.Level < RuntimeLevel.Run)
            {
                return;
            }

            var migrationPlan = new MigrationPlan("Articulate_Post_Image_Migration");

            _ = migrationPlan.From(string.Empty)
                .To<PostImagePropertyFieldMigration>(PostImagePropertyFieldMigration.PostImagePropertyTypeAlias);

            var upgrader = new Upgrader(migrationPlan);
            _ = upgrader.Execute(migrationPlanExecutor, scopeProvider, keyValueService);
        }

        public void Terminate() { }
    }

    public class PostImagePropertyFieldMigration : MigrationBase
    {
        private readonly IContentService _contentService;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly Lazy<IMedia> _articulateRootMediaFolder;
        private readonly ILogger<PostImagePropertyFieldMigration> _logger;
        private readonly MediaFileManager _mediaFileManager;
        private readonly IMediaService _mediaService;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly ILocalizationService _localizationService;
        private readonly IContentTypeService _contentTypeService;

        public const string PostImagePropertyTypeAlias = "postImage";

        public PostImagePropertyFieldMigration(IMigrationContext context, IContentService contentService,
            MediaFileManager mediaFileManager, IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            ILogger<PostImagePropertyFieldMigration> logger, IMediaService mediaService,
            MediaUrlGeneratorCollection mediaUrlGenerators, IShortStringHelper shortStringHelper,
            ILocalizationService localizationService, IContentTypeService contentTypeService) : base(context)
        {
            _contentTypeService = contentTypeService;
            _localizationService = localizationService;
            _contentService = contentService;
            _shortStringHelper = shortStringHelper;
            _mediaFileManager = mediaFileManager;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _logger = logger;
            _mediaService = mediaService;
            _mediaUrlGenerators = mediaUrlGenerators;
            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
            {
                var root = _mediaService.GetRootMedia().FirstOrDefault(x =>
                    x.Name == ArticulateConstants.Convention.Articulate &&
                    x.ContentType.Alias.InvariantEquals(Constants.Conventions.MediaTypes.Folder));
                return root ??= _mediaService.CreateMediaWithIdentity(ArticulateConstants.Convention.Articulate,
                    Constants.System.Root, Constants.Conventions.MediaTypes.Folder);
            });
        }

        protected override void Migrate()
        {
            var migrateContentTypes = new[] { ArticulateConstants.ContentType.ArticulatePost, ArticulateConstants.ContentType.ArticulateMarkdown, ArticulateConstants.ContentType.ArticulateRichText };
            var posts = _contentService.GetRootContent()
                .Where(x => migrateContentTypes.Contains(x.ContentType.Alias)).ToList();
            foreach (var post in posts)
            {
                string url = null;
                try
                {
                    // Step 0: Check if the target property exists.
                    if (!post.HasProperty(PostImagePropertyTypeAlias))
                    {
                        _logger.LogWarning("Content {key} of type {contentType} has no {alias}", post.Key, post.ContentType.Alias, PostImagePropertyTypeAlias);
                        continue;
                    }

                    // Step 1: Check if the target property is already populated correctly.
                    var existingMediaWithCrops = post.GetValue<MediaWithCrops>(PostImagePropertyTypeAlias);
                    if (existingMediaWithCrops != null && existingMediaWithCrops.Key != Guid.Empty)
                    {
                        _logger.LogDebug("Content {key} type {contentType} {alias} is already a MediaWithCrops and has a value", post.Key, post.ContentType.Alias, PostImagePropertyTypeAlias);
                        continue;
                    }

                    var sourceValue = post.GetValue<string>(PostImagePropertyTypeAlias); // Get the raw value (JSON or path)

                    // Step 3: Inspect the raw value from the primary property.
                    if (!string.IsNullOrWhiteSpace(sourceValue))
                    {
                        if (!sourceValue.DetectIsEmptyJson())
                        {
                            // It's likely an old Image Cropper value.
                            var imageCropperValue = System.Text.Json.JsonSerializer.Deserialize<ImageCropperValue>(sourceValue);
                            url = imageCropperValue?.Src;
                        }
                        else if (!sourceValue.Equals("[]"))
                        {
                            // It's not JSON, so treat it as a direct path.
                            url = sourceValue;
                        }
                    }
                    // Step 4: If the primary property didn't yield a URL, try the fallback property.
                    if (string.IsNullOrWhiteSpace(url))
                    {
                        var fallbackUrl = post.GetValue<string>(Constants.Conventions.Media.File);
                        if (!string.IsNullOrWhiteSpace(fallbackUrl) && !fallbackUrl.Equals("[]"))
                        {
                            url = fallbackUrl;
                        }
                    }

                    // Step 5: If we still have no URL after all checks, we cannot proceed. Skip this post.
                    if (string.IsNullOrWhiteSpace(url))
                    {
                        // Log that we are skipping this post because no valid source URL was found.
                        _logger.LogError("Could not find a path/url for Content {key} type {contentType} and {alias} field. Skipping, please check content", post.Key, post.ContentType.Alias, PostImagePropertyTypeAlias);
                        continue;
                    }
                    // Step 6: We have a valid source URL. Proceed with creating the media item.
                    if (!string.IsNullOrWhiteSpace(url) && _mediaFileManager.FileSystem.FileExists(url))
                    {
                        using var fileStream = _mediaFileManager.FileSystem.OpenFile(url);
                        var fileName = Path.GetFileName(url);

                        var mediaItem = _mediaService.CreateMedia(fileName, _articulateRootMediaFolder.Value,
                            Constants.Conventions.MediaTypes.Image);
                        mediaItem.SetValue(
                            _mediaFileManager,
                            _mediaUrlGenerators,
                            _shortStringHelper,
                            _contentTypeBaseServiceProvider,
                            Constants.Conventions.Media.File,
                            fileName,
                            fileStream);

                        _ = _mediaService.Save(mediaItem);

                        var udi = Udi.Create(Constants.UdiEntityType.Media, mediaItem.Key);

                        var contentType = _contentTypeService.Get(post.ContentType.Alias);
                        post.SetInvariantOrDefaultCultureValue(
                            "postImage",
                            udi.ToString(),
                            contentType,
                            _localizationService);
                        if (post.PublishedState != PublishedState.Published)
                        {
                            _ = _contentService.Save(post);
                        }
                        else
                        {
                            _ = _contentService.Save(post);
                            _ = _contentService.Publish(post, ["*"]);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while attempting to migrate content with {key} of type {contentType} field {alias}, url: {url ?? `Not found?`}; please check content",
                        url);
                }
            }
        }
    }
}
