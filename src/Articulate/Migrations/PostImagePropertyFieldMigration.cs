//#nullable enable
//using System;
//using System.Collections.Generic;
//using System.IO;
//using System.Linq;
//using System.Runtime.Serialization;
//using System.Text.Json.Nodes;
//using Microsoft.Extensions.Logging;
//using Umbraco.Cms.Core;
//using Umbraco.Cms.Core.Composing;
//using Umbraco.Cms.Core.IO;
//using Umbraco.Cms.Core.Migrations;
//using Umbraco.Cms.Core.Models;
//using Umbraco.Cms.Core.PropertyEditors;
//using Umbraco.Cms.Core.PropertyEditors.ValueConverters;
//using Umbraco.Cms.Core.Scoping;
//using Umbraco.Cms.Core.Serialization;
//using Umbraco.Cms.Core.Services;
//using Umbraco.Cms.Core.Strings;
//using Umbraco.Cms.Infrastructure.Migrations;
//using Umbraco.Cms.Infrastructure.Migrations.Upgrade;
//using Umbraco.Extensions;

//namespace Articulate.Migrations
//{
//    public class PostImageMigrationComposer : ComponentComposer<PostImageMigrationComponent>
//    {
//    }

//    public class PostImageMigrationComponent(
//        ICoreScopeProvider scopeProvider,
//        IMigrationPlanExecutor migrationPlanExecutor,
//        IKeyValueService keyValueService,
//        IRuntimeState runtimeState)
//        : IComponent
//    {
//        public void Initialize()
//        {
//            if (runtimeState.Level < RuntimeLevel.Run)
//            {
//                return;
//            }

//            var migrationPlan = new MigrationPlan("Articulate_Post_Image_Migration");
//            var migrationPlanValue = new Guid("e4f5d2d4-6d5d-4d5d-4d5d-4d5d4d5d4d5c");
//             migrationPlan.From(string.Empty)
//                .To<PostImagePropertyFieldMigration>(migrationPlanValue);

//            var upgrader = new Upgrader(migrationPlan);
//             upgrader.Execute(migrationPlanExecutor, scopeProvider, keyValueService);
//        }

//        public void Terminate() { }
//    }

//    public class PostImagePropertyFieldMigration : MigrationBase
//    {
//        private readonly IContentService _contentService;
//        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
//        private readonly Lazy<IMedia> _articulateRootMediaFolder;
//        private readonly ILogger<PostImagePropertyFieldMigration> _logger;
//        private readonly MediaFileManager _mediaFileManager;
//        private readonly IMediaService _mediaService;
//        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
//        private readonly IShortStringHelper _shortStringHelper;
//        private readonly ILocalizationService _localizationService;
//        private readonly IContentTypeService _contentTypeService;
//        private readonly IJsonSerializer _jsonSerializer;
//        private const string PostImagePropertyTypeAlias = "postImage";

//        public PostImagePropertyFieldMigration(IMigrationContext context, IContentService contentService,
//            MediaFileManager mediaFileManager, IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
//            ILogger<PostImagePropertyFieldMigration> logger, IMediaService mediaService,
//            MediaUrlGeneratorCollection mediaUrlGenerators, IShortStringHelper shortStringHelper,
//            ILocalizationService localizationService, IContentTypeService contentTypeService,
//            IJsonSerializer jsonSerializer) : base(context)
//        {
//            _contentTypeService = contentTypeService;
//            _localizationService = localizationService;
//            _contentService = contentService;
//            _shortStringHelper = shortStringHelper;
//            _mediaFileManager = mediaFileManager;
//            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
//            _logger = logger;
//            _mediaService = mediaService;
//            _mediaUrlGenerators = mediaUrlGenerators;
//            _jsonSerializer = jsonSerializer;
//            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
//            {
//                var root = _mediaService.GetRootMedia().FirstOrDefault(x =>
//                    x.Name == ArticulateConstants.Convention.Articulate &&
//                    x.ContentType.Alias.InvariantEquals(Constants.Conventions.MediaTypes.Folder));
//                return root ??= _mediaService.CreateMediaWithIdentity(ArticulateConstants.Convention.Articulate,
//                    Constants.System.Root, Constants.Conventions.MediaTypes.Folder);
//            });
//        }

//        internal class MediaWithCropsDto
//        {
//            [DataMember(Name = "key")] public Guid Key { get; set; }

//            [DataMember(Name = "mediaKey")] public Guid MediaKey { get; set; }

//            [DataMember(Name = "crops")] public IEnumerable<ImageCropperValue.ImageCropperCrop> Crops { get; set; }

//            [DataMember(Name = "focalPoint")] public ImageCropperValue.ImageCropperFocalPoint FocalPoint { get; set; }
//        }

//        public bool TryGetCropMediaPath(object value, out string mediaPath)
//        {
//            if (GetFileSrcFromCropPropertyValue(value, out _, false) is var mediaPathValue &&
//                !string.IsNullOrWhiteSpace(mediaPathValue))
//            {
//                mediaPath = mediaPathValue;
//                return true;
//            }

//            mediaPath = null;
//            return false;
//        }

//        private string GetFileSrcFromCropPropertyValue(object propVal, out System.Text.Json.Nodes.JsonObject deserializedValue,
//            bool relative = true)
//        {
//            deserializedValue = null;
//            if (propVal is null || propVal is not string str)
//            {
//                return null;
//            }

//            if (!str.DetectIsJson())
//            {
//                // Assume the value is a plain string with the file path
//                deserializedValue = new JsonObject { { "src", str } };
//            }
//            else
//            {
//                deserializedValue = GetCropJsonObject(str, true);
//            }

//            if (deserializedValue?["src"] is null)
//            {
//                return null;
//            }

//            var src = deserializedValue["src"]!.GetValue<string>();

//            return relative ? _mediaFileManager.FileSystem.GetRelativePath(src!) : src;
//        }

//        private JsonObject GetCropJsonObject(string value, bool writeLog)
//        {
//            if (string.IsNullOrWhiteSpace(value))
//            {
//                return null;
//            }

//            try
//            {
//                return _jsonSerializer.Deserialize<JsonObject>(value);
//            }
//            catch (Exception ex)
//            {
//                if (writeLog)
//                {
//                    _logger.LogError(ex, "Could not parse image cropper value '{Json}'", value);
//                }

//                return null;
//            }
//        }

//        protected override void Migrate()
//        {
//            var migrateContentTypes = new[] { ArticulateConstants.ContentType.ArticulatePost, ArticulateConstants.ContentType.ArticulateMarkdown, ArticulateConstants.ContentType.ArticulateRichText };
//            var contentTypeIds = _contentTypeService.GetAllContentTypeIds(migrateContentTypes).ToArray();
//            var posts = _contentService.GetPagedOfTypes(contentTypeIds, 0, int.MaxValue, out var postCount, null);
//            _logger.LogInformation("Found {PostCount} posts to process for postImage migration.", postCount);

//            foreach (var post in posts)
//            {
//                try
//                {
//                    var migrationResult = TryGetSourceUrl(post);

//                    // If we can't migrate (either already done or no URL found), skip it.
//                    // The helper method is responsible for logging the reason.
//                    if (!migrationResult.CanMigrate || string.IsNullOrWhiteSpace(migrationResult.Url))
//                    {
//                        continue;
//                    }

//                    var url = migrationResult.Url;
//                    var mediaItemKey = Guid.Empty;
//                    if (!UdiParser.TryParse(url, true, out var udiValue))
//                    {
//                        using var fileStream = _mediaFileManager.FileSystem.OpenFile(url);
//                        var fileName = Path.GetFileName(url);

//                        var mediaItem = _mediaService.CreateMedia(fileName, _articulateRootMediaFolder.Value,
//                            Constants.Conventions.MediaTypes.Image);
//                        mediaItem.SetValue(
//                            _mediaFileManager, _mediaUrlGenerators, _shortStringHelper, _contentTypeBaseServiceProvider,
//                            Constants.Conventions.Media.File, fileName, fileStream);

//                        var mediaSaveResult = _mediaService.Save(mediaItem);
//                        if (!mediaSaveResult.Success)
//                        {
//                            _logger.LogError("Failed to save media item for post {PostKey} from URL {Url}", post.Key,
//                                url);
//                            continue;
//                        }

//                        mediaItemKey = mediaItem.Key;
//                    }

//                    // Step 3: Update the post with the new MediaWithCrops UDI.

//                    var udi = udiValue ?? Udi.Create(Constants.UdiEntityType.Media, mediaItemKey);
//                    var guidString = udi.ToString().Replace("umb://media/", "");
//                    if (Guid.TryParse(guidString, out var guid))
//                    {
//                        if (udi is null || guid.Equals(Guid.Empty))
//                        {
//                            _logger.LogError("Invalid UDI for media item for post {PostKey} from source {Url}",
//                                post.Key,
//                                url);
//                            continue;
//                        }
//                    }

//                    var contentType = _contentTypeService.Get(post.ContentType.Alias);

//                    // Use the serializer to create the correct JSON structure for Media Picker v3
//                    //var mediaWithCropsValue = new[]
//                    //{
//                    //    new MediaWithCropsDto { MediaKey = mediaItem.Key, Key = Guid.NewGuid() }
//                    //};
//                    //var newPostImageValue = _jsonSerializer.Serialize(mediaWithCropsValue);

//                    //post.SetInvariantOrDefaultCultureValue(PostImagePropertyTypeAlias, newPostImageValue,contentType, _localizationService);
//                    post.SetInvariantOrDefaultCultureValue(PostImagePropertyTypeAlias, udi, contentType,
//                        _localizationService);

//                    if (post.PublishedState == PublishedState.Published)
//                    {
//                         _contentService.SaveAndPublish(post);
//                    }
//                    else
//                    {
//                         _contentService.Save(post);
//                    }

//                    _logger.LogInformation("Successfully migrated postImage for post {PostKey}", post.Key);
//                }
//                catch (Exception ex)
//                {
//                    _logger.LogError(ex,
//                        "A critical error occurred while migrating post {PostKey}. Please check content.", post.Key);
//                }
//            }
//        }

//        private record MigrationResult(bool CanMigrate, string Url);

//        private MigrationResult TryGetSourceUrl(IContent post)
//        {
//            //TODO: Remove

//            if (!post.HasProperty(PostImagePropertyTypeAlias))
//            {
//                _logger.LogWarning(
//                    "Post {PostKey} of type {ContentTypeAlias} has no '{PropertyAlias}' property. Skipping.", post.Key,
//                    post.ContentType.Alias, PostImagePropertyTypeAlias);
//                return new MigrationResult(false, null);
//            }

//            var sourceValue = post.GetValue<string>(PostImagePropertyTypeAlias);

//            // 1. Is the source value a valid UDI to existing media?
//            if (UdiParser.TryParse(sourceValue, out var udi) && udi is not null)
//            {
//                var media = _mediaService.GetByIds([udi]);
//                if (media.Any())
//                {
//                    _logger.LogInformation(
//                        "Post {PostKey} value is already a valid UDI pointing to existing media. Using it directly.",
//                        post.Key);
//                    // This is a "successful" find, the URL is the UDI string itself.
//                    return new MigrationResult(true, udi.ToString());
//                }

//                _logger.LogWarning("Post {PostKey} has a UDI value '{Udi}' but the media item was not found. Skipping.",
//                    post.Key, udi);
//                return new MigrationResult(false, null);
//            }

//            // 2. Is it JSON?
//            if (!string.IsNullOrWhiteSpace(sourceValue) && sourceValue.DetectIsJson())
//            {
//                // 2a. Check for idempotency: is it already the target format?
//                try
//                {
//                    var cropsList = _jsonSerializer.Deserialize<List<MediaWithCropsDto>>(sourceValue);
//                    if (cropsList is { Count: > 0 } && cropsList.All(c => c.MediaKey != Guid.Empty))
//                    {
//                        _logger.LogInformation("Post {PostKey} is already migrated to MediaWithCrops format. Skipping.",
//                            post.Key);
//                        return new MigrationResult(false, null); // Already migrated
//                    }
//                }
//                catch
//                {
//                    /* Ignore, it's not the target format */
//                }

//                // 2b. If not, maybe it's an old ImageCropper. Try to get a path from it.
//                if (TryGetCropMediaPath(sourceValue, out var cropperPath) && !string.IsNullOrWhiteSpace(cropperPath))
//                {
//                    _logger.LogInformation("Found ImageCropper path '{Path}' for Post {PostKey}.", cropperPath,
//                        post.Key);
//                    return new MigrationResult(true, cropperPath);
//                }
//            }

//            // 3. Is it a direct file path that exists?
//            if (!string.IsNullOrWhiteSpace(sourceValue) && !sourceValue.DetectIsJson())
//            {
//                if (_mediaFileManager.FileSystem.FileExists(sourceValue))
//                {
//                    _logger.LogInformation("Found valid file path '{Path}' for Post {PostKey}.", sourceValue, post.Key);
//                    return new MigrationResult(true, sourceValue);
//                }
//            }

//            // 4. If all of the above failed, try the fallback property.
//            var fallbackUrl = post.GetValue<string>(Constants.Conventions.Media.File);
//            if (!string.IsNullOrWhiteSpace(fallbackUrl) && !fallbackUrl.Equals("[]") &&
//                _mediaFileManager.FileSystem.FileExists(fallbackUrl))
//            {
//                _logger.LogInformation("Using fallback URL '{Path}' for Post {PostKey}.", fallbackUrl, post.Key);
//                return new MigrationResult(true, fallbackUrl);
//            }

//            // 5. If we get here, no valid source was found anywhere.
//            _logger.LogWarning(
//                "Could not determine a valid source URL for Post {PostKey}. The value was '{SourceValue}' and no valid fallback was found. Skipping.",
//                post.Key, sourceValue);
//            return new MigrationResult(false, null);
//        }
//    }
//}
