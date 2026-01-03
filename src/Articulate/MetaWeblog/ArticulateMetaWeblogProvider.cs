#nullable enable
using System.Globalization;
using System.Security.Authentication;
using System.Text.RegularExpressions;
using Articulate.Services;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Web;
using WilderMinds.MetaWeblog;
using Tag = WilderMinds.MetaWeblog.Tag;

namespace Articulate.MetaWeblog
{
    public class ArticulateMetaWeblogProvider : IMetaWeblogProvider
    {
        private static readonly char[] _commaSeparator = [','];
        private readonly int _articulateBlogRootNodeId;
        private readonly Lazy<IMedia> _articulateRootMediaFolder;
        private readonly IBackOfficeUserManager _backOfficeUserManager;
        private readonly IContentService _contentService;
        private readonly IContentTypeService _contentTypeService;
        private readonly IDataTypeService _dataTypeService;
        private readonly IJsonSerializer _jsonSerializer;
        private readonly ILanguageService _languageService;
        private readonly ILogger<ArticulateMetaWeblogProvider> _logger;
        private readonly MediaFileManager _mediaFileManager;
        private readonly PropertyEditorCollection _propertyEditors;
        private readonly IPublishedValueFallback _publishedValueFallback;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly ITagService _tagService;
        private readonly IUmbracoContextAccessor _umbracoContextAccessor;
        private readonly IUserService _userService;
        private readonly IArticulateImportMediaService _service;
        private readonly IMarkdownToHtmlConverter _markdownToHtmlConverter;

        public ArticulateMetaWeblogProvider(
            IUmbracoContextAccessor umbracoContextAccessor,
            IUserService userService,
            IContentTypeService contentTypeService,
            ILanguageService languageService,
            IBackOfficeUserManager backOfficeUserManager,
            IContentService contentService,
            IShortStringHelper shortStringHelper,
            IDataTypeService dataTypeService,
            PropertyEditorCollection propertyEditors,
            IJsonSerializer jsonSerializer,
            MediaFileManager mediaFileManager,
            IPublishedValueFallback publishedValueFallback,
            ITagService tagService,
            ILogger<ArticulateMetaWeblogProvider> logger,
            IMediaService mediaService,
            int articulateBlogRootNodeId,
            IArticulateImportMediaService service,
            IMarkdownToHtmlConverter markdownToHtmlConverter)
        {
            _umbracoContextAccessor = umbracoContextAccessor;
            _userService = userService;
            _contentTypeService = contentTypeService;
            _languageService = languageService;
            _backOfficeUserManager = backOfficeUserManager;
            _contentService = contentService;
            _shortStringHelper = shortStringHelper;
            _dataTypeService = dataTypeService;
            _propertyEditors = propertyEditors;
            _jsonSerializer = jsonSerializer;
            _mediaFileManager = mediaFileManager;
            _publishedValueFallback = publishedValueFallback;
            _tagService = tagService;
            _articulateBlogRootNodeId = articulateBlogRootNodeId;
            _logger = logger;
            IMediaService localMediaService = mediaService;
            _service = service;
            _markdownToHtmlConverter = markdownToHtmlConverter;
            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
            {
                IMedia? root = localMediaService.GetRootMedia().FirstOrDefault(x =>
                    x.Name == ArticulateConstants.Convention.ArticulateMediaFolder &&
                    x.ContentType.Alias.InvariantEquals(
                        Constants.Conventions.MediaTypes.Folder));
                return root ?? localMediaService.CreateMediaWithIdentity(
                    ArticulateConstants.Convention.ArticulateMediaFolder,
                    Constants.System.Root,
                    Constants.Conventions.MediaTypes.Folder);
            });
        }

        // Seems these are not used/supported
        /// <inheritdoc/>
        public Task<int> AddCategoryAsync(string key, string username, string password, NewCategory category) =>
            throw new NotSupportedException();

        // Not supporting pages from the WordPress implementation
        /// <inheritdoc/>
        public Task<string> AddPageAsync(string blogid, string username, string password, Page page, bool publish) =>
            throw new NotSupportedException();

        /// <inheritdoc/>
        public async Task<string> AddPostAsync(string blogid, string username, string password, Post post, bool publish)
        {
            IUser user = await ValidateUserAsync(username, password);

            IPublishedContent root = BlogRoot();

            IPublishedContent node =
                root.ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.FirstOrDefault() ??
                throw new InvalidOperationException("No Articulate Archive node found");

            IContentType contentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateRichText) ??
                                       throw new InvalidOperationException(
                                           "No content type found with alias 'ArticulateRichText'");

            IContent content = await _contentService.CreateWithInvariantOrDefaultCultureNameAsync(
                post.title, node.Id, contentType, _languageService, _logger, user.Id);

            var extractFirstImageAsProperty = false;
            if (root.HasProperty("extractFirstImage"))
            {
                extractFirstImageAsProperty = root.Value<bool>("extractFirstImage");
            }

            await AddOrUpdateContentAsync(content, contentType, post, user, publish, extractFirstImageAsProperty);

            return content.Id.ToString(CultureInfo.InvariantCulture);
        }

        /// <inheritdoc/>
        public Task<bool> DeletePageAsync(string blogid, string username, string password, string pageid) =>
            throw new NotSupportedException();

        /// <inheritdoc/>
        public async Task<bool> DeletePostAsync(
            string key,
            string postid,
            string username,
            string password,
            bool publish)
        {
            IUser user = await ValidateUserAsync(username, password);
            var userId = user.Id;

            Attempt<int> asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                return false;
            }

            // first see if it's published
            IContent? content = _contentService.GetById(asInt.Result);
            if (content is null)
            {
                return false;
            }

            // Put in recycle bin - rather than unpublish
            OperationResult recycleResult = _contentService.MoveToRecycleBin(content, userId);
            if (!recycleResult.Success)
            {
                _logger.LogWarning("Failed to move content {ContentId} to recycle bin", content.Id);
                return false;
            }

            return true;
        }

        /// <inheritdoc/>
        public Task<bool> EditPageAsync(
            string blogid,
            string pageid,
            string username,
            string password,
            Page page,
            bool publish) => throw new NotSupportedException();

        /// <inheritdoc/>
        public async Task<bool> EditPostAsync(string postid, string username, string password, Post post, bool publish)
        {
            IUser user = await ValidateUserAsync(username, password);

            Attempt<int> asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                throw new InvalidOperationException("The id could not be parsed to an integer");
            }

            IContent umbracoContent = _contentService.GetById(asInt.Result) ??
                                      throw new InvalidOperationException(
                                          $"The content with id {asInt.Result} could not be found");

            IContentType contentType = _contentTypeService.Get(umbracoContent.ContentType.Alias) ??
                                       throw new InvalidOperationException(
                                           $"No content type found with alias '{umbracoContent.ContentType.Alias}'");

            IPublishedContent root = BlogRoot();

            var extractFirstImageAsProperty = false;
            if (root.HasProperty("extractFirstImage"))
            {
                extractFirstImageAsProperty = root.Value<bool>("extractFirstImage");
            }

            await AddOrUpdateContentAsync(umbracoContent, contentType, post, user, publish, extractFirstImageAsProperty)
                ;

            // Bool - assume to notify if published with new updates
            return true;
        }

        /// <inheritdoc/>
        public Task<Author[]> GetAuthorsAsync(string blogid, string username, string password) =>
            throw new NotSupportedException();

        /// <inheritdoc/>
        public async Task<CategoryInfo[]> GetCategoriesAsync(string blogid, string username, string password)
        {
            _ = await ValidateUserAsync(username, password);

            // TODO: These would be across all Articulate Blog root nodes :S
            IEnumerable<ITag> all = await _tagService.GetAllAsync(ArticulateConstants.DataType.ArticulateCategories);

            CategoryInfo[] tags =
            [
                .. all.Select(x => new CategoryInfo
                {
                    title = x.Text, categoryid = x.Id.ToString(),

                    // TODO HTML & RSS URL ? (Wasnt used before)
                })
            ];

            return tags;
        }

        /// <inheritdoc/>
        public Task<Page> GetPageAsync(string blogid, string pageid, string username, string password) =>
            throw new NotSupportedException();

        /// <inheritdoc/>
        public Task<Page[]> GetPagesAsync(string blogid, string username, string password, int numPages) =>
            throw new NotSupportedException();

        /// <inheritdoc/>
        public async Task<Post> GetPostAsync(string postid, string username, string password)
        {
            _ = await ValidateUserAsync(username, password);

            Attempt<int> asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                throw new InvalidOperationException("The id could not be parsed to an integer");
            }

            // first see if it's published
            IPublishedContent? post = _umbracoContextAccessor.GetRequiredUmbracoContext().Content.GetById(asInt.Result);
            if (post is not null)
            {
                Post fromPost = FromPost(new PostModel(post, _publishedValueFallback));
                return fromPost;
            }

            IContent content = _contentService.GetById(asInt.Result) ??
                               throw new InvalidOperationException("No post found with id " + postid);

            Post fromContent = FromContent(content);
            return fromContent;
        }

        /// <inheritdoc/>
        public async Task<Post[]> GetRecentPostsAsync(
            string blogid,
            string username,
            string password,
            int numberOfPosts)
        {
            if (numberOfPosts < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(numberOfPosts), "Number of posts must be non-negative");
            }

            // Cap at reasonable maximum to prevent abuse
            numberOfPosts = Math.Min(numberOfPosts, 1000);

            _ = await ValidateUserAsync(username, password);

            IPublishedContent node =
                BlogRoot().ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.FirstOrDefault() ??
                throw new InvalidOperationException("No Articulate Archive node found");

            Post[] recent =
            [
                .. _contentService
                    .GetPagedChildren(
                        node.Id,
                        0,
                        numberOfPosts,
                        out var _,
                        ordering: Ordering.By("updateDate", Direction.Descending))
                    .Select(FromContent)
            ];

            return recent;
        }

        /// <inheritdoc/>
        public async Task<Tag[]> GetTagsAsync(string blogid, string username, string password)
        {
            _ = await ValidateUserAsync(username, password);

            // TODO: These would be across all Articulate Blog root nodes :S
            IEnumerable<ITag> all = await _tagService.GetAllAsync(ArticulateConstants.DataType.ArticulateTags);

            Tag[] tags = [.. all.Select(x => new Tag { name = x.Text })];

            return tags;
        }

        /// <inheritdoc/>
        public Task<UserInfo> GetUserInfoAsync(string key, string username, string password) =>
            throw new NotSupportedException();

        /// <inheritdoc/>
        public async Task<BlogInfo[]> GetUsersBlogsAsync(string key, string username, string password)
        {
            _ = await ValidateUserAsync(username, password);

            IPublishedContent node = BlogRoot();
            BlogInfo[] blogs =
            [
                new() { blogid = node.Id.ToString(), blogName = node.Name, url = node.Url() }
            ];

            return blogs;
        }


        /// <inheritdoc/>
        public async Task<MediaObjectInfo> NewMediaObjectAsync(
            string blogid,
            string username,
            string password,
            MediaObject mediaObject)
        {
            _ = await ValidateUserAsync(username, password);

            if (string.IsNullOrWhiteSpace(mediaObject.bits))
            {
                throw new ArgumentException("Invalid file", nameof(mediaObject));
            }

            // Decode and validate the image using shared service
            var fileName = Path.GetFileName(mediaObject.name);
            ImportMediaValidationResult validationResult = await _service.DecodeAndValidateBase64ImageAsync(
                mediaObject.bits,
                fileName);

            if (!validationResult.IsValid)
            {
                throw new ArgumentException(
                    $"Image validation failed: {validationResult.ErrorMessage}",
                    nameof(mediaObject));
            }

            try
            {
                // Save to file system using shared service
                var absoluteUrl = await _service.SaveToFileSystemAsync(
                    validationResult.ValidatedStream!,
                    validationResult.CorrectExtension!,
                    fileName);

                // Security: Prevent silent failure from returning empty URL
                if (string.IsNullOrEmpty(absoluteUrl))
                {
                    _logger.LogWarning(
                        "Failed to save MetaWeblog image {FileName} to filesystem - SaveToFileSystemAsync returned empty URL",
                        fileName);
                    throw new InvalidOperationException(
                        "Failed to save image to filesystem - SaveToFileSystemAsync returned empty URL");
                }

                return new MediaObjectInfo { url = absoluteUrl };
            }
            finally
            {
                if (validationResult.ValidatedStream is not null)
                {
                    await validationResult.ValidatedStream.DisposeAsync();
                }
            }
        }

        private async Task AddOrUpdateContentAsync(
            IContent content,
            IContentType contentType,
            Post post,
            IUser user,
            bool publish,
            bool extractFirstImageAsProperty)
        {
            await content.SetInvariantOrDefaultCultureNameAsync(post.title, contentType, _languageService, _logger);
            await content.SetInvariantOrDefaultCultureValueAsync("author", user.Name, contentType, _languageService, _logger);

            if (content.HasProperty("richText"))
            {
                await ProcessRichTextContentAsync(content, contentType, post, extractFirstImageAsProperty);
            }

            if (!post.link.IsNullOrWhiteSpace())
            {
                await content.SetInvariantOrDefaultCultureValueAsync(
                    Constants.Conventions.Content.UrlName,
                    post.link,
                    contentType,
                    _languageService,
                    _logger);
            }

            if (!post.mt_excerpt.IsNullOrWhiteSpace())
            {
                await content
                    .SetInvariantOrDefaultCultureValueAsync(
                        "excerpt",
                        post.mt_excerpt,
                        contentType,
                        _languageService,
                        _logger);
            }

            await SetCommentSettingsAsync(content, contentType, post.mt_allow_comments);

            await content.AssignInvariantOrDefaultCultureTagsAsync(
                "categories",
                post.categories,
                contentType,
                _languageService,
                _dataTypeService,
                _propertyEditors,
                _jsonSerializer,
                _logger);

            var tags = post.mt_keywords
                .Split(_commaSeparator, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Distinct()
                .ToArray();

            await content.AssignInvariantOrDefaultCultureTagsAsync(
                "tags",
                tags,
                contentType,
                _languageService,
                _dataTypeService,
                _propertyEditors,
                _jsonSerializer,
                _logger);

            await SaveAndPublishIfNeededAsync(content, user, post, publish);
        }

        /// <summary>
        /// Processes rich text content from MetaWebLog clients, sanitizing HTML and extracting first image.
        /// </summary>
        /// <remarks>
        /// Security Note: This method processes HTML from MetaWebLog clients (e.g., Open Live Writer).
        /// XSS/protocol injection risk is mitigated by:
        /// 1. MetaWebLog is authenticated (requires valid Umbraco user credentials)
        /// 2. HTML sanitization strips invalid protocols (file://, javascript:, data:, etc.)
        /// 3. Only http://, https://, and /media/ URLs are allowed in image src attributes
        /// 4. Import/export functionality is needed for migrating content from external blog platforms
        /// TODO: Consider using IHtmlSanitizer for consistent sanitization across all content types.
        /// Currently only Markdown content uses IHtmlSanitizer. This would require a centralized
        /// rendering service to avoid performance overhead on every save.
        /// </remarks>
        private async Task ProcessRichTextContentAsync(
            IContent content,
            IContentType contentType,
            Post post,
            bool extractFirstImageAsProperty)
        {
            // Strip invalid protocol URLs first (file://, javascript:, data:, etc.)
            var cleanedContent = StripInvalidImageUrls(post.description);

            // Log warning if invalid URLs were found and stripped
            if (cleanedContent != post.description)
            {
                _logger.LogWarning(
                    "Stripped invalid protocol URLs from post '{PostName}' - MetaWebLog client may be using local file paths or dangerous protocols",
                    content.Name ?? "New Post");
            }

            Match firstImageMatch = ArticulateMetaWeblogRegexes.MediaSourceRegex().Match(cleanedContent);
            var firstImageRelativePath = firstImageMatch is { Success: true, Groups.Count: 2 }
                ? firstImageMatch.Groups[1].Value
                : string.Empty;

            var contentToSave = UpdateMediaSourceUrls(cleanedContent);
            contentToSave = UpdateMediaHrefUrls(contentToSave);

            await content
                .SetInvariantOrDefaultCultureValueAsync(
                    "richText",
                    contentToSave,
                    contentType,
                    _languageService,
                    _logger);

            if (extractFirstImageAsProperty && content.HasProperty("postImage") &&
                !firstImageRelativePath.IsNullOrWhiteSpace())
            {
                await ExtractAndSaveFirstImageAsync(content, contentType, firstImageRelativePath);
            }
        }

        /// <summary>
        /// Strips images with invalid protocols from HTML content.
        /// Only allows http://, https://, and /media/ URLs.
        /// </summary>
        /// <remarks>
        /// This prevents Open Live Writer and other MetaWebLog clients from inserting:
        /// - file:/// URLs (local file paths)
        /// - javascript: URLs (XSS)
        /// - data: URLs (embedded scripts/content)
        /// - Protocol-relative URLs (//)
        /// - Any other non-whitelisted protocol
        /// </remarks>
        private string StripInvalidImageUrls(string content)
        {
            // Remove entire <p> tags containing images with invalid src
            // Negative lookahead: (?!https?://|/media/) rejects anything not starting with:
            // - http:// or https://
            // - /media/
            content = Regex.Replace(
                content,
                @"<p[^>]*>\s*<img[^>]*src=[""'](?!https?://|/media/)[^""']*[""'][^>]*>\s*</p>",
                string.Empty,
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
                TimeSpan.FromSeconds(1));

            // Remove any remaining images with invalid src (not in paragraphs)
            content = Regex.Replace(
                content,
                @"<img[^>]*src=[""'](?!https?://|/media/)[^""']*[""'][^>]*>",
                string.Empty,
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
                TimeSpan.FromSeconds(1));

            return content;
        }

        private string UpdateMediaSourceUrls(string description)
        {
            return ArticulateMetaWeblogRegexes.MediaSourceRegex().Replace(description, match =>
            {
                if (match.Groups.Count != 2)
                {
                    return match.Value;
                }

                var relativePath = match.Groups[1].Value;
                var mediaFileSystemPath = _mediaFileManager.FileSystem.GetUrl(relativePath);

                return " src=\"" + mediaFileSystemPath + "\"";
            });
        }

        private string UpdateMediaHrefUrls(string content)
        {
            var imagesProcessed = 0;
            return ArticulateMetaWeblogRegexes.MediaHrefRegex().Replace(content, match =>
            {
                if (match.Groups.Count != 2)
                {
                    return match.Value;
                }

                var relativePath = match.Groups[1].Value;
                var mediaFileSystemPath = _mediaFileManager.FileSystem.GetUrl(relativePath);

                var href = " href=\"" +
                           mediaFileSystemPath +
                           "\" class=\"a-image-" + imagesProcessed + "\" ";

                imagesProcessed++;

                return href;
            });
        }

        private async Task ExtractAndSaveFirstImageAsync(
            IContent content,
            IContentType contentType,
            string firstImageRelativePath)
        {
            if (!_mediaFileManager.FileSystem.FileExists(firstImageRelativePath))
            {
                return;
            }

            try
            {
                await using Stream fileStream = _mediaFileManager.FileSystem.OpenFile(firstImageRelativePath);
                var fileName = Path.GetFileName(firstImageRelativePath);
                var extension = Path.GetExtension(fileName);

                ImportMediaSaveResult saveResult = await _service.SaveToMediaLibraryAsync(
                    fileStream,
                    fileName,
                    extension,
                    _articulateRootMediaFolder.Value);

                if (saveResult.Success && !string.IsNullOrEmpty(saveResult.MediaUdi))
                {
                    await content.SetInvariantOrDefaultCultureValueAsync(
                        "postImage",
                        saveResult.MediaUdi,
                        contentType,
                        _languageService,
                        _logger);
                }
                else
                {
                    _logger.LogWarning(
                        "Failed to save featured image {FileName}: {ErrorMessage}",
                        fileName,
                        saveResult.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Could not create media item for featured image {FileName}",
                    firstImageRelativePath);
            }
        }

        private async Task SetCommentSettingsAsync(IContent content, IContentType contentType, int allowComments)
        {
            switch (allowComments)
            {
                case 1:
                    await content
                        .SetInvariantOrDefaultCultureValueAsync(
                            "enableComments",
                            1,
                            contentType,
                            _languageService,
                            _logger);
                    break;
                case 2:
                    await content
                        .SetInvariantOrDefaultCultureValueAsync(
                            "enableComments",
                            0,
                            contentType,
                            _languageService,
                            _logger);
                    break;
            }
        }

        private async Task SaveAndPublishIfNeededAsync(IContent content, IUser user, Post post, bool publish)
        {
            if (publish)
            {
                if (post.dateCreated != DateTime.MinValue)
                {
                    IContentType? contentType = _contentTypeService.Get(content.ContentTypeId);
                    if (contentType is not null)
                    {
                        await content.SetInvariantOrDefaultCultureValueAsync(
                            "publishedDate",
                            post.dateCreated,
                            contentType,
                            _languageService,
                            _logger);
                    }
                }

                OperationResult saveAndPublishSaveResult = _contentService.Save(content, user.Id);
                saveAndPublishSaveResult.EnsureSuccess(_logger, $"save content {content.Id}");

                PublishResult publishResult = _contentService.Publish(content, ["*"], user.Id);
                publishResult.EnsureSuccess(_logger, $"publish content {content.Id}");
            }
            else
            {
                OperationResult saveResult = _contentService.Save(content, user.Id);
                saveResult.EnsureSuccess(_logger, $"save content {content.Id}");
            }
        }

        private IPublishedContent BlogRoot()
        {
            IPublishedContent node =
                _umbracoContextAccessor.GetRequiredUmbracoContext().Content.GetById(_articulateBlogRootNodeId) ??
                throw new InvalidOperationException("No node found by route");

            return node;
        }

        private Post FromContent(IContent post)
        {
            var tagsValue = post.GetValue<string>("tags");
            var categoriesValue = post.GetValue<string>("categories");

            return new Post
            {
                title = post.Name,
                postid = post.Id.ToString(CultureInfo.InvariantCulture),
                dateCreated = post.UpdateDate,
                mt_excerpt = post.GetValue<string>("excerpt"),
                link = string.Empty,
                mt_keywords = !string.IsNullOrWhiteSpace(tagsValue)
                    ? string.Join(',', tagsValue.Split(_commaSeparator, StringSplitOptions.RemoveEmptyEntries))
                    : string.Empty,
                categories = !string.IsNullOrEmpty(categoriesValue)
                    ? categoriesValue.Split(_commaSeparator, StringSplitOptions.RemoveEmptyEntries)
                    : [],
                description = post.ContentType.Alias == ArticulateConstants.ContentType.ArticulateRichText
                    ? post.GetValue<string>("richText")
                    : _markdownToHtmlConverter.ToHtml(post.GetValue<string>("markdown") ?? string.Empty),
                permalink = post.GetValue<string>(Constants.Conventions.Content.UrlName).IsNullOrWhiteSpace()
                    ? post.Name?.ToUrlSegment(_shortStringHelper)
                    : post.GetValue<string>(Constants.Conventions.Content.UrlName)?.ToUrlSegment(_shortStringHelper),
            };
        }

        /// <summary>
        ///     There are so many variants of Metaweblog API so I've just included as many properties, custom ones, etc... that i
        ///     can find.
        /// </summary>
        /// <param name="post"></param>
        /// <returns></returns>
        /// <remarks>
        ///     http://msdn.microsoft.com/en-us/library/bb463260.aspx
        ///     http://xmlrpc.scripting.com/metaWeblogApi.html
        ///     http://cyber.law.harvard.edu/rss/rss.html#hrelementsOfLtitemgt
        ///     http://codex.wordpress.org/XML-RPC_MetaWeblog_API
        ///     https://blogengine.codeplex.com/SourceControl/latest#BlogEngine/BlogEngine.Core/API/MetaWeblog/MetaWeblogHandler.cs .
        /// </remarks>
        private static Post FromPost(PostModel post) => new()
        {
            categories = [.. post.Categories],
            description = post.Body.ToString(),
            dateCreated = post.PublishedDate != default ? post.PublishedDate : post.UpdateDate,
            postid = post.Id.ToString(CultureInfo.InvariantCulture),
            wp_slug = post.Url(),
            mt_excerpt = post.Excerpt,
            mt_keywords = string.Join(',', post.Tags.ToArray()),
            title = post.Name,
        };

        private async Task<IUser> ValidateUserAsync(string username, string password)
        {
            if (!await _backOfficeUserManager.ValidateCredentialsAsync(username, password))
            {
                // Throw some error if not valid credentials - so we exit out early of stuff
                throw new AuthenticationException($"Failed to validate user credentials for {username}");
            }

            IUser user = _userService.GetByUsername(username) ??
                         throw new InvalidOperationException($"Failed to find user for {username}");

            return user;
        }
    }
}
