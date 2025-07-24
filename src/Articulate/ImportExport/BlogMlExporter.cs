using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Argotic.Common;
using Argotic.Syndication.Specialized;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Extensions;

namespace Articulate.ImportExport
{
    public class BlogMlExporter
    {
        private readonly IContentService _contentService;
        private readonly IMediaService _mediaService;
        private readonly IContentTypeService _contentTypeService;
        private readonly IDataTypeService _dataTypeService;
        private readonly ITagService _tagService;
        private readonly IPublishedUrlProvider _urlProvider;
        private readonly ISqlContext _sqlContext;
        private readonly ILogger<BlogMlExporter> _logger;
        private readonly MediaFileManager _mediaFileManager;
        private readonly ArticulateTempFileSystem _articulateTempFileSystem;

        public BlogMlExporter(
            IContentService contentService,
            IMediaService mediaService,
            IContentTypeService contentTypeService,
            IDataTypeService dataTypeService,
            ITagService tagService,
            MediaFileManager mediaFileManager,
            ArticulateTempFileSystem articulateTempFileSystem,
            IPublishedUrlProvider urlProvider,
            ISqlContext sqlContext,
            ILogger<BlogMlExporter> logger)
        {
            _mediaFileManager = mediaFileManager;
            _articulateTempFileSystem = articulateTempFileSystem;
            _contentService = contentService;
            _mediaService = mediaService;
            _contentTypeService = contentTypeService;
            _dataTypeService = dataTypeService;
            _tagService = tagService;
            _urlProvider = urlProvider;
            _sqlContext = sqlContext;
            _logger = logger;
        }

        public async Task ExportAsync(
            Guid blogRootNode,
            string exportFileName,
            bool exportImagesAsBase64 = false)
        {
            {
                var root = _contentService.GetById(blogRootNode) ?? throw new InvalidOperationException("No node found with id " + blogRootNode);

                if (!root.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate))
                {
                    throw new InvalidOperationException($"The node with id {blogRootNode} is not an Articulate root node");
                }

                var postType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateRichText) ??
                               throw new InvalidOperationException(
                                   "Articulate is not installed properly, the 'ArticulateRichText' doc type could not be found");
                var categoryDataType = await _dataTypeService.GetAsync("Articulate Categories") ??
                                       throw new InvalidOperationException(
                                           "No Data Type named 'Articulate Categories' found");
                var categoryConfiguration = categoryDataType.ConfigurationAs<TagConfiguration>();
                var categoryGroup = categoryConfiguration?.Group;
                var tagDataType = await _dataTypeService.GetAsync("Articulate Tags") ??
                                  throw new InvalidOperationException("No Data Type named 'Articulate Tags' found");
                var tagConfiguration = tagDataType.ConfigurationAs<TagConfiguration>();
                var tagGroup = tagConfiguration?.Group;
                //TODO: See: http://argotic.codeplex.com/wikipage?title=Generating%20portable%20web%20log%20content&referringTitle=Home

                var blogMlDoc = new BlogMLDocument
                {
                    RootUrl = new Uri(_urlProvider.GetUrl(root.Id), UriKind.RelativeOrAbsolute),
                    GeneratedOn = DateTime.Now,
                    Title = new BlogMLTextConstruct(root.GetValue<string>("blogTitle")),
                    Subtitle = new BlogMLTextConstruct(root.GetValue<string>("blogDescription"))
                };

                var authorsContentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors)
                    ?? throw new InvalidOperationException("Articulate is not installed properly, the 'ArticulateAuthors' doc type could not be found");

                var authorsNodes = _contentService.GetPagedDescendants(root.Id, 0, int.MaxValue, out var total,
                        _sqlContext.Query<IContent>().Where(x => x.ContentTypeId == authorsContentType.Id),
                        Ordering.By("CreateDate", Direction.Descending));

                foreach (var authorsNode in authorsNodes)
                {
                    AddBlogAuthors(authorsNode, blogMlDoc);
                }

                AddBlogCategories(blogMlDoc, categoryGroup);

                var archiveContentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive)
                    ?? throw new InvalidOperationException("Articulate is not installed properly, the 'ArticulateArchive' doc type could not be found");

                var archiveNodes = _contentService.GetPagedDescendants(root.Id, 0, int.MaxValue, out total,
                        _sqlContext.Query<IContent>().Where(x => x.ContentTypeId == archiveContentType.Id),
                        Ordering.By("CreateDate", Direction.Descending));

                foreach (var archiveNode in archiveNodes)
                {
                    AddBlogPosts(archiveNode, blogMlDoc, categoryGroup, tagGroup, exportImagesAsBase64);
                }

                WriteFile(blogMlDoc, exportFileName);
            }
        }

        private void WriteFile(BlogMLDocument blogMlDoc, string fileName)
        {
            using var stream = new MemoryStream();
            blogMlDoc.Save(stream, new SyndicationResourceSaveSettings()
            {
                CharacterEncoding = Encoding.UTF8
            });
            stream.Position = 0;
            _articulateTempFileSystem.AddFile(fileName, stream, true);
        }

        private void AddBlogCategories(BlogMLDocument blogMlDoc, string tagGroup)
        {
            var categories = _tagService.GetAllContentTags(tagGroup);
            foreach (var category in categories)
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
            foreach (var author in _contentService.GetPagedChildren(authorsNode.Id, 0, int.MaxValue, out _))
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

        private void AddBlogPosts(IContent archiveNode, BlogMLDocument blogMlDoc, string categoryGroup, string tagGroup, bool exportImagesAsBase64)
        {
            const int pageSize = 1000;
            var pageIndex = 0;
            IContent[] posts;
            do
            {
                posts = _contentService.GetPagedChildren(archiveNode.Id, pageIndex, pageSize, out _, ordering: Ordering.By("createDate")).ToArray();

                foreach (var child in posts)
                {
                    if (!child.Published)
                    {
                        continue;
                    }

                    var content = "";
                    if (child.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateRichText))
                    {
                        //TODO: this would also need to handle RTE extensions e.g Blocks
                        content = child.GetValue<string>("richText");
                    }
                    else if (child.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateMarkdown))
                    {
                        //TODO: this would also need to handle Markdown extensions if supported e.g MDX
                        content = MarkdownHelper.ToHtml(child.GetValue<string>("markdown"));
                    }

                    var postUrl = new Uri(_urlProvider.GetUrl(child.Id), UriKind.RelativeOrAbsolute);
                    var postAbsoluteUrl = new Uri(_urlProvider.GetUrl(child.Id, UrlMode.Absolute), UriKind.Absolute);
                    var blogMlPost = new BlogMLPost()
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

                    var author = blogMlDoc.Authors.FirstOrDefault(x => x.Title != null && x.Title.Content.InvariantEquals(child.GetValue<string>("author")));
                    if (author != null)
                    {
                        blogMlPost.Authors.Add(author.Id);
                    }

                    var categories = _tagService.GetTagsForEntity(child.Id, categoryGroup);
                    foreach (var category in categories)
                    {
                        blogMlPost.Categories.Add(category.Id.ToString());
                    }

                    var tags = _tagService.GetTagsForEntity(child.Id, tagGroup).Select(t => t.Text).ToList();
                    if (tags.Count > 0)
                    {
                        blogMlPost.AddExtension(new Syndication.BlogML.TagsSyndicationExtension { Context = { Tags = new Collection<string>(tags) } });
                    }

                    if (child.HasProperty("postImage") && child.GetValue<string>("postImage") is { } mediaItemJson && mediaItemJson.DetectIsJson())
                    {
                        try
                        {
                            using var doc = JsonDocument.Parse(mediaItemJson);
                            var mediaKeyStr = doc.RootElement.EnumerateArray().FirstOrDefault().GetProperty("mediaKey").GetString();

                            if (Guid.TryParse(mediaKeyStr, out var mediaKey))
                            {
                                var media = _mediaService.GetById(mediaKey);
                                if (media != null && media.GetValue<string>(Constants.Conventions.Media.File) is { } mediaFilePath)
                                {
                                    var mime = ImageMimeType(mediaFilePath);
                                    if (!string.IsNullOrWhiteSpace(mime))
                                    {
                                        var imageUrl = new Uri(postAbsoluteUrl.GetLeftPart(UriPartial.Authority) + mediaFilePath.EnsureStartsWith('/'), UriKind.Absolute);
                                        var attachment = new BlogMLAttachment
                                        {
                                            Url = imageUrl,
                                            ExternalUri = imageUrl,
                                            IsEmbedded = exportImagesAsBase64,
                                            MimeType = mime
                                        };

                                        if (exportImagesAsBase64)
                                        {
                                            using var mediaFileStream = _mediaFileManager.GetFile(media, out _);
                                            using var memoryStream = new MemoryStream();
                                            mediaFileStream.CopyTo(memoryStream);
                                            attachment.Content = Convert.ToBase64String(memoryStream.ToArray());
                                        }
                                        else
                                        {
                                            attachment.Content = string.Empty;
                                        }

                                        blogMlPost.Attachments.Add(attachment);
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Could not add the file to the blogML post attachments for post {PostId}", child.Id);
                        }
                    }

                    blogMlDoc.AddPost(blogMlPost);
                }

                pageIndex++;
            } while (posts.Length == pageSize);
        }

        private static string ImageMimeType(string src)
        {
            var ext = Path.GetExtension(src).Trim('.').ToLowerInvariant();
            return ext switch
            {
                "jpg" => "image/jpeg",
                "svg" => "image/svg+xml",
                "png" => "image/png",
                "gif" => "image/gif",
                "webp" => "image/webp",
                "avif" => "image/avif",
                "bmp" => "image/bmp",
                "tiff" => "image/tiff",
                _ when !string.IsNullOrWhiteSpace(ext) => $"image/{ext}",
                _ => string.Empty
            };
        }
    }
}
