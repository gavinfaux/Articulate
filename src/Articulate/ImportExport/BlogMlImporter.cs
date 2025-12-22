#nullable enable
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using Argotic.Syndication.Specialized;
using Articulate.Services;
using Articulate.Validators;
using Microsoft.AspNetCore.Html;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Infrastructure.Scoping;
using Task = System.Threading.Tasks.Task;

namespace Articulate.ImportExport
{
    public class BlogMlImporter
    {
        private const long MaxXmlCharacters = 10_000_000;

        private readonly DisqusXmlExporter _disqusXmlExporter;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly IContentService _contentService;
        private readonly IMediaService _mediaService;
        private readonly IContentTypeService _contentTypeService;
        private readonly IUserService _userService;
        private readonly ILogger<BlogMlImporter> _logger;
        private readonly IDataTypeService _dataTypeService;
        private readonly ISqlContext _sqlContext;
        private readonly IScopeProvider _scopeProvider;
        private readonly ILanguageService _languageService;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly MediaFileManager _mediaFileManager;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly PropertyEditorCollection _dataEditors;
        private readonly IJsonSerializer _jsonSerializer;
        private readonly ArticulateTempFileSystem _articulateTempFileSystem;
        private readonly Lazy<IMedia> _articulateRootMediaFolder;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IArticulateImageService _imageService;

        public BlogMlImporter(
            DisqusXmlExporter disqusXmlExporter,
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            IContentService contentService,
            IMediaService mediaService,
            IContentTypeService contentTypeService,
            IUserService userService,
            ILogger<BlogMlImporter> logger,
            IHttpClientFactory httpClientFactory,
            IDataTypeService dataTypeService,
            ISqlContext sqlContext,
            IScopeProvider scopeProvider,
            ILanguageService languageService,
            IShortStringHelper shortStringHelper,
            MediaFileManager mediaFileManager,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            PropertyEditorCollection dataEditors,
            IJsonSerializer jsonSerializer,
            ArticulateTempFileSystem articulateTempFileSystem,
            IArticulateImageService imageService)
        {
            _disqusXmlExporter = disqusXmlExporter;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _contentService = contentService;
            _mediaService = mediaService;
            _contentTypeService = contentTypeService;
            _userService = userService;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _dataTypeService = dataTypeService;
            _sqlContext = sqlContext;
            _scopeProvider = scopeProvider;
            _languageService = languageService;
            _shortStringHelper = shortStringHelper;
            _mediaFileManager = mediaFileManager;
            _mediaUrlGenerators = mediaUrlGenerators;
            _dataEditors = dataEditors;
            _jsonSerializer = jsonSerializer;
            _articulateTempFileSystem = articulateTempFileSystem;
            _imageService = imageService;
            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
            {
                IMedia? root = _mediaService.GetRootMedia().FirstOrDefault(x => x.Name == ArticulateConstants.Convention.ArticulateMediaFolder && x.ContentType.Alias.InvariantEquals(Constants.Conventions.MediaTypes.Folder));
                return root ?? _mediaService.CreateMediaWithIdentity(ArticulateConstants.Convention.ArticulateMediaFolder, Constants.System.Root, Constants.Conventions.MediaTypes.Folder);
            });
        }

        internal int GetPostCount(string fileName) => GetDocument(fileName).Posts.Count();

        /// <summary>
        /// Imports the blogml file to articulate
        /// </summary>
        /// <returns>An <see cref="ImportResponseDto"/> containing import statistics and the download URL for the Disqus export, if applicable.</returns>
        internal async Task<ImportResponseDto> ImportAsync(
            int userId,
            string fileName,
            Guid blogRootNode,
            bool overwrite,
            string? regexMatch,
            string? regexReplace,
            bool publishAll,
            bool exportDisqusXml = false,
            bool importFirstImage = false)
        {
            // not inside try block because we don't want to proceed further, and caller should handle
            if (string.IsNullOrWhiteSpace(fileName))
            {
                throw new InvalidOperationException("Filename is required");
            }

            if (!_articulateTempFileSystem.FileExists(fileName))
            {
                throw new FileNotFoundException("File not found: " + fileName);
            }

            IContent root = _contentService.GetById(blogRootNode)
                            ?? throw new InvalidOperationException("No node found with id " + blogRootNode);

            if (!root.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate))
            {
                throw new InvalidOperationException("The node with id " + blogRootNode + " is not an Articulate root node");
            }

            // wrap entire operation in scope
            using IScope scope = _scopeProvider.CreateScope();
            var returnModel = new ImportResponseDto();

            try
            {
                BlogMLDocument document = GetDocument(fileName);
                XDocument xdoc = LoadBlogMlXDocument(fileName);

                Dictionary<string, string> authorIdsToName = ImportAuthors(userId, root, document.Authors);
                returnModel.AuthorCount = authorIdsToName.Count;

                IEnumerable<IContent> imported = await ImportPostsAsync(
                    userId,
                    xdoc,
                    root,
                    document.Posts,
                    [.. document.Authors],
                    [.. document.Categories],
                    authorIdsToName,
                    overwrite,
                    regexMatch,
                    regexReplace,
                    publishAll,
                    importFirstImage).ConfigureAwait(false);
                IContent[] enumerable = imported as IContent[] ?? [.. imported];
                returnModel.PostCount = enumerable.Length;

                if (exportDisqusXml)
                {
                    XDocument xDoc = _disqusXmlExporter.Export(enumerable, document);
                    const string nsWp = "http://wordpress.org/export/1.0/";
                    returnModel.CommentCount = xDoc.Descendants(XName.Get("comment", nsWp)).Count();
                    using var memStream = new MemoryStream();
                    xDoc.Save(memStream);
                    _articulateTempFileSystem.AddFile("DisqusXmlExport.xml", memStream, true);
                }

                // commit
                _ = scope.Complete();
                returnModel.Completed = true;
                return returnModel;
            }
            catch (Exception)
            {
                returnModel.Completed = false;
                throw;
            }
        }

        private BlogMLDocument GetDocument(string fileName)
        {
            if (!_articulateTempFileSystem.FileExists(fileName))
            {
                throw new FileNotFoundException("File not found: " + fileName);
            }

            using Stream stream = _articulateTempFileSystem.OpenFile(fileName);
            try
            {
                using XmlReader reader = CreateSecureXmlReader(stream);
                var document = new BlogMLDocument();
                document.Load(reader);
                return document;
            }
            catch (XmlException ex)
            {
                throw new InvalidDataException("The BlogML file contains invalid XML.", ex);
            }
        }

        private XDocument LoadBlogMlXDocument(string fileName)
        {
            using Stream stream = _articulateTempFileSystem.OpenFile(fileName);
            try
            {
                using XmlReader reader = CreateSecureXmlReader(stream);
                return XDocument.Load(reader, LoadOptions.None);
            }
            catch (XmlException ex)
            {
                throw new InvalidDataException("The BlogML file contains invalid XML.", ex);
            }
        }

        private static XmlReader CreateSecureXmlReader(Stream stream)
        {
            var settings = new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null,
                MaxCharactersInDocument = MaxXmlCharacters,
                MaxCharactersFromEntities = 1024,
            };

            return XmlReader.Create(stream, settings);
        }

        private Dictionary<string, string> ImportAuthors(int userId, IContent rootNode, IEnumerable<BlogMLAuthor>? authors)
        {
            var result = new Dictionary<string, string>();

            if (authors is null)
            {
                return result;
            }

            IContentType authorType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthor)
                                      ?? throw new InvalidOperationException("Articulate is not installed properly, the 'ArticulateAuthor' doc type could not be found");

            IContentType authorsType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors)
                                       ?? throw new InvalidOperationException("Articulate is not installed properly, the 'ArticulateAuthors' doc type could not be found");

            IContent authorsNode = GetOrCreateAuthorsContainer(userId, rootNode, authorsType);
            IContent[] existingAuthorNodes = GetExistingAuthorNodes(authorsNode.Id, authorType.Id);

            foreach (BlogMLAuthor author in authors)
            {
                var authorName = ProcessSingleAuthor(userId, author, authorsNode, authorType, existingAuthorNodes);
                result.Add(author.Id, authorName);
            }

            return result;
        }

        private IContent GetOrCreateAuthorsContainer(int userId, IContent rootNode, IContentType authorsType)
        {
            IEnumerable<IContent> allAuthorsNodes = _contentService.GetPagedOfType(
                authorsType.Id,
                0,
                int.MaxValue,
                out _,
                _sqlContext.Query<IContent>().Where(x => x.ParentId == rootNode.Id && x.Trashed == false));

            IContent? authorsNode = allAuthorsNodes.FirstOrDefault();
            if (authorsNode is not null)
            {
                return authorsNode;
            }

            authorsNode = _contentService.CreateWithInvariantOrDefaultCultureName(
                ArticulateConstants.Convention.AuthorsDocument,
                rootNode,
                authorsType,
                _languageService);

            OperationResult authorsSaveResult = _contentService.Save(authorsNode, userId: userId);
            authorsSaveResult.EnsureSuccess(_logger, $"save authors container {authorsNode.Id}");

            PublishResult authorsPublishResult = _contentService.Publish(authorsNode, ["*"], userId: userId);
            authorsPublishResult.EnsureSuccess(_logger, $"publish authors container {authorsNode.Id}");

            return authorsNode;
        }

        private IContent[] GetExistingAuthorNodes(int authorsNodeId, int authorTypeId)
        {
            IEnumerable<IContent> allAuthorNodes = _contentService.GetPagedOfType(
                authorTypeId,
                0,
                int.MaxValue,
                out _,
                _sqlContext.Query<IContent>().Where(x => x.ParentId == authorsNodeId && x.Trashed == false));

            return allAuthorNodes as IContent[] ?? [.. allAuthorNodes];
        }

        private string ProcessSingleAuthor(int userId, BlogMLAuthor author, IContent authorsNode, IContentType authorType, IContent[] existingAuthorNodes)
        {
            IUser? found = _userService.GetByEmail(author.EmailAddress);
            var authorName = found?.Name ?? author.Title.Content;

            IContent? authorNode = existingAuthorNodes.FirstOrDefault(x => x.Name.InvariantEquals(authorName)) ??
                                   CreateAndPublishAuthorNode(userId, authorName, authorsNode, authorType);

            return authorNode.Name!;
        }

        private IContent CreateAndPublishAuthorNode(int userId, string authorName, IContent authorsNode, IContentType authorType)
        {
            IContent authorNode = _contentService.CreateWithInvariantOrDefaultCultureName(
                authorName,
                authorsNode,
                authorType,
                _languageService);

            OperationResult authorSaveResult = _contentService.Save(authorNode, userId: userId);
            authorSaveResult.EnsureSuccess(_logger, $"save author {authorNode.Name}");

            PublishResult authorPublishResult = _contentService.Publish(authorNode, ["*"], userId: userId);
            authorPublishResult.EnsureSuccess(_logger, $"publish author {authorNode.Name}");

            return authorNode;
        }

        private async Task<IEnumerable<IContent>> ImportPostsAsync(int userId, XDocument xdoc, IContent rootNode, IEnumerable<BlogMLPost> posts, BlogMLAuthor[] authors, BlogMLCategory[] categories, Dictionary<string, string> authorIdsToName, bool overwrite, string? regexMatch, string? regexReplace, bool publishAll, bool importFirstImage = false)
        {
            var result = new List<IContent>();

            IContentType postType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateRichText)
                ?? throw new InvalidOperationException("Articulate is not installed properly, the 'ArticulateRichText' doc type could not be found");

            IContent archiveNode = GetOrCreateArchiveNode(userId, rootNode);
            IContent[] existingPosts = GetExistingPosts(archiveNode);

            foreach (BlogMLPost post in posts)
            {
                IContent? postNode = FindExistingPost(existingPosts, post);

                // Skip if exists and we don't want to overwrite
                if (!overwrite && postNode is not null)
                {
                    continue;
                }

                // Create if doesn't exist
                if (postNode is null)
                {
                    var title = WebUtility.HtmlDecode(post.Title.Content);
                    postNode = _contentService.CreateWithInvariantOrDefaultCultureName(title, archiveNode, postType, _languageService);
                }

                PopulatePostContent(postNode, postType, post, regexMatch, regexReplace);
                SetPostMetadata(postNode, postType, post, xdoc, authors, categories, authorIdsToName);

                if (importFirstImage)
                {
                    await ImportFirstImageAsync(postNode, postType, post).ConfigureAwait(false);
                }

                SaveAndPublishPost(postNode, userId, publishAll);
                result.Add(postNode);
            }

            return await Task.FromResult(result).ConfigureAwait(false);
        }
        // IOptions<GlobalSettings> globalSettings MaxRequestLength
        private const long DefaultMaxSizeBytes = 10 * 1024 * 1024; // 10MB

        private async Task ImportFirstImageAsync(IContentBase postNode, IContentType postType, BlogMLPost post)
        {
            var imageMimeTypes = new List<string> { "image/jpeg", "image/gif", "image/png" };

            BlogMLAttachment? attachment = post.Attachments.FirstOrDefault(p => imageMimeTypes.Contains(p.MimeType));
            if (attachment is null)
            {
                return;
            }

            ImageValidationResult validationResult;

            // Decode/download and validate the image
            if (!attachment.Content.IsNullOrWhiteSpace())
            {
                // Base64 content
                var fileName = Path.GetFileName(attachment.Url.OriginalString);
                validationResult = await _imageService.DecodeAndValidateBase64ImageAsync(attachment.Content, fileName, DefaultMaxSizeBytes).ConfigureAwait(false);
            }
            else if (attachment.ExternalUri is not null && attachment.ExternalUri.IsAbsoluteUri)
            {
                // External URL
                validationResult = await _imageService.DownloadAndValidateImageAsync(attachment.ExternalUri, DefaultMaxSizeBytes).ConfigureAwait(false);
            }
            else
            {
                _logger.LogWarning("BlogML attachment for post {PostId} has neither base64 content nor external URL", post.Id);
                return;
            }

            if (!validationResult.IsValid)
            {
                _logger.LogWarning("BlogML attachment validation failed for post {PostId}: {ErrorMessage}", post.Id, validationResult.ErrorMessage);
                return;
            }

            try
            {
                // Sanitize media name (use post name or fallback)
                var mediaName = AltTextSanitizer.Sanitize(postNode.Name, $"Post-{post.Id}-image", maxLength: 100);

                // Save to media library
                MediaSaveResult saveResult = await _imageService.SaveToMediaLibraryAsync(
                    validationResult.ValidatedStream!,
                    mediaName,
                    validationResult.CorrectExtension!,
                    _articulateRootMediaFolder.Value).ConfigureAwait(false);

                if (!saveResult.Success)
                {
                    _logger.LogWarning("Failed to save BlogML image for post {PostId}: {ErrorMessage}", post.Id, saveResult.ErrorMessage);
                    return;
                }

                // Set the postImage property
                postNode.SetInvariantOrDefaultCultureValue(
                    "postImage",
                    saveResult.MediaUdi,
                    postType,
                    _languageService);
            }
            catch (PathTooLongException ex)
            {
                _logger.LogWarning(ex, "Could not save image for post {PostId} due to path length", post.Id);
            }
            finally
            {
                if (validationResult.ValidatedStream is not null)
                {
                    await validationResult.ValidatedStream.DisposeAsync().ConfigureAwait(false);
                }
            }
        }

        /* private async Task ImportComments(int userId, IContent postNode, BlogMLPost post,
        //    string publicKey, string privateKey, string accessToken)
        // {
        //    var importer = new DisqusImporter(publicKey);
        //    foreach (var comment in post.Comments)
        //    {
        //        var result = await importer.Import(
        //            postNode.Id.ToString(CultureInfo.InvariantCulture),
        //            comment.Content.Content,
        //            comment.UserName,
        //            comment.UserEmailAddress,
        //            comment.UserUrl is not null ? comment.UserUrl.ToString() : string.Empty,
        //            comment.CreatedOn);
        //        if (!result)
        //        {
        //            HasErrors = true;
        //        }
        //        else
        //        {
        //            postNode.SetInvariantOrDefaultLanguageValue("disqusCommentsImported", 1);
        //            //just save it, we don't need to publish it (if publish = true then its already published), we just need
        //            // this for reference.
        //            _applicationContext.Services.ContentService.Save(postNode, userId);
        //        }
        //    }
        // } */

        private void ImportCategories(IContent postNode, BlogMLPost post, IEnumerable<BlogMLCategory> allCategories, IContentType postType)
        {
            var postCats = allCategories.Where(x => post.Categories.Contains(x.Id))
                .Select(x => x.Title.Content)
                .ToArray();

            postNode.AssignInvariantOrDefaultCultureTags("categories", postCats, postType, _languageService, _dataTypeService, _dataEditors, _jsonSerializer);
        }

        private void ImportTags(XDocument xdoc, IContent postNode, BlogMLPost post, IContentType postType)
        {
            if (xdoc.Root is null)
            {
                return;
            }

            // since this blobml serializer doesn't support tags (can't find one that does) we need to manually take care of that
            XElement? xmlPost = xdoc.Descendants(XName.Get("post", xdoc.Root.Name.NamespaceName))
                .SingleOrDefault(x => x.Attribute("id")?.Value.ToString() == post.Id);

            xmlPost ??= xdoc.Descendants(XName.Get("post", xdoc.Root.Name.NamespaceName))
                .SingleOrDefault(x => x.Descendants(XName.Get("post-name", xdoc.Root.Name.NamespaceName))
                    .SingleOrDefault(s => s.Value == post.Name.Content) is not null);

            if (xmlPost is null)
            {
                return;
            }

            var tags = xmlPost.Descendants(XName.Get("tag", xdoc.Root.Name.NamespaceName)).Select(x => x.Attribute("ref")?.Value.ToString()).ToArray();

            postNode.AssignInvariantOrDefaultCultureTags("tags", tags, postType, _languageService, _dataTypeService, _dataEditors, _jsonSerializer);
        }

        private IContent GetOrCreateArchiveNode(int userId, IContent rootNode)
        {
            IContentType archiveDocType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive)
                ?? throw new InvalidOperationException("Articulate is not installed properly, the 'ArticulateArchive' doc type could not be found");

            IEnumerable<IContent> archive = _contentService.GetPagedOfType(
                archiveDocType.Id,
                0,
                int.MaxValue,
                out _,
                _sqlContext.Query<IContent>().Where(x => x.ParentId == rootNode.Id && x.Trashed == false));

            IContent? archiveNode = archive.FirstOrDefault();

            if (archiveNode is null)
            {
                archiveNode = _contentService.CreateWithInvariantOrDefaultCultureName(
                    ArticulateConstants.Convention.ArticlesDocument,
                    rootNode,
                    archiveDocType,
                    _languageService);

                OperationResult archiveSaveResult = _contentService.Save(archiveNode, userId);
                archiveSaveResult.EnsureSuccess(_logger, $"save archive container {archiveNode.Id}");
            }

            return archiveNode;
        }

        private IContent[] GetExistingPosts(IContent archiveNode)
        {
            IEnumerable<IContent> allPostNodes = _contentService.GetPagedChildren(
                archiveNode.Id,
                0,
                int.MaxValue,
                out _,
                _sqlContext.Query<IContent>().Where(x => x.ParentId == archiveNode.Id && x.Trashed == false));

            return allPostNodes as IContent[] ?? [.. allPostNodes];
        }

        private static IContent? FindExistingPost(IContent[] existingPosts, BlogMLPost post)
        {
            if (!string.IsNullOrWhiteSpace(post.Id))
            {
                return existingPosts.FirstOrDefault(x => x.GetValue<string>("importId") == post.Id);
            }

            return existingPosts
                .Select(x => new { Node = x, UrlName = x.GetValue<string>(Constants.Conventions.Content.UrlName) })
                .Where(x => x.UrlName is not null && post.Name != null && x.UrlName.InvariantStartsWith(post.Name.Content))
                .Select(x => x.Node)
                .FirstOrDefault();
        }

        private void PopulatePostContent(IContentBase postNode, IContentType postType, BlogMLPost post, string? regexMatch, string? regexReplace)
        {
            postNode.SetInvariantOrDefaultCultureValue("publishedDate", post.CreatedOn, postType, _languageService);

            if (post.Excerpt is not null && !post.Excerpt.Content.IsNullOrWhiteSpace())
            {
                var excerpt = post.Excerpt.Content;
                if (post.Excerpt.ContentType == BlogMLContentType.Base64)
                {
                    excerpt = Encoding.UTF8.GetString(Convert.FromBase64String(post.Excerpt.Content));
                }
                postNode.SetInvariantOrDefaultCultureValue("excerpt", excerpt, postType, _languageService);
            }

            postNode.SetInvariantOrDefaultCultureValue("importId", post.Id, postType, _languageService);

            var content = post.Content.Content;
            if (post.Content.ContentType == BlogMLContentType.Base64)
            {
                content = Encoding.UTF8.GetString(Convert.FromBase64String(post.Content.Content));
            }

            if (!regexMatch.IsNullOrWhiteSpace() && !regexReplace.IsNullOrWhiteSpace())
            {
                content = Regex.Replace(content, regexMatch, regexReplace, RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
            }

            postNode.SetInvariantOrDefaultCultureValue("richText", new HtmlString(content), postType, _languageService);
            postNode.SetInvariantOrDefaultCultureValue("enableComments", true, postType, _languageService);

            if (post.Url is not null && !string.IsNullOrWhiteSpace(post.Url.OriginalString))
            {
                string slug = ExtractSlugFromPost(post);
                postNode.SetInvariantOrDefaultCultureValue(Constants.Conventions.Content.UrlName, slug, postType, _languageService);
            }
        }

        private static string ExtractSlugFromPost(BlogMLPost post)
        {
            if (post.Name is not null)
            {
                return post.Name.Content;
            }

            var slugArray = post.Url!.OriginalString.Split(['/'], StringSplitOptions.RemoveEmptyEntries);
            var fileNameAndQuery = slugArray[^1];
            var fileNameAndQueryArray = fileNameAndQuery.Split(['?'], StringSplitOptions.RemoveEmptyEntries);
            var fileName = fileNameAndQueryArray[0];
            int lastDotIndex = fileName.LastIndexOf('.');
            return lastDotIndex > 0 ? fileName[..lastDotIndex] : fileName;
        }

        private void SetPostMetadata(IContent postNode, IContentType postType, BlogMLPost post, XDocument xdoc, BlogMLAuthor[] authors, BlogMLCategory[] categories, Dictionary<string, string> authorIdsToName)
        {
            if (post.Authors.Count > 0)
            {
                BlogMLAuthor? author = authors.FirstOrDefault(x => x.Id.InvariantEquals(post.Authors[0]));
                if (author is not null)
                {
                    var name = authorIdsToName[author.Id];
                    postNode.SetInvariantOrDefaultCultureValue("author", name, postType, _languageService);
                }
            }

            ImportTags(xdoc, postNode, post, postType);
            ImportCategories(postNode, post, categories, postType);
        }

        private void SaveAndPublishPost(IContent postNode, int userId, bool publishAll)
        {
            if (publishAll)
            {
                OperationResult saveResult = _contentService.Save(postNode, userId: userId);
                saveResult.EnsureSuccess(_logger, $"save post {postNode.Id}");

                PublishResult publishResult = _contentService.Publish(postNode, ["*"], userId);
                publishResult.EnsureSuccess(_logger, $"publish post {postNode.Id}");
            }
            else
            {
                OperationResult saveResult = _contentService.Save(postNode, userId);
                saveResult.EnsureSuccess(_logger, $"save post {postNode.Id}");
            }
        }
    }
}
