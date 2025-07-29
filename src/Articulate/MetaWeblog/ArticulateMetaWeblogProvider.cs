#nullable enable
using System.Globalization;
using System.Security.Authentication;
using System.Text.RegularExpressions;
using Articulate.Models;
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
using Umbraco.Extensions;
using WilderMinds.MetaWeblog;
using Tag = WilderMinds.MetaWeblog.Tag;

namespace Articulate.MetaWeblog
{
    public class ArticulateMetaWeblogProvider : IMetaWeblogProvider
    {
        private readonly Lazy<IMedia> _articulateRootMediaFolder;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly ILogger<ArticulateMetaWeblogProvider> _logger;
        private readonly IMediaService _mediaService;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly IUmbracoContextAccessor _umbracoContextAccessor;
        private readonly IUserService _userService;
        private readonly IContentTypeService _contentTypeService;
        private readonly ILanguageService _languageService;
        private readonly IBackOfficeUserManager _backOfficeUserManager;
        private readonly IContentService _contentService;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly IDataTypeService _dataTypeService;
        private readonly PropertyEditorCollection _propertyEditors;
        private readonly IJsonSerializer _jsonSerializer;
        private readonly MediaFileManager _mediaFileManager;
        private readonly IPublishedValueFallback _publishedValueFallback;
        private readonly ITagService _tagService;
        private readonly int _articulateBlogRootNodeId;

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
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            ILogger<ArticulateMetaWeblogProvider> logger,
            IMediaService mediaService,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            int articulateBlogRootNodeId)
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
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _logger = logger;
            _mediaService = mediaService;
            _mediaUrlGenerators = mediaUrlGenerators;
            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
            {
                IMedia? root = _mediaService.GetRootMedia().FirstOrDefault(x =>
                    x.Name == ArticulateConstants.Convention.Articulate && x.ContentType.Alias.InvariantEquals(
                        Constants.Conventions.MediaTypes.Folder));
                return root ?? _mediaService.CreateMediaWithIdentity(
                    ArticulateConstants.Convention.Articulate,
                    Constants.System.Root,
                    Constants.Conventions.MediaTypes.Folder);
            });
        }

        public async Task<BlogInfo[]> GetUsersBlogsAsync(string key, string username, string password)
        {
            await ValidateUser(username, password);

            IPublishedContent node = BlogRoot();
            BlogInfo[] blogs =
            [
                new BlogInfo
                {
                    blogid = node.Id.ToString(),
                    blogName = node.Name,
                    url = node.Url()
                }
            ];

            return blogs;
        }

        public async Task<CategoryInfo[]> GetCategoriesAsync(string blogid, string username, string password)
        {
            await ValidateUser(username, password);

            // TODO: These would be across all Articulate Blog root nodes :S
            IEnumerable<ITag> all = await _tagService.GetAllAsync(ArticulateConstants.DataType.ArticulateCategories);

            CategoryInfo[] tags = all.Select(x => new CategoryInfo
            {
                title = x.Text,
                categoryid = x.Id.ToString()

                // TODO HTML & RSS URL ? (Wasnt used before)
            }).ToArray();

            return tags;
        }

        public async Task<Tag[]> GetTagsAsync(string blogid, string username, string password)
        {
            await ValidateUser(username, password);

            // TODO: These would be across all Articulate Blog root nodes :S
            IEnumerable<ITag> all = await _tagService.GetAllAsync(ArticulateConstants.DataType.ArticulateTags);

            Tag[] tags = all.Select(x => new Tag
                {
                name = x.Text
            })
            .ToArray();

            return tags;
        }

        public async Task<Post[]> GetRecentPostsAsync(string blogid, string username, string password, int numberOfPosts)
        {
            await ValidateUser(username, password);

            IPublishedContent node = BlogRoot().ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.FirstOrDefault() ?? throw new InvalidOperationException("No Articulate Archive node found");

            Post[] recent = _contentService
                    .GetPagedChildren(node.Id, 0, numberOfPosts, out var totalPosts, ordering: Ordering.By("updateDate", direction: Direction.Descending))
                    .Select(FromContent)
                    .ToArray();

            return recent;
        }

        public async Task<string> AddPostAsync(string blogid, string username, string password, Post post, bool publish)
        {
            IUser user = await ValidateUser(username, password);

            IPublishedContent root = BlogRoot();

            IPublishedContent node = root.ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.FirstOrDefault() ?? throw new InvalidOperationException("No Articulate Archive node found");

            IContentType contentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateRichText) ?? throw new InvalidOperationException("No content type found with alias 'ArticulateRichText'");

            IContent content = _contentService.CreateWithInvariantOrDefaultCultureName(
                post.title, node.Id, contentType, _languageService, user.Id);

            var extractFirstImageAsProperty = false;
            if (root.HasProperty("extractFirstImage"))
            {
                extractFirstImageAsProperty = root.Value<bool>("extractFirstImage");
            }

            AddOrUpdateContent(content, contentType, post, user, publish, extractFirstImageAsProperty);

            return content.Id.ToString(CultureInfo.InvariantCulture);

        }

        public async Task<bool> DeletePostAsync(string key, string postid, string username, string password, bool publish)
        {
            IUser user = await ValidateUser(username, password);
            var userId = user.Id;

            Attempt<int> asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                return false;
            }

            //first see if it's published
            IContent? content = _contentService.GetById(asInt.Result);
            if (content is null)
            {
                return false;
            }

            // Put in recylce bin - rather than unpublish
            _contentService.MoveToRecycleBin(content, userId);
            return true;
        }

        public async Task<Post> GetPostAsync(string postid, string username, string password)
        {
            await ValidateUser(username, password);

            Attempt<int> asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                throw new InvalidOperationException("The id could not be parsed to an integer");
            }

            //first see if it's published
            IPublishedContent? post = _umbracoContextAccessor.GetRequiredUmbracoContext().Content.GetById(asInt.Result);
            if (post is not null)
            {
                Post fromPost = FromPost(new PostModel(post, _publishedValueFallback));
                return fromPost;
            }

            IContent content = _contentService.GetById(asInt.Result) ?? throw new InvalidOperationException("No post found with id " + postid);

            Post fromContent = FromContent(content);
            return fromContent;
        }

        public async Task<MediaObjectInfo> NewMediaObjectAsync(string blogid, string username, string password, MediaObject mediaObject)
        {
            await ValidateUser(username, password);

            // TODO: File validation

            var bytes = Convert.FromBase64String(mediaObject.bits);

            // Save File
            using (var ms = new MemoryStream(bytes))
            {
                var fileUrl = "articulate/" + mediaObject.name.ToSafeFileName(_shortStringHelper);
                _mediaFileManager.FileSystem.AddFile(fileUrl, ms);
                var absUrl = _mediaFileManager.FileSystem.GetUrl(fileUrl);

                var result = new MediaObjectInfo
                {
                    url = absUrl
                };

                return result;
            }
        }

        public async Task<bool> EditPostAsync(string postid, string username, string password, Post post, bool publish)
        {
            IUser user = await ValidateUser(username, password);

            Attempt<int> asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                throw new InvalidOperationException("The id could not be parsed to an integer");
            }

            IContent? umbracoContent = _contentService.GetById(asInt.Result);

            if (umbracoContent is null)
            {
                throw new InvalidOperationException($"The content with id {asInt.Result} could not be found");
            }

            IContentType contentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateRichText) ?? throw new InvalidOperationException("No content type found with alias 'ArticulateRichText'");

            IPublishedContent root = BlogRoot();

            var extractFirstImageAsProperty = false;
            if (root.HasProperty("extractFirstImage"))
            {
                extractFirstImageAsProperty = root.Value<bool>("extractFirstImage");
            }

            AddOrUpdateContent(umbracoContent, contentType, post, user, publish, extractFirstImageAsProperty);

            // Bool - assume to notify if published with new updates
            return true;
        }

        // Seems these are not used/supported
        public Task<int> AddCategoryAsync(string key, string username, string password, NewCategory category) => throw new NotImplementedException();
        public Task<Author[]> GetAuthorsAsync(string blogid, string username, string password) => throw new NotImplementedException();
        public Task<UserInfo> GetUserInfoAsync(string key, string username, string password) => throw new NotImplementedException();

        // Not supporting pages from the WordPress implementation
        public Task<string> AddPageAsync(string blogid, string username, string password, Page page, bool publish) => throw new NotImplementedException();
        public Task<bool> EditPageAsync(string blogid, string pageid, string username, string password, Page page, bool publish) => throw new NotImplementedException();
        public Task<bool> DeletePageAsync(string blogid, string username, string password, string pageid) => throw new NotImplementedException();
        public Task<Page> GetPageAsync(string blogid, string pageid, string username, string password) => throw new NotImplementedException();
        public Task<Page[]> GetPagesAsync(string blogid, string username, string password, int numPages) => throw new NotImplementedException();

        private void AddOrUpdateContent(IContent content, IContentType contentType, Post post, IUser user, bool publish, bool extractFirstImageAsProperty)
        {
            content.SetInvariantOrDefaultCultureName(post.title, contentType, _languageService);

            content.SetInvariantOrDefaultCultureValue("author", user.Name, contentType, _languageService);
            if (content.HasProperty("richText"))
            {
                Match firstImageMatch = ArticulateMetaWeblogRegexes.MediaSourceRegex().Match(post.description);
                var firstImageRelativePath = string.Empty;
                if (firstImageMatch is { Success: true, Groups.Count: 2 })
                {
                    firstImageRelativePath = firstImageMatch.Groups[1].Value;
                }

                // Extract the articulate firstImage.
                // Re-update the URL to be the one from the media file system.
                // Live writer will always make the urls absolute even if we return a relative path from NewMediaObject
                // so we will re-update it. If it's the default media file system then this will become a relative path
                // which is what we want, if it's a custom file system it will update it to it's absolute path.
                var contentToSave = ArticulateMetaWeblogRegexes.MediaSourceRegex().Replace(post.description, match =>
                {
                    if (match.Groups.Count == 2)
                    {
                        var relativePath = match.Groups[1].Value;
                        var mediaFileSystemPath = _mediaFileManager.FileSystem.GetUrl(relativePath);

                        return " src=\"" + mediaFileSystemPath + "\"";
                    }

                    return string.Empty;
                });

                var imagesProcessed = 0;

                // Now ensure all anchors have the custom class
                // and the media file system path is re-updated as per above
                contentToSave = ArticulateMetaWeblogRegexes.MediaHrefRegex().Replace(contentToSave, match =>
                {
                    if (match.Groups.Count == 2)
                    {
                        var relativePath = match.Groups[1].Value;
                        var mediaFileSystemPath = _mediaFileManager.FileSystem.GetUrl(relativePath);

                        var href = " href=\"" +
                               mediaFileSystemPath +
                               "\" class=\"a-image-" + imagesProcessed + "\" ";

                        imagesProcessed++;

                        return href;
                    }

                    return string.Empty;
                });

                content.SetInvariantOrDefaultCultureValue("richText", contentToSave, contentType, _languageService);
                if (extractFirstImageAsProperty
                    && content.HasProperty("postImage")
                        && !firstImageRelativePath.IsNullOrWhiteSpace())
                {
                    if (!string.IsNullOrWhiteSpace(firstImageRelativePath) && _mediaFileManager.FileSystem.FileExists(firstImageRelativePath))
                    {
                        try
                        {
                            using (Stream fileStream = _mediaFileManager.FileSystem.OpenFile(firstImageRelativePath))
                            {
                                var fileName = Path.GetFileName(firstImageRelativePath);

                                IMedia mediaItem = _mediaService.CreateMedia(fileName, _articulateRootMediaFolder.Value, Constants.Conventions.MediaTypes.Image);
                                mediaItem.SetValue(
                                    _mediaFileManager,
                                    _mediaUrlGenerators,
                                    _shortStringHelper,
                                    _contentTypeBaseServiceProvider,
                                    Constants.Conventions.Media.File,
                                    fileName,
                                    fileStream);

                                _mediaService.Save(mediaItem);

                                var udi = Udi.Create(Constants.UdiEntityType.Media, mediaItem.Key);

                                content.SetInvariantOrDefaultCultureValue(
                                    "postImage",
                                    udi.ToString(),
                                    contentType,
                                    _languageService);
                            }
                        }
                        catch (Exception ex)
                        {
                            // Catch any exception and log it, post will still be saved
                            _logger.LogError(ex, "Could not create media item for featured image {FileName}", firstImageRelativePath);
                        }
                    }
                }
            }

            if (!post.link.IsNullOrWhiteSpace())
            {
                content.SetInvariantOrDefaultCultureValue(Constants.Conventions.Content.UrlName, post.link, contentType, _languageService);
            }

            if (!post.mt_excerpt.IsNullOrWhiteSpace())
            {
                content.SetInvariantOrDefaultCultureValue("excerpt", post.mt_excerpt, contentType, _languageService);
            }

            if (post.mt_allow_comments == 1)
            {
                content.SetInvariantOrDefaultCultureValue("enableComments", 1, contentType, _languageService);
            }
            else if (post.mt_allow_comments == 2)
            {
                content.SetInvariantOrDefaultCultureValue("enableComments", 0, contentType, _languageService);
            }

            content.AssignInvariantOrDefaultCultureTags("categories", post.categories, contentType, _languageService, _dataTypeService, _propertyEditors, _jsonSerializer);
            var tags = post.mt_keywords
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Distinct()
                .ToArray();

            content.AssignInvariantOrDefaultCultureTags("tags", tags, contentType, _languageService, _dataTypeService, _propertyEditors, _jsonSerializer);

            if (publish)
            {
                if (post.dateCreated != DateTime.MinValue)
                {
                    content.SetInvariantOrDefaultCultureValue("publishedDate", post.dateCreated, contentType, _languageService);
                }

                _contentService.Save(content, userId: user.Id);
                _contentService.Publish(content, ["*"], user.Id);
            }
            else
            {
                _contentService.Save(content, user.Id);
            }
        }

        /// <summary>
        /// There are so many variants of Metaweblog API so I've just included as many properties, custom ones, etc... that i can find
        /// </summary>
        /// <param name="post"></param>
        /// <returns></returns>
        /// <remarks>
        /// http://msdn.microsoft.com/en-us/library/bb463260.aspx
        /// http://xmlrpc.scripting.com/metaWeblogApi.html
        /// http://cyber.law.harvard.edu/rss/rss.html#hrelementsOfLtitemgt
        /// http://codex.wordpress.org/XML-RPC_MetaWeblog_API
        /// https://blogengine.codeplex.com/SourceControl/latest#BlogEngine/BlogEngine.Core/API/MetaWeblog/MetaWeblogHandler.cs
        /// </remarks>
        private static Post FromPost(PostModel post) => new()
        {
            categories = post.Categories.ToArray(),
            description = post.Body.ToString(),
            dateCreated = post.PublishedDate != default ? post.PublishedDate : post.UpdateDate,
            postid = post.Id.ToString(CultureInfo.InvariantCulture),
            wp_slug = post.Url(),
            mt_excerpt = post.Excerpt,
            mt_keywords = string.Join(',', post.Tags.ToArray()),
            title = post.Name
        };

        private Post FromContent(IContent post) => new Post
        {
            title = post.Name,
            postid = post.Id.ToString(CultureInfo.InvariantCulture),
            dateCreated = post.UpdateDate,
            mt_excerpt = post.GetValue<string>("excerpt"),
            link = string.Empty,

            mt_keywords = string.IsNullOrWhiteSpace(post.GetValue<string>("tags")) == false
            ? string.Join(',', post.GetValue<string>("tags")?.Split([','], StringSplitOptions.RemoveEmptyEntries) ?? [])
            : string.Empty,

            categories = string.IsNullOrEmpty(post.GetValue<string>("categories")) == false
            ? post.GetValue<string>("categories")?.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
            : Array.Empty<string>(),

            description = post.ContentType.Alias == ArticulateConstants.ContentType.ArticulateRichText
            ? post.GetValue<string>("richText")
            : MarkdownHelper.ToHtml(post.GetValue<string>("markdown")),

            permalink = post.GetValue<string>(Constants.Conventions.Content.UrlName).IsNullOrWhiteSpace()
            ? post.Name?.ToUrlSegment(_shortStringHelper)
            : post.GetValue<string>(Constants.Conventions.Content.UrlName)?.ToUrlSegment(_shortStringHelper)
        };

        private IPublishedContent BlogRoot()
        {
            IPublishedContent node = _umbracoContextAccessor.GetRequiredUmbracoContext().Content.GetById(_articulateBlogRootNodeId) ?? throw new InvalidOperationException("No node found by route");

            return node;
        }

        private async Task<IUser> ValidateUser(string username, string password)
        {
            if (await _backOfficeUserManager.ValidateCredentialsAsync(username, password) == false)
            {
                // Throw some error if not valid credentials - so we exit out early of stuff
                throw new AuthenticationException($"Failed to validate user credentials for {username}");
            }

            IUser? user =_userService.GetByUsername(username);
            if (user is null)
            {
                throw new InvalidOperationException($"Failed to find user for {username}");
            }

            return user;
        }
    }
}
