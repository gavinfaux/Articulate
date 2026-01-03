#nullable enable
using System.Collections.ObjectModel;
using System.Text;
using System.Text.Json;
using Argotic.Common;
using Argotic.Syndication.Specialized;
using Articulate.Services;
using Articulate.Syndication.BlogML;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Persistence.Querying;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Persistence;

namespace Articulate.ImportExport
{
    public class BlogMlExporter(
        IContentService contentService,
        IMediaService mediaService,
        IContentTypeService contentTypeService,
        IDataTypeService dataTypeService,
        ITagService tagService,
        MediaFileManager mediaFileManager,
        ArticulateTempFileSystem articulateTempFileSystem,
        IPublishedUrlProvider urlProvider,
        ISqlContext sqlContext,
        ILogger<BlogMlExporter> logger,
        IMarkdownToHtmlConverter markdownToHtmlConverter)
    {
        public async Task ExportAsync(
            Guid blogRootNode,
            string exportFileName,
            bool exportImagesAsBase64 = false)
        {
            {
                IContent root = contentService.GetById(blogRootNode) ??
                                throw new InvalidOperationException("No node found with id " + blogRootNode);

                if (!root.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate))
                {
                    throw new InvalidOperationException(
                        $"The node with id {blogRootNode} is not an Articulate root node");
                }

                IContentType richTextContentType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateRichText) ??
                                      throw new InvalidOperationException(
                                          "Articulate is not installed properly, the 'ArticulateRichText' doc type could not be found");
                IDataType categoryDataType = await dataTypeService.GetAsync("Articulate Categories") ??
                                             throw new InvalidOperationException(
                                                 "No Data Type named 'Articulate Categories' found");
                TagConfiguration? categoryConfiguration = categoryDataType.ConfigurationAs<TagConfiguration>();
                var categoryGroup = categoryConfiguration?.Group;
                IDataType tagDataType = await dataTypeService.GetAsync("Articulate Tags") ??
                                        throw new InvalidOperationException(
                                            "No Data Type named 'Articulate Tags' found");
                TagConfiguration? tagConfiguration = tagDataType.ConfigurationAs<TagConfiguration>();
                var tagGroup = tagConfiguration?.Group;

                // TODO: See: http://argotic.codeplex.com/wikipage?title=Generating%20portable%20web%20log%20content&referringTitle=Home
                var blogMlDoc = new BlogMLDocument
                {
                    RootUrl = new Uri(urlProvider.GetUrl(root.Id), UriKind.RelativeOrAbsolute),
                    GeneratedOn = DateTime.Now,
                    Title = new BlogMLTextConstruct(root.GetValue<string>("blogTitle")),
                    Subtitle = new BlogMLTextConstruct(root.GetValue<string>("blogDescription"))
                };

                IContentType authorsContentType =
                    contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors)
                    ?? throw new InvalidOperationException(
                        "Articulate is not installed properly, the 'ArticulateAuthors' doc type could not be found");

                foreach (IContent authorsNode in EnumerateDescendants(
                             root.Id,
                             sqlContext.Query<IContent>().Where(x => x.ContentTypeId == authorsContentType.Id),
                             Ordering.By("CreateDate", Direction.Descending)))
                {
                    AddBlogAuthors(authorsNode, blogMlDoc);
                }

                AddBlogCategories(blogMlDoc, categoryGroup);

                IContentType archiveContentType =
                    contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive)
                    ?? throw new InvalidOperationException(
                        "Articulate is not installed properly, the 'ArticulateArchive' doc type could not be found");

                foreach (IContent archiveNode in EnumerateDescendants(
                             root.Id,
                             sqlContext.Query<IContent>().Where(x => x.ContentTypeId == archiveContentType.Id),
                             Ordering.By("CreateDate", Direction.Descending)))
                {
                    AddBlogPosts(archiveNode, blogMlDoc, categoryGroup, tagGroup, exportImagesAsBase64);
                }

                WriteFile(blogMlDoc, exportFileName);
            }
        }



        private void WriteFile(BlogMLDocument blogMlDoc, string fileName)
        {
            using var stream = new MemoryStream();
            blogMlDoc.Save(stream, new SyndicationResourceSaveSettings { CharacterEncoding = Encoding.UTF8 });
            stream.Position = 0;
            articulateTempFileSystem.AddFile(fileName, stream, true);
        }

        private IEnumerable<IContent> EnumerateDescendants(
            int rootId,
            IQuery<IContent>? filter,
            Ordering? ordering,
            int pageSize = 500)
        {
            var pageIndex = 0;

            while (true)
            {
                IContent[] page = contentService
                    .GetPagedDescendants(rootId, pageIndex++, pageSize, out _, filter, ordering)
                    .ToArray();

                if (page.Length == 0)
                {
                    yield break;
                }

                foreach (IContent item in page)
                {
                    yield return item;
                }

                if (page.Length < pageSize)
                {
                    yield break;
                }
            }
        }

        private void AddBlogCategories(BlogMLDocument blogMlDoc, string? tagGroup)
        {
            IEnumerable<ITag> categories = tagService.GetAllContentTags(tagGroup);
            foreach (ITag category in categories)
            {
                if (category.NodeCount == 0)
                {
                    continue;
                }

                var blogMlCategory = new BlogMLCategory
                {
                    Id = category.Id.ToString(),
                    CreatedOn = category.CreateDate,
                    LastModifiedOn = category.UpdateDate,
                    ApprovalStatus = BlogMLApprovalStatus.Approved,
                    ParentId = "0",
                    Title = new BlogMLTextConstruct(category.Text)
                };
                blogMlDoc.Categories.Add(blogMlCategory);
            }
        }

        private void AddBlogAuthors(IContent authorsNode, BlogMLDocument blogMlDoc)
        {
            foreach (IContent author in contentService.GetPagedChildren(authorsNode.Id, 0, int.MaxValue, out _))
            {
                var blogMlAuthor = new BlogMLAuthor
                {
                    Id = author.Key.ToString(),
                    CreatedOn = author.CreateDate,
                    LastModifiedOn = author.UpdateDate,
                    ApprovalStatus = BlogMLApprovalStatus.Approved,
                    Title = new BlogMLTextConstruct(author.Name)
                };
                blogMlDoc.Authors.Add(blogMlAuthor);
            }
        }

        private void AddBlogPosts(
            IContent archiveNode,
            BlogMLDocument blogMlDoc,
            string? categoryGroup,
            string? tagGroup,
            bool exportImagesAsBase64)
        {
            const int pageSize = 1000;
            var pageIndex = 0;
            IContent[] posts;
            do
            {
                posts = contentService.GetPagedChildren(
                    archiveNode.Id,
                    pageIndex,
                    pageSize,
                    out _,
                    ordering: Ordering.By("createDate")).ToArray();

                foreach (IContent child in posts)
                {
                    if (!child.Published)
                    {
                        continue;
                    }

                    ProcessSinglePost(child, blogMlDoc, categoryGroup, tagGroup, exportImagesAsBase64);
                }

                pageIndex++;
            }
            while (posts.Length == pageSize);
        }

        private void ProcessSinglePost(
            IContent child,
            BlogMLDocument blogMlDoc,
            string? categoryGroup,
            string? tagGroup,
            bool exportImagesAsBase64)
        {
            var content = GetPostContent(child);
            var postUrl = new Uri(urlProvider.GetUrl(child.Id), UriKind.RelativeOrAbsolute);
            var postAbsoluteUrl = new Uri(urlProvider.GetUrl(child.Id, UrlMode.Absolute), UriKind.Absolute);

            BlogMLPost blogMlPost = CreateBlogMlPost(child, content, postUrl);

            AssignAuthorToPost(blogMlPost, blogMlDoc, child.GetValue<string>("author"));
            AssignCategoriesToPost(blogMlPost, child, categoryGroup);
            AssignTagsToPost(blogMlPost, child, tagGroup);
            AttachPostImage(blogMlPost, child, postAbsoluteUrl, exportImagesAsBase64);

            _ = blogMlDoc.AddPost(blogMlPost);
        }

        private string GetPostContent(IContent child)
        {
            if (child.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateRichText))
            {
                // TODO: this would also need to handle RTE extensions e.g Blocks
                return child.GetValue<string>("richText") ?? string.Empty;
            }

            if (child.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateMarkdown))
            {
                // TODO: this would also need to handle Markdown extensions if supported e.g MDX
                var markdown = child.GetValue<string>("markdown");
                return markdown is not null ? markdownToHtmlConverter.ToHtml(markdown) : string.Empty;
            }

            return string.Empty;
        }

        private static BlogMLPost CreateBlogMlPost(IContent child, string content, Uri postUrl)
        {
            return new BlogMLPost
            {
                Id = child.Key.ToString(),
                Name = new BlogMLTextConstruct(child.Name),
                Title = new BlogMLTextConstruct(child.Name),
                ApprovalStatus = BlogMLApprovalStatus.Approved,
                PostType = BlogMLPostType.Normal,
                CreatedOn = child.CreateDate,
                LastModifiedOn = child.UpdateDate,
                Content = new BlogMLTextConstruct(content, BlogMLContentType.Html),
                Excerpt = new BlogMLTextConstruct(child.GetValue<string>("excerpt")),
                Url = postUrl
            };
        }

        private static void AssignAuthorToPost(BlogMLPost blogMlPost, BlogMLDocument blogMlDoc, string? authorName)
        {
            BlogMLAuthor? author = blogMlDoc.Authors?.FirstOrDefault(x =>
                x.Title is not null && x.Title.Content.InvariantEquals(authorName));

            if (author is not null)
            {
                blogMlPost.Authors.Add(author.Id);
            }
        }

        private void AssignCategoriesToPost(BlogMLPost blogMlPost, IContent child, string? categoryGroup)
        {
            IEnumerable<ITag> categories = tagService.GetTagsForEntity(child.Id, categoryGroup);
            foreach (ITag category in categories)
            {
                blogMlPost.Categories.Add(category.Id.ToString());
            }
        }

        private void AssignTagsToPost(BlogMLPost blogMlPost, IContent child, string? tagGroup)
        {
            var tags = tagService.GetTagsForEntity(child.Id, tagGroup).Select(t => t.Text).ToList();
            if (tags.Count > 0)
            {
                _ = blogMlPost.AddExtension(new TagsSyndicationExtension
                {
                    Context = { Tags = new Collection<string>(tags) }
                });
            }
        }

        private void AttachPostImage(
            BlogMLPost blogMlPost,
            IContent child,
            Uri postAbsoluteUrl,
            bool exportImagesAsBase64)
        {
            if (!TryExtractImageV3(exportImagesAsBase64, child, postAbsoluteUrl, blogMlPost))
            {
                _ = TryExtractImageV1(exportImagesAsBase64, child, postAbsoluteUrl, blogMlPost);
            }
        }

        private bool TryExtractImageV1(
            bool exportImagesAsBase64,
            IContent child,
            Uri postAbsoluteUrl,
            BlogMLPost blogMlPost)
        {
            if (!child.HasProperty("postImage"))
            {
                return false;
            }

            try
            {
                if (!TryParseMediaUdi(child, out Guid mediaGuid))
                {
                    return false;
                }

                IMedia? media = mediaService.GetById(mediaGuid);
                if (media is null)
                {
                    return false;
                }

                if (!TryGetMediaPathV1(media, out string? mediaPath))
                {
                    return false;
                }

                var mime = ArticulateImportMediaService.GetMimeTypeFromExtension(mediaPath!);
                if (string.IsNullOrWhiteSpace(mime))
                {
                    return false;
                }

                BlogMLAttachment attachment =
                    CreateAttachmentFromMedia(exportImagesAsBase64, media, mediaPath!, mime, postAbsoluteUrl);
                blogMlPost.Attachments.Add(attachment);
                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Could not add the file to the blogML post attachments");
                return false;
            }
        }

        private static bool TryParseMediaUdi(IContent child, out Guid mediaGuid)
        {
            mediaGuid = Guid.Empty;
            var mediaUdi = child.GetValue<string>("postImage");

            if (string.IsNullOrWhiteSpace(mediaUdi))
            {
                return false;
            }

            try
            {
                var udi = (GuidUdi)UdiParser.Parse(mediaUdi);
                mediaGuid = udi.Guid;
                return true;
            }
            catch
            {
                return false;
            }
        }

        private bool TryGetMediaPathV1(IMedia media, out string? mediaPath)
        {
            mediaPath = null;
            string? filename = media.GetValue(Constants.Conventions.Media.File)?.ToString();

            if (filename is null)
            {
                return false;
            }

            mediaPath = mediaFileManager.GetMediaPath(
                filename,
                media.Key,
                media.Properties[Constants.Conventions.Media.File]!.PropertyType.Key);

            return true;
        }

        private bool TryExtractImageV3(
            bool exportImagesAsBase64,
            IContent child,
            Uri postAbsoluteUrl,
            BlogMLPost blogMlPost)
        {
            if (!child.HasProperty("postImage"))
            {
                return false;
            }

            string? mediaItemJson = child.GetValue<string>("postImage");
            if (string.IsNullOrWhiteSpace(mediaItemJson) || !mediaItemJson.DetectIsJson())
            {
                return false;
            }

            try
            {
                if (!TryParseMediaKey(mediaItemJson, out Guid mediaKey))
                {
                    return false;
                }

                IMedia? media = mediaService.GetById(mediaKey);
                if (media is null)
                {
                    return false;
                }

                if (!TryGetMediaFilePath(media, out string? mediaFilePath))
                {
                    return false;
                }

                var mime = ArticulateImportMediaService.GetMimeTypeFromExtension(mediaFilePath!);
                if (string.IsNullOrWhiteSpace(mime))
                {
                    return false;
                }

                BlogMLAttachment attachment = CreateAttachmentFromMedia(
                    exportImagesAsBase64,
                    media,
                    mediaFilePath!,
                    mime,
                    postAbsoluteUrl);
                blogMlPost.Attachments.Add(attachment);
                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Could not add the file to the blogML post attachments for post {PostId}",
                    child.Id);
                return false;
            }
        }

        private static bool TryParseMediaKey(string mediaItemJson, out Guid mediaKey)
        {
            mediaKey = Guid.Empty;
            try
            {
                using var doc = JsonDocument.Parse(mediaItemJson);
                JsonElement firstElement = doc.RootElement.EnumerateArray().FirstOrDefault();
                if (firstElement.ValueKind == JsonValueKind.Undefined)
                {
                    return false;
                }

                if (!firstElement.TryGetProperty("mediaKey", out JsonElement mediaKeyElement))
                {
                    return false;
                }

                var mediaKeyStr = mediaKeyElement.GetString();
                return Guid.TryParse(mediaKeyStr, out mediaKey);
            }
            catch (JsonException)
            {
                return false;
            }
        }

        private static bool TryGetMediaFilePath(IMedia media, out string? mediaFilePath)
        {
            mediaFilePath = media.GetValue<string>(Constants.Conventions.Media.File);
            if (mediaFilePath is null)
            {
                return false;
            }

            if (mediaFilePath.DetectIsJson())
            {
                using var mediaJson = JsonDocument.Parse(mediaFilePath);
                if (mediaJson.RootElement.TryGetProperty("src", out JsonElement mediaSrc))
                {
                    mediaFilePath = mediaSrc.GetString();
                }
            }

            return mediaFilePath is not null;
        }

        private BlogMLAttachment CreateAttachmentFromMedia(
            bool exportImagesAsBase64,
            IMedia media,
            string mediaFilePath,
            string mimeType,
            Uri postAbsoluteUrl)
        {
            var imageUrl =
                new Uri(
                    postAbsoluteUrl.GetLeftPart(UriPartial.Authority) + mediaFilePath.EnsureStartsWith('/'),
                    UriKind.Absolute);
            var attachment = new BlogMLAttachment
            {
                Url = imageUrl, ExternalUri = imageUrl, IsEmbedded = exportImagesAsBase64, MimeType = mimeType
            };

            if (exportImagesAsBase64)
            {
                using Stream mediaFileStream = mediaFileManager.GetFile(media, out _);
                using var memoryStream = new MemoryStream();
                mediaFileStream.CopyTo(memoryStream);
                attachment.Content = Convert.ToBase64String(memoryStream.ToArray());
            }
            else
            {
                attachment.Content = string.Empty;
            }

            return attachment;
        }
    }
}
