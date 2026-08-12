#nullable enable
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using Argotic.Syndication.Specialized;
using Articulate.Options;
using Articulate.Services;
using Articulate.Syndication.BlogML;
using Microsoft.AspNetCore.Html;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Infrastructure.Scoping;
using Task = System.Threading.Tasks.Task;

namespace Articulate.ImportExport
{
    /// <summary>
    /// Importer for blog content from BlogML format.
    /// </summary>
    public class BlogMlImporter(
        DisqusXmlExporter disqusXmlExporter,
        IContentService contentService,
        IContentTypeService contentTypeService,
        IUserService userService,
        ILogger<BlogMlImporter> logger,
        IDataTypeService dataTypeService,
        ISqlContext sqlContext,
        IScopeProvider scopeProvider,
        ILanguageService languageService,
        PropertyEditorCollection dataEditors,
        IJsonSerializer jsonSerializer,
        ArticulateTempFileSystem articulateTempFileSystem,
        IArticulateImportMediaService service,
        ArticulateContentAuthorizationService authorizationService,
        IHtmlSanitizer htmlSanitizer,
        IOptions<ArticulateOptions> articulateOptions,
        IOptions<ArticulateCommentsOptions> articulateCommentsOptions
#if UMBRACO_18_OR_GREATER
        ,
        IIdKeyMap idKeyMap
#endif
    )
    {
        private readonly long _maxXmlCharacters = articulateOptions.Value.BlogMlImportMaxXmlCharacters;
        private readonly ArticulateCommentsOptions _commentsOptions = articulateCommentsOptions.Value;

        internal int GetPostCount(string fileName) => GetDocument(fileName).Posts.Count();

        internal BlogMlImportFileSummary GetImportFileSummary(string fileName)
        {
            BlogMLDocument document = GetDocument(fileName);

            string[] externalHosts = document.Posts
                .SelectMany(post => post.Attachments)
                .Where(attachment => attachment.ExternalUri is not null && attachment.ExternalUri.IsAbsoluteUri)
                .Select(attachment => attachment.ExternalUri!.Host)
                .Where(host => !string.IsNullOrWhiteSpace(host))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(host => host, StringComparer.OrdinalIgnoreCase)
                .ToArray();

            int externalImageCount = document.Posts
                .SelectMany(post => post.Attachments)
                .Count(attachment => attachment.ExternalUri is not null && attachment.ExternalUri.IsAbsoluteUri);

            return new BlogMlImportFileSummary(document.Posts.Count(), externalImageCount, externalHosts);
        }

        /// <summary>
        /// Imports the blog content from a BlogML file.
        /// </summary>
        /// <param name="user">The authenticated backoffice user performing the import.</param>
        /// <param name="fileName">The name of the BlogML file in the temporary file system.</param>
        /// <param name="blogRootNode">The ID of the Articulate root node to import into.</param>
        /// <param name="overwrite">If true, existing posts are overwritten.</param>
        /// <param name="regexMatch">The regex pattern to match in post content.</param>
        /// <param name="regexReplace">The replacement string for the regex match.</param>
        /// <param name="publishAll">If true, all imported posts are published.</param>
        /// <param name="exportDisqusXml">If true, an XML file for Disqus import is generated.</param>
        /// <param name="importFirstImage">If true, the first image in each post is extracted to a property.</param>
        /// <returns>An <see cref="ImportResponseDto"/> containing import statistics.</returns>
        internal async Task<ImportResponseDto> ImportAsync(
            IUser user,
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

            int userId = user.Id;
            IContent root = contentService.GetById(blogRootNode)
                            ?? throw new InvalidOperationException("No node found with id " + blogRootNode);

            if (!authorizationService.IsArticulateRoot(root))
            {
                throw new InvalidOperationException("The node with id " + blogRootNode +
                                                    " is not an Articulate root node");
            }

            // Reject unauthorized roots before parsing the uploaded document.
            await authorizationService.EnsureContentAccessAsync(user, root, ActionBrowse.ActionLetter);

            if (!articulateTempFileSystem.FileExists(fileName))
            {
                throw new FileNotFoundException("File not found: " + fileName);
            }

            // wrap entire operation in scope
            using IScope scope = scopeProvider.CreateScope();
            var returnModel = new ImportResponseDto();

            BlogMLDocument document = GetDocument(fileName);
            XDocument xDoc = LoadBlogMlXDocument(fileName);
            BlogMlImportPlan importPlan = await CreateImportPlanAsync(
                user,
                root,
                document,
                overwrite,
                publishAll,
                importFirstImage,
                xDoc);

            // Warn when BlogML has comments but Giscus is configured and Disqus export isn't requested.
            // Giscus has no import endpoint, so comments would be silently discarded otherwise.
            if (!exportDisqusXml && _commentsOptions.Giscus.IsFullyConfigured())
            {
                int postsWithComments = document.Posts.Count(p => p.Comments.Count > 0);
                int totalComments = document.Posts.Sum(p => p.Comments.Count);
                if (totalComments > 0)
                {
                    logger.LogWarning(
                        "BlogML import contains {CommentCount} comment(s) across {PostCount} post(s), but Giscus is configured and no Disqus XML export was requested. Giscus has no import endpoint; these comments will not be migrated. See https://github.com/Shazwazza/Articulate/wiki/Comments#caveats for migration options.",
                        totalComments,
                        postsWithComments);
                }
            }

            Dictionary<string, string> authorIdsToName =
                await ImportAuthorsAsync(userId, root, document.Authors, importPlan);
            returnModel.AuthorCount = authorIdsToName.Count;

            IEnumerable<IContent> imported = await ImportPostsAsync(
                user,
                userId,
                xDoc,
                root,
                document.Posts,
                [.. document.Authors],
                [.. document.Categories],
                authorIdsToName,
                overwrite,
                regexMatch,
                regexReplace,
                publishAll,
                importFirstImage,
                importPlan);
            IContent[] enumerable = imported as IContent[] ?? [.. imported];
            returnModel.PostCount = enumerable.Length;

            if (exportDisqusXml)
            {
                XDocument xDisqusDoc = disqusXmlExporter.Export(enumerable, document);
                const string nsWp = "http://wordpress.org/export/1.0/";
                returnModel.CommentCount = xDisqusDoc.Descendants(XName.Get("comment", nsWp)).Count();
                using var memStream = new MemoryStream();
                xDisqusDoc.Save(memStream);
                var disqusFileName = $"DisqusXmlExport-{userId}.xml";
                articulateTempFileSystem.AddFile(disqusFileName, memStream, true);
            }

            // commit
            _ = scope.Complete();
            returnModel.Completed = true;
            return returnModel;
        }

        private BlogMLDocument GetDocument(string fileName)
        {
            if (!articulateTempFileSystem.FileExists(fileName))
            {
                throw new FileNotFoundException("File not found: " + fileName);
            }

            using Stream stream = articulateTempFileSystem.OpenFile(fileName);
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
            using Stream stream = articulateTempFileSystem.OpenFile(fileName);
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

        private XmlReader CreateSecureXmlReader(Stream stream)
        {
            var settings = new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null,
                MaxCharactersInDocument = _maxXmlCharacters,
            };

            return XmlReader.Create(stream, settings);
        }

        internal async Task EnsureImportPermissionsAsync(
            IUser user,
            IContent root,
            BlogMLDocument document,
            bool overwrite,
            bool publishAll,
            bool importFirstImage,
            XDocument? xDoc = null)
        {
            _ = await CreateImportPlanAsync(user, root, document, overwrite, publishAll, importFirstImage, xDoc);
        }

        private async Task<BlogMlImportPlan> CreateImportPlanAsync(
            IUser user,
            IContent root,
            BlogMLDocument document,
            bool overwrite,
            bool publishAll,
            bool importFirstImage,
            XDocument? xDoc)
        {
            (IContent? authorsNode, IContent[] existingAuthors) =
                await CreateAuthorImportPlanAsync(user, root, document.Authors);
            (IContent[] archives, IReadOnlyList<BlogMlPostImportTarget> postTargets) =
                await CreatePostImportPlanAsync(user, root, document.Posts, overwrite, publishAll, xDoc);
            await EnsureMediaImportAccessAsync(user, postTargets, overwrite, importFirstImage);

            return new(authorsNode, existingAuthors, archives, postTargets);
        }

        private async Task<(IContent? AuthorsNode, IContent[] ExistingAuthors)> CreateAuthorImportPlanAsync(
            IUser user,
            IContent root,
            IEnumerable<BlogMLAuthor>? authors)
        {
            BlogMLAuthor[] authorItems = authors?.ToArray() ?? [];
            if (authorItems.Length == 0)
            {
                return (null, []);
            }

            IContentType authorsType =
                contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors)
                ?? throw new InvalidOperationException("Articulate authors type is unavailable");
            IContent? authorsNode = GetRootChildByType(root, authorsType.Id);
            IContent[] existingAuthors = authorsNode is null
                ? []
                : GetExistingAuthorNodes(
                    authorsNode.Id,
                    contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthor)?.Id
                    ?? throw new InvalidOperationException("Articulate author type is unavailable"));

            bool hasNewAuthor = authorItems.Any(author =>
            {
                string name = GetImportedAuthorName(author);
                return !existingAuthors.Any(x => x.Name.InvariantEquals(name));
            });
            if (hasNewAuthor)
            {
                await authorizationService.EnsureContentAccessAsync(
                    user,
                    authorsNode ?? root,
                    ActionNew.ActionLetter,
                    ActionPublish.ActionLetter);
            }

            return (authorsNode, existingAuthors);
        }

        private async Task<(IContent[] Archives, IReadOnlyList<BlogMlPostImportTarget> PostTargets)> CreatePostImportPlanAsync(
            IUser user,
            IContent root,
            IEnumerable<BlogMLPost> posts,
            bool overwrite,
            bool publishAll,
            XDocument? xDoc)
        {
            BlogMLPost[] postItems = posts.ToArray();
            if (postItems.Length == 0)
            {
                return ([], []);
            }

            IContentType archiveType =
                contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive)
                ?? throw new InvalidOperationException("Articulate archive type is unavailable");
            IContent[] archives = GetRootChildrenByType(root, archiveType.Id);
            IReadOnlyList<BlogMlPostImportTarget> postTargets =
                BuildPostTargets(root, archives, postItems, xDoc);
            await EnsurePostImportPermissionsAsync(user, postTargets, overwrite, publishAll);

            return (archives, postTargets);
        }

        private async Task EnsurePostImportPermissionsAsync(
            IUser user,
            IReadOnlyList<BlogMlPostImportTarget> postTargets,
            bool overwrite,
            bool publishAll)
        {
            foreach (IContent archiveTarget in postTargets
                         .Select(x => x.TargetArchive)
                         .Where(x => x is not null)
                         .Select(x => x!)
                         .DistinctBy(x => x.Key))
            {
                await authorizationService.EnsureContentAccessAsync(
                    user,
                    archiveTarget,
                    GetRequiredPostActions(isNew: true, publishAll: publishAll));
            }

            if (!overwrite)
            {
                return;
            }

            foreach (IContent existing in postTargets
                         .Select(x => x.ExistingPost)
                         .Where(x => x is not null)
                         .Select(x => x!))
            {
                await authorizationService.EnsureContentAccessAsync(
                    user,
                    existing,
                    GetRequiredPostActions(isNew: false, publishAll: publishAll));
            }
        }

        private async Task EnsureMediaImportAccessAsync(
            IUser user,
            IReadOnlyList<BlogMlPostImportTarget> postTargets,
            bool overwrite,
            bool importFirstImage)
        {
            if (!importFirstImage
                || !postTargets.Any(x => (x.ExistingPost is null || overwrite) && HasPotentialImageImport(x.Source)))
            {
                return;
            }

            // Keep this early guard so a denied media operation cannot leave an auto-created archive behind.
            // The write-seam guard below remains authoritative for the actual media mutation.
            await authorizationService.EnsureMediaWriteAccessAsync(user);
        }

        private IContent? GetRootChildByType(IContent root, int contentTypeId) =>
            GetRootChildrenByType(root, contentTypeId).FirstOrDefault();

        private IContent[] GetRootChildrenByType(IContent root, int contentTypeId) =>
            contentService.GetPagedOfType(
                contentTypeId,
                0,
                int.MaxValue,
                out _,
                sqlContext.Query<IContent>().Where(x => x.ParentId == root.Id && x.Trashed == false)).ToArray();

        private IReadOnlyList<BlogMlPostImportTarget> BuildPostTargets(
            IContent root,
            IContent[] archives,
            IEnumerable<BlogMLPost> posts,
            XDocument? xDoc)
        {
            IContent[] existingPosts = GetExistingPosts(archives);
            return posts
                .Select(post =>
                {
                    IContent? existing = FindExistingPost(existingPosts, post);
                    return new BlogMlPostImportTarget(
                        post,
                        existing,
                        existing is null ? ResolveArchiveForPost(root, archives, xDoc, post) : null);
                })
                .ToArray();
        }

        private string GetImportedAuthorName(BlogMLAuthor author) =>
            userService.GetByEmail(author.EmailAddress)?.Name ?? author.Title.Content;

        private static string[] GetRequiredPostActions(bool isNew, bool publishAll) =>
            isNew
                ? publishAll
                    ? [ActionNew.ActionLetter, ActionPublish.ActionLetter]
                    : [ActionNew.ActionLetter]
                : publishAll
                    ? [ActionUpdate.ActionLetter, ActionPublish.ActionLetter]
                    : [ActionUpdate.ActionLetter];

        private static IContent GetPostPermissionTarget(
            IContent root,
            IContent archive,
            BlogMlPostImportTarget target) =>
            target.ExistingPost ?? (target.TargetArchive?.Key == root.Key
                ? root
                : target.TargetArchive ?? archive);

        internal async Task<Dictionary<string, string>> ImportAuthorsAsync(
            int userId,
            IContent rootNode,
            IEnumerable<BlogMLAuthor>? authors,
            BlogMlImportPlan? importPlan = null)
        {
            var result = new Dictionary<string, string>();

            if (authors is null || !authors.Any())
            {
                return result;
            }

            if (importPlan is null)
            {
                throw new InvalidOperationException("An import permission plan is required before importing authors");
            }

            IContentType authorType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthor)
                                      ?? throw new InvalidOperationException(
                                          "Articulate is not installed properly, the 'ArticulateAuthor' doc type could not be found");

            IContentType authorsType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors)
                                       ?? throw new InvalidOperationException(
                                           "Articulate is not installed properly, the 'ArticulateAuthors' doc type could not be found");

            IContent authorsNode = importPlan.AuthorsNode
                                   ?? await GetOrCreateAuthorsContainerAsync(userId, rootNode, authorsType);
            IContent[] existingAuthorNodes = importPlan.ExistingAuthors;

            foreach (BlogMLAuthor author in authors)
            {
                var authorName = await ProcessSingleAuthorAsync(
                    userId,
                    author,
                    authorsNode,
                    authorType,
                    existingAuthorNodes);
                result.Add(author.Id, authorName);
            }

            return result;
        }

        private async Task<IContent> GetOrCreateAuthorsContainerAsync(
            int userId,
            IContent rootNode,
            IContentType authorsType)
        {
            IEnumerable<IContent> allAuthorsNodes = contentService.GetPagedOfType(
                authorsType.Id,
                0,
                int.MaxValue,
                out _,
                sqlContext.Query<IContent>().Where(x => x.ParentId == rootNode.Id && x.Trashed == false));

            IContent? authorsNode = allAuthorsNodes.FirstOrDefault();
            if (authorsNode is not null)
            {
                return authorsNode;
            }

            authorsNode = await contentService.CreateWithInvariantOrDefaultCultureNameAsync(
                ArticulateConstants.Convention.AuthorsDocument,
                rootNode,
                authorsType,
                languageService,
                logger);

            OperationResult authorsSaveResult = contentService.Save(authorsNode, userId: userId);
            authorsSaveResult.EnsureSuccess(logger, $"save authors container {authorsNode.Id}");

            PublishResult authorsPublishResult = contentService.Publish(authorsNode, ["*"], userId: userId);
            authorsPublishResult.EnsureSuccess(logger, $"publish authors container {authorsNode.Id}");

            return authorsNode;
        }

        private IContent[] GetExistingAuthorNodes(int authorsNodeId, int authorTypeId)
        {
            IEnumerable<IContent> allAuthorNodes = contentService.GetPagedOfType(
                authorTypeId,
                0,
                int.MaxValue,
                out _,
                sqlContext.Query<IContent>().Where(x => x.ParentId == authorsNodeId && x.Trashed == false));

            return allAuthorNodes as IContent[] ?? [.. allAuthorNodes];
        }

        private async Task<string> ProcessSingleAuthorAsync(
            int userId,
            BlogMLAuthor author,
            IContent authorsNode,
            IContentType authorType,
            IContent[] existingAuthorNodes)
        {
            IUser? found = userService.GetByEmail(author.EmailAddress);
            var authorName = found?.Name ?? author.Title.Content;

            IContent authorNode = existingAuthorNodes.FirstOrDefault(x => x.Name.InvariantEquals(authorName)) ??
                                  await CreateAndPublishAuthorNodeAsync(userId, authorName, authorsNode, authorType);

            return authorNode.Name!;
        }

        private async Task<IContent> CreateAndPublishAuthorNodeAsync(
            int userId,
            string authorName,
            IContent authorsNode,
            IContentType authorType)
        {
            IContent authorNode = await contentService.CreateWithInvariantOrDefaultCultureNameAsync(
                authorName,
                authorsNode,
                authorType,
                languageService,
                logger);

            OperationResult authorSaveResult = contentService.Save(authorNode, userId: userId);
            authorSaveResult.EnsureSuccess(logger, $"save author {authorNode.Name}");

            PublishResult authorPublishResult = contentService.Publish(authorNode, ["*"], userId: userId);
            authorPublishResult.EnsureSuccess(logger, $"publish author {authorNode.Name}");

            return authorNode;
        }

        internal async Task<IEnumerable<IContent>> ImportPostsAsync(
            IUser user,
            int userId,
            XDocument xDoc,
            IContent rootNode,
            IEnumerable<BlogMLPost> posts,
            BlogMLAuthor[] authors,
            BlogMLCategory[] categories,
            Dictionary<string, string> authorIdsToName,
            bool overwrite,
            string? regexMatch,
            string? regexReplace,
            bool publishAll,
            bool importFirstImage = false,
            BlogMlImportPlan? importPlan = null)
        {
            var result = new List<IContent>();
            BlogMLPost[] postItems = [.. posts];

            if (postItems.Length == 0)
            {
                return result;
            }

            IContentType postType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateRichText)
                                    ?? throw new InvalidOperationException(
                                        "Articulate is not installed properly, the 'ArticulateRichText' doc type could not be found");

            IContentType archiveType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive)
                                       ?? throw new InvalidOperationException("Articulate archive type is unavailable");
            IContent[] archiveNodes = importPlan?.Archives ?? GetRootChildrenByType(rootNode, archiveType.Id);
            if (archiveNodes.Length == 0)
            {
                await authorizationService.EnsureContentAccessAsync(user, rootNode, ActionNew.ActionLetter);
            }

            IContent archiveNode = archiveNodes.FirstOrDefault()
                                   ?? await GetOrCreateArchiveNodeAsync(userId, rootNode);
            if (!archiveNodes.Any(x => x.Key == archiveNode.Key))
            {
                archiveNodes = [archiveNode, .. archiveNodes];
            }

            IReadOnlyList<BlogMlPostImportTarget> postTargets = importPlan?.PostTargets
                ?? BuildPostTargets(rootNode, archiveNodes, postItems, xDoc);

            foreach (BlogMlPostImportTarget target in postTargets)
            {
                BlogMLPost post = target.Source;
                IContent? postNode = target.ExistingPost;

                // Skip if exists and we don't want to overwrite
                if (!overwrite && postNode is not null)
                {
                    continue;
                }

                bool isNew = target.ExistingPost is null;
                IContent targetArchive = target.TargetArchive?.Key == rootNode.Key
                    ? archiveNode
                    : target.TargetArchive ?? archiveNode;
                await authorizationService.EnsureContentAccessAsync(
                    user,
                    GetPostPermissionTarget(rootNode, archiveNode, target),
                    GetRequiredPostActions(isNew, publishAll));

                // Create if it doesn't exist
                if (postNode is null)
                {
                    var title = WebUtility.HtmlDecode(post.Title.Content);
                    postNode = await contentService
                        .CreateWithInvariantOrDefaultCultureNameAsync(
                            title,
                            targetArchive,
                            postType,
                            languageService,
                            logger);
                }

                await PopulatePostContentAsync(postNode, postType, post, regexMatch, regexReplace);
                await SetPostMetadataAsync(postNode, postType, post, xDoc, authors, categories, authorIdsToName);

                if (importFirstImage)
                {
                    await ImportFirstImageAsync(postNode, postType, post, user);
                }

                SaveAndPublishPost(postNode, userId, publishAll);
                result.Add(postNode);
            }

            return result;
        }

        private async Task ImportFirstImageAsync(
            IContentBase postNode,
            IContentType postType,
            BlogMLPost post,
            IUser user)
        {
            BlogMLAttachment? attachment = post.Attachments.FirstOrDefault(p =>
                p.MimeType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true);
            if (attachment is null)
            {
                return;
            }

            ValidatedBlogMlImage? image = await ValidateFirstImageAsync(postNode, post, attachment);
            if (image is null)
            {
                return;
            }

            if (!image.ValidationResult.IsValid)
            {
                logger.LogWarning(
                    "BlogML attachment validation failed for post '{PostName}' (ImportId: {ImportId}, source: {Source}, identifier: {Identifier}): {ErrorMessage}",
                    postNode.Name,
                    post.Id,
                    image.Source,
                    image.Identifier,
                    image.ValidationResult.ErrorMessage);
                return;
            }

            await SaveFirstImageAsync(postNode, postType, post, user, image);
        }

        private async Task<ValidatedBlogMlImage?> ValidateFirstImageAsync(
            IContentBase postNode,
            BlogMLPost post,
            BlogMLAttachment attachment)
        {
            ImportMediaValidationResult validationResult;
            string attachmentSource;
            string attachmentIdentifier;

            if (!attachment.Content.IsNullOrWhiteSpace())
            {
                var fileName = attachment.Url is not null
                    ? Path.GetFileName(attachment.Url.OriginalString)
                    : $"{post.Id}-image";
                attachmentSource = "base64";
                attachmentIdentifier = fileName;
                validationResult = await service
                    .DecodeAndValidateBase64ImageAsync(attachment.Content, fileName);
            }
            else if (attachment.ExternalUri is not null && attachment.ExternalUri.IsAbsoluteUri)
            {
                attachmentSource = "external URL";
                attachmentIdentifier = attachment.ExternalUri.ToString();
                validationResult = await service.DownloadAndValidateImageAsync(attachment.ExternalUri);
            }
            else
            {
                logger.LogWarning(
                    "BlogML attachment for post '{PostName}' (ImportId: {ImportId}) has neither base64 content nor external URL",
                    postNode.Name,
                    post.Id);
                return null;
            }

            return new ValidatedBlogMlImage(validationResult, attachmentSource, attachmentIdentifier);
        }

        private async Task SaveFirstImageAsync(
            IContentBase postNode,
            IContentType postType,
            BlogMLPost post,
            IUser user,
            ValidatedBlogMlImage image)
        {
            try
            {
                // Recheck immediately before the actual media mutation in case permissions changed after preflight.
                await authorizationService.EnsureMediaWriteAccessAsync(user);

                ImportMediaSaveResult saveResult = service.SaveToMediaLibrary(
                    image.ValidationResult.ValidatedStream!,
                    postNode.Name ?? $"Post-{post.Id}-image",
                    image.ValidationResult.CorrectExtension!,
                    service.GetOrCreateArticulateMediaFolder());

                if (!saveResult.Success)
                {
                    logger.LogWarning(
                        "Failed to save BlogML image for post '{PostName}' (ImportId: {ImportId}, source: {Source}, identifier: {Identifier}): {ErrorMessage}",
                        postNode.Name,
                        post.Id,
                        image.Source,
                        image.Identifier,
                        saveResult.ErrorMessage);
                    return;
                }

                await postNode.SetInvariantOrDefaultCultureValueAsync(
                    "postImage",
                    saveResult.MediaUdi,
                    postType,
                    languageService,
                    logger);
            }
            catch (PathTooLongException ex)
            {
                logger.LogWarning(
                    ex,
                    "Could not save image for post '{PostName}' (ImportId: {ImportId}) due to path length",
                    postNode.Name,
                    post.Id);
            }
            finally
            {
                if (image.ValidationResult.ValidatedStream is not null)
                {
                    await image.ValidationResult.ValidatedStream.DisposeAsync();
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

        private Task ImportCategoriesAsync(
            IContent postNode,
            BlogMLPost post,
            IEnumerable<BlogMLCategory> allCategories,
            IContentType postType)
        {
            var postCats = allCategories.Where(x => post.Categories.Contains(x.Id))
                .Select(x => x.Title.Content)
                .ToArray();
            if (postCats.Length == 0)
            {
                return Task.CompletedTask;
            }

            return postNode.AssignInvariantOrDefaultCultureTagsAsync(
                "categories",
                postCats,
                postType,
                languageService,
                dataTypeService,
                dataEditors,
                jsonSerializer,
#if UMBRACO_18_OR_GREATER
                idKeyMap,
#endif
                logger);
        }

        private async Task ImportTagsAsync(XDocument xDoc, IContent postNode, BlogMLPost post, IContentType postType)
        {
            if (xDoc.Root is null)
            {
                return;
            }

            // since this blobml serializer doesn't support tags (can't find one that does) we need to manually take care of that
            XElement? xmlPost = xDoc.Descendants(XName.Get("post", xDoc.Root.Name.NamespaceName))
                .SingleOrDefault(x => x.Attribute("id")?.Value.ToString() == post.Id);

            xmlPost ??= xDoc.Descendants(XName.Get("post", xDoc.Root.Name.NamespaceName))
                .SingleOrDefault(x => x.Descendants(XName.Get("post-name", xDoc.Root.Name.NamespaceName))
                    .SingleOrDefault(s => s.Value == post.Name.Content) is not null);

            if (xmlPost is null)
            {
                return;
            }

            var tags = xmlPost.Descendants(XName.Get("tag", xDoc.Root.Name.NamespaceName))
                .Select(x => x.Attribute("ref")?.Value)
                .Where(x => x is not null)
                .OfType<string>()
                .ToArray();
            if (tags.Length == 0)
            {
                return;
            }

            await postNode.AssignInvariantOrDefaultCultureTagsAsync(
                "tags",
                tags,
                postType,
                languageService,
                dataTypeService,
                dataEditors,
                jsonSerializer,
#if UMBRACO_18_OR_GREATER
                idKeyMap,
#endif
                logger);
        }

        private async Task<IContent> GetOrCreateArchiveNodeAsync(int userId, IContent rootNode)
        {
            IContentType archiveDocType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive)
                                          ?? throw new InvalidOperationException(
                                              "Articulate is not installed properly, the 'ArticulateArchive' doc type could not be found");

            IEnumerable<IContent> archive = contentService.GetPagedOfType(
                archiveDocType.Id,
                0,
                int.MaxValue,
                out _,
                sqlContext.Query<IContent>().Where(x => x.ParentId == rootNode.Id && x.Trashed == false));

            IContent? archiveNode = archive.FirstOrDefault();

            if (archiveNode is null)
            {
                archiveNode = await contentService.CreateWithInvariantOrDefaultCultureNameAsync(
                    ArticulateConstants.Convention.ArticlesDocument,
                    rootNode,
                    archiveDocType,
                    languageService,
                    logger);

                OperationResult archiveSaveResult = contentService.Save(archiveNode, userId);
                archiveSaveResult.EnsureSuccess(logger, $"save archive container {archiveNode.Id}");
            }

            return archiveNode;
        }

        private static bool HasPotentialImageImport(BlogMLPost post) =>
            post.Attachments.Any(attachment =>
                attachment.MimeType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true
                && (!attachment.Content.IsNullOrWhiteSpace()
                    || attachment.ExternalUri?.IsAbsoluteUri == true));

        private IContent[] GetExistingPosts(IEnumerable<IContent> archiveNodes)
        {
            return archiveNodes
                .SelectMany(archiveNode => contentService.EnumeratePagedChildren(
                    archiveNode.Id,
                    0,
                    int.MaxValue,
                    out _,
                    sqlContext.Query<IContent>().Where(x => x.ParentId == archiveNode.Id && x.Trashed == false)))
                .Where(authorizationService.IsBlogMlPost)
                .ToArray();
        }

        internal static IContent ResolveArchiveForPost(
            IContent root,
            IContent[] archives,
            XDocument? xDoc,
            BlogMLPost post)
        {
            string? archiveIdentity = GetArchiveIdentityFromDocument(xDoc, post);
            if (!string.IsNullOrWhiteSpace(archiveIdentity))
            {
                IContent? match = archives.FirstOrDefault(archive =>
                    string.Equals(
                        GetArchiveIdentity(archive),
                        archiveIdentity,
                        StringComparison.OrdinalIgnoreCase));
                if (match is not null)
                {
                    return match;
                }
            }

            string? archiveName = GetArchiveNameFromDocument(xDoc, post);
            if (!string.IsNullOrWhiteSpace(archiveName))
            {
                IContent? match = archives.FirstOrDefault(archive =>
                    string.Equals(archive.Name, archiveName, StringComparison.OrdinalIgnoreCase));
                if (match is not null)
                {
                    return match;
                }
            }

            // Third-party BlogML has no archive marker; preserve the historical first-archive fallback.
            // With no archive, root is the only pre-mutation parent capability available; the importer
            // creates the archive beneath it before creating the first post.
            return archives.FirstOrDefault() ?? root;
        }

        internal static string? GetArchiveIdentityFromDocument(XDocument? xDoc, BlogMLPost post)
        {
            if (xDoc?.Root is null || string.IsNullOrWhiteSpace(post.Id))
            {
                return null;
            }

            XNamespace blogNamespace = xDoc.Root.Name.Namespace;
            XElement? xmlPost = xDoc.Descendants(blogNamespace + "post")
                .FirstOrDefault(x => string.Equals(x.Attribute("id")?.Value, post.Id, StringComparison.Ordinal));
            return GetArchiveMarker(xmlPost)?.Attribute(ArchiveSyndicationExtension.KeyAttribute)?.Value;
        }

        private static string? GetArchiveNameFromDocument(XDocument? xDoc, BlogMLPost post)
        {
            if (xDoc?.Root is null || string.IsNullOrWhiteSpace(post.Id))
            {
                return null;
            }

            XNamespace blogNamespace = xDoc.Root.Name.Namespace;
            XElement? xmlPost = xDoc.Descendants(blogNamespace + "post")
                .FirstOrDefault(x => string.Equals(x.Attribute("id")?.Value, post.Id, StringComparison.Ordinal));
            return GetArchiveMarker(xmlPost)?.Attribute(ArchiveSyndicationExtension.NameAttribute)?.Value;
        }

        private static XElement? GetArchiveMarker(XElement? xmlPost) =>
            xmlPost?.Element(XName.Get(ArchiveSyndicationExtension.ElementName, ArchiveSyndicationExtension.Namespace));

        private static string GetArchiveIdentity(IContent archive) =>
            archive.Key != Guid.Empty
                ? $"key:{archive.Key:D}"
                : $"name:{archive.Name ?? string.Empty}";

        private static IContent? FindExistingPost(IContent[] existingPosts, BlogMLPost post)
        {
            if (!string.IsNullOrWhiteSpace(post.Id))
            {
                return existingPosts.FirstOrDefault(x => x.GetValue<string>("importId") == post.Id);
            }

            return existingPosts
                .Select(x => new { Node = x, UrlName = x.GetValue<string>(Constants.Conventions.Content.UrlName) })
                .Where(x => x.UrlName is not null && post.Name != null &&
                            x.UrlName.InvariantStartsWith(post.Name.Content))
                .Select(x => x.Node)
                .FirstOrDefault();
        }

        private async Task PopulatePostContentAsync(
            IContentBase postNode,
            IContentType postType,
            BlogMLPost post,
            string? regexMatch,
            string? regexReplace)
        {
            await postNode
                .SetInvariantOrDefaultCultureValueAsync(
                    "publishedDate",
                    post.CreatedOn,
                    postType,
                    languageService,
                    logger);

            if (post.Excerpt is not null && !post.Excerpt.Content.IsNullOrWhiteSpace())
            {
                var excerpt = DecodeContent(post.Excerpt.Content, post.Excerpt.ContentType);

                await postNode.SetInvariantOrDefaultCultureValueAsync(
                    "excerpt",
                    excerpt,
                    postType,
                    languageService,
                    logger);
            }

            await postNode.SetInvariantOrDefaultCultureValueAsync(
                "importId",
                post.Id,
                postType,
                languageService,
                logger);

            var content = DecodeContent(post.Content.Content, post.Content.ContentType);
            content = ApplyImportRegex(content, regexMatch, regexReplace);
            content = htmlSanitizer.Sanitize(content);

            await postNode
                .SetInvariantOrDefaultCultureValueAsync(
                    "richText",
                    new HtmlString(content),
                    postType,
                    languageService,
                    logger);
            await postNode
                .SetInvariantOrDefaultCultureValueAsync(
                    "enableComments",
                    true,
                    postType,
                    languageService,
                    logger);

            await SetPostSlugAsync(postNode, postType, post);
        }

        private static string DecodeContent(string content, BlogMLContentType contentType) =>
            contentType == BlogMLContentType.Base64
                ? Encoding.UTF8.GetString(Convert.FromBase64String(content))
                : content;

        private string ApplyImportRegex(string content, string? regexMatch, string? regexReplace)
        {
            if (regexMatch.IsNullOrWhiteSpace() || regexReplace.IsNullOrWhiteSpace())
            {
                return content;
            }

            try
            {
                return Regex.Replace(
                    content,
                    regexMatch,
                    regexReplace,
                    RegexOptions.CultureInvariant | RegexOptions.IgnoreCase,
                    TimeSpan.FromSeconds(1));
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "Invalid regex pattern provided during import: {RegexMatch}", regexMatch);
                throw new InvalidOperationException($"The provided regex pattern '{regexMatch}' is invalid.", ex);
            }
            catch (RegexMatchTimeoutException ex)
            {
                logger.LogWarning(ex, "Regex operation timed out during import for pattern: {RegexMatch}", regexMatch);
                throw new InvalidOperationException("The regex operation timed out. The pattern might be too complex.", ex);
            }
        }

        private async Task SetPostSlugAsync(IContentBase postNode, IContentType postType, BlogMLPost post)
        {
            if (post.Url is null || string.IsNullOrWhiteSpace(post.Url.OriginalString))
            {
                return;
            }

            string slug = ExtractSlugFromPost(post);
            await postNode.SetInvariantOrDefaultCultureValueAsync(
                Constants.Conventions.Content.UrlName,
                slug,
                postType,
                languageService,
                logger);
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

        private async Task SetPostMetadataAsync(
            IContent postNode,
            IContentType postType,
            BlogMLPost post,
            XDocument xDoc,
            BlogMLAuthor[] authors,
            BlogMLCategory[] categories,
            Dictionary<string, string> authorIdsToName)
        {
            if (post.Authors.Count > 0)
            {
                BlogMLAuthor? author = authors.FirstOrDefault(x => x.Id.InvariantEquals(post.Authors[0]));
                if (author is not null && authorIdsToName.TryGetValue(author.Id, out string? name))
                {
                    await postNode
                        .SetInvariantOrDefaultCultureValueAsync("author", name, postType, languageService, logger);
                }
            }

            await ImportTagsAsync(xDoc, postNode, post, postType);
            await ImportCategoriesAsync(postNode, post, categories, postType);
        }

        private void SaveAndPublishPost(IContent postNode, int userId, bool publishAll)
        {
            if (publishAll)
            {
                OperationResult saveResult = contentService.Save(postNode, userId: userId);
                saveResult.EnsureSuccess(logger, $"save post {postNode.Id}");

                PublishResult publishResult = contentService.Publish(postNode, ["*"], userId);
                publishResult.EnsureSuccess(logger, $"publish post {postNode.Id}");
            }
            else
            {
                OperationResult saveResult = contentService.Save(postNode, userId);
                saveResult.EnsureSuccess(logger, $"save post {postNode.Id}");
            }
        }

        private sealed record ValidatedBlogMlImage(
            ImportMediaValidationResult ValidationResult,
            string Source,
            string Identifier);
    }

    internal sealed record BlogMlImportPlan(
        IContent? AuthorsNode,
        IContent[] ExistingAuthors,
        IContent[] Archives,
        IReadOnlyList<BlogMlPostImportTarget> PostTargets);

    internal sealed record BlogMlPostImportTarget(
        BlogMLPost Source,
        IContent? ExistingPost,
        IContent? TargetArchive);

    internal sealed record BlogMlImportFileSummary(int PostCount, int ExternalImageCount, string[] ExternalHosts);
}
