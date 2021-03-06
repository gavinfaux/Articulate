﻿using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Routing;
using System.Web.Security;
using Articulate.Models;
using Articulate.Models.MetaWeblog;
using CookComputing.XmlRpc;
using HeyRed.MarkdownSharp;
using Umbraco.Core;
using Umbraco.Core.IO;
using Umbraco.Core.Models;
using Umbraco.Core.Models.Membership;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.Persistence.DatabaseModelDefinitions;
using Umbraco.Core.Services;
using Umbraco.Web;

namespace Articulate.Routing
{
    public class MetaWeblogHandler : XmlRpcService, IMetaWeblog, IBloggerMetaWeblog, IWordPressMetaWeblog, IRouteHandler
    {
        private readonly IUmbracoContextAccessor _umbracoContextAccessor;
        private readonly IContentService _contentService;
        private readonly ITagService _tagService;
        private readonly IUserService _userService;
        private readonly IMediaFileSystem _mediaFileSystem;

        public MetaWeblogHandler(IUmbracoContextAccessor umbracoContextAccessor, IContentService contentService, ITagService tagService, IUserService userService, IMediaFileSystem mediaFileSystem)
        {
            _umbracoContextAccessor = umbracoContextAccessor;
            _contentService = contentService;
            _tagService = tagService;
            _userService = userService;
            _mediaFileSystem = mediaFileSystem;
        }

        public int BlogRootId { get; internal set; }

        string IMetaWeblog.AddPost(string blogid, string username, string password, MetaWeblogPost post, bool publish)
        {
            var user = ValidateUser(username, password);

            var root = BlogRoot();

            var node = root.ChildrenOfType("ArticulateArchive").FirstOrDefault();
            if (node == null)
            {
                throw new XmlRpcFaultException(0, "No Articulate Archive node found");
            }

            var content = _contentService.Create(
                post.Title, node.Id, "ArticulateRichText", user.Id);

            var extractFirstImageAsProperty = false;
            if (root.HasProperty("extractFirstImage"))
            {
                extractFirstImageAsProperty = root.Value<bool>("extractFirstImage");
            }

            AddOrUpdateContent(content, post, user, publish, extractFirstImageAsProperty);

            return content.Id.ToString(CultureInfo.InvariantCulture);
        }

        bool IMetaWeblog.UpdatePost(string postid, string username, string password, MetaWeblogPost post, bool publish)
        {
            var user = ValidateUser(username, password);

            var asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                return false;
            }

            //first see if it's published
            var content = _contentService.GetById(asInt.Result);
            if (content == null)
            {
                return false;
            }

            var node = BlogRoot().ChildrenOfType("ArticulateArchive").FirstOrDefault();
            if (node == null)
            {
                throw new XmlRpcFaultException(0, "No Articulate Archive node found");
            }

            var extractFirstImageAsProperty = true;
            if (node.HasProperty("extractFirstImage"))
            {
                extractFirstImageAsProperty = node.Value<bool>("extractFirstImage");
            }

            AddOrUpdateContent(content, post, user, publish, extractFirstImageAsProperty);

            return true;
        }

        bool IBloggerMetaWeblog.DeletePost(string key, string postid, string username, string password, bool publish)
        {
            var userId = ValidateUser(username, password).Id;

            var asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                return false;
            }

            //first see if it's published
            var content = _contentService.GetById(asInt.Result);
            if (content == null)
            {
                return false;
            }

            //unpublish it, we won't delete it with this API
            _contentService.Unpublish(content, userId: userId);

            return true;
        }

        object IMetaWeblog.GetPost(string postid, string username, string password)
        {
            ValidateUser(username, password);

            var asInt = postid.TryConvertTo<int>();
            if (!asInt)
            {
                throw new XmlRpcFaultException(0, "The id could not be parsed to an integer");
            }

            //first see if it's published
            var post = _umbracoContextAccessor.UmbracoContext.ContentCache.GetById(asInt.Result);
            if (post != null)
            {
                return FromPost(new PostModel(post));
            }

            var content = _contentService.GetById(asInt.Result);
            if (content == null)
            {
                throw new XmlRpcFaultException(0, "No post found with id " + postid);
            }

            return FromContent(content);
        }

        object[] IMetaWeblog.GetRecentPosts(string blogid, string username, string password, int numberOfPosts)
        {
            ValidateUser(username, password);

            var node = BlogRoot().ChildrenOfType("ArticulateArchive").FirstOrDefault();
            if (node == null)
            {
                throw new XmlRpcFaultException(0, "No Articulate Archive node found");
            }

            return _contentService.GetPagedChildren(node.Id, 0, numberOfPosts, out long totalPosts, ordering: Ordering.By("updateDate", direction:Direction.Descending))
                .Select(FromContent).ToArray();
        }

        object[] IMetaWeblog.GetCategories(string blogid, string username, string password)
        {
            ValidateUser(username, password);

            return _tagService.GetAllTags("ArticulateCategories")
                .Select(x => (object)new
                {
                    description = x.Text,
                    id = x.Id,
                    categoryId = x.Id,
                    title = x.Text
                }).ToArray();
        }

        object IMetaWeblog.NewMediaObject(string blogid, string username, string password, MetaWeblogMediaObject media)
        {
            ValidateUser(username, password);

            // Save File
            using (var ms = new MemoryStream(media.Bits))
            {
                var fileUrl = "articulate/" + media.Name.ToSafeFileName();
                _mediaFileSystem.AddFile(fileUrl, ms);                
                return new { url = fileUrl };
            }
        }

        object[] IMetaWeblog.GetUsersBlogs(string key, string username, string password)
        {
            ValidateUser(username, password);

            var node = BlogRoot();

            return new[]
            {
                (object) new
                {
                    blogid = node.Id,
                    blogName = node.Name,
                    url = node.Url
                }
            };
        }

        object[] IBloggerMetaWeblog.GetUsersBlogs(string key, string username, string password)
        {
            return ((IMetaWeblog)this).GetUsersBlogs(key, username, password);
        }

        object[] IWordPressMetaWeblog.GetTags(string blogid, string username, string password)
        {
            ValidateUser(username, password);

            return _tagService.GetAllTags("ArticulateTags")
                .Select(x => (object)new
                {
                    name = x.Text,
                    id = x.Id,
                    tag_id = x.Id
                }).ToArray();
        }

        private readonly Regex _mediaSrc = new Regex(" src=(?:\"|')(?:http|https)://(?:[\\w\\d:-]+?)(/media/articulate/.*?)(?:\"|')", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private readonly Regex _mediaHref = new Regex(" href=(?:\"|')(?:http|https)://(?:[\\w\\d:-]+?)(/media/articulate/.*?)(?:\"|')", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private void AddOrUpdateContent(IContent content, MetaWeblogPost post, IUser user, bool publish, bool extractFirstImageAsProperty)
        {
            content.Name = post.Title;
            content.SetValue("author", user.Name);
            if (content.HasProperty("richText"))
            {
                var firstImage = "";

                //we need to replace all absolute image paths with relative ones
                var contentToSave = _mediaSrc.Replace(post.Content, match =>
                {
                    if (match.Groups.Count == 2)
                    {
                        var imageSrc = match.Groups[1].Value.EnsureStartsWith('/');
                        if (firstImage.IsNullOrWhiteSpace())
                        {
                            firstImage = imageSrc;
                        }
                        return " src=\"" + imageSrc + "\"";
                    }
                    return null;
                });

                var imagesProcessed = 0;

                //now replace all absolute anchor paths with relative ones
                contentToSave = _mediaHref.Replace(contentToSave, match =>
                {
                    if (match.Groups.Count == 2)
                    {
                        var href = " href=\"" +
                               match.Groups[1].Value.EnsureStartsWith('/') +
                               "\" class=\"a-image-" + imagesProcessed + "\" ";

                        imagesProcessed++;

                        return href;
                    }
                    return null;
                });

                content.SetValue("richText", contentToSave);

                if (extractFirstImageAsProperty
                    && content.HasProperty("postImage")
                    && !firstImage.IsNullOrWhiteSpace())
                {
                    content.SetValue("postImage", firstImage);
                    //content.SetValue("postImage", JsonConvert.SerializeObject(JObject.FromObject(new
                    //{
                    //    src = firstImage
                    //})));
                }
            }

            if (!post.Slug.IsNullOrWhiteSpace())
            {
                content.SetValue("umbracoUrlName", post.Slug);
            }
            if (!post.Excerpt.IsNullOrWhiteSpace())
            {
                content.SetValue("excerpt", post.Excerpt);
            }

            if (post.AllowComments == 1)
            {
                content.SetValue("enableComments", 1);
            }
            else if (post.AllowComments == 2)
            {
                content.SetValue("enableComments", 0);
            }

            content.AssignTags("categories", post.Categories);
            var tags = post.Tags.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Distinct().ToArray();
            content.AssignTags("tags", tags);

            if (publish)
            {
                if (post.CreateDate != DateTime.MinValue)
                {
                    content.SetValue("publishedDate", post.CreateDate);
                }

                _contentService.SaveAndPublish(content, userId: user.Id);
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
        private object FromPost(PostModel post)
        {
            return new MetaWeblogPost
            {
                AllowComments = post.EnableComments ? 1 : 2,
                Author = post.Author.Name,
                Categories = post.Categories.ToArray(),
                Content = post.Body.ToString(),
                CreateDate = post.PublishedDate != default(DateTime) ? post.PublishedDate : post.UpdateDate,
                Id = post.Id.ToString(CultureInfo.InvariantCulture),
                Slug = post.Url,
                Excerpt = post.Excerpt,
                Tags = string.Join(",", post.Tags.ToArray()),
                Title = post.Name
            };
        }

        private object FromContent(IContent post)
        {
            return new MetaWeblogPost
            {
                AllowComments = post.GetValue<bool>("enableComments") ? 1 : 2,
                Author = post.GetValue<string>("author"),
                Categories = post.GetValue<string>("categories").Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries),
                Content = post.ContentType.Alias == "ArticulateRichText"
                    ? post.GetValue<string>("richText")
                    : new Markdown().Transform(post.GetValue<string>("markdown")),
                CreateDate = post.UpdateDate,
                Id = post.Id.ToString(CultureInfo.InvariantCulture),
                Slug = post.GetValue<string>("umbracoUrlName").IsNullOrWhiteSpace()
                    ? post.Name.ToUrlSegment()
                    : post.GetValue<string>("umbracoUrlName").ToUrlSegment(),
                Excerpt = post.GetValue<string>("excerpt"),
                Tags = string.Join(",", post.GetValue<string>("tags").Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)),
                Title = post.Name
            };
        }

        private IPublishedContent BlogRoot()
        {
            var node = _umbracoContextAccessor.UmbracoContext.ContentCache.GetById(BlogRootId);

            if (node == null)
            {
                throw new XmlRpcFaultException(0, "No node found by route");
            }

            return node;
        }

        private IUser ValidateUser(string username, string password)
        {
            //TODO: Check security/access to the current node

            var provider = GetUsersMembershipProvider();

            if (!provider.ValidateUser(username, password))
            {
                throw new XmlRpcFaultException(0, "User is not valid!");
            }

            return _userService.GetByUsername(username);
        }

        private static MembershipProvider GetUsersMembershipProvider()
        {
            if (Membership.Providers[Constants.Security.UserMembershipProviderName] == null)
                throw new InvalidOperationException("No membership provider found with name " + Constants.Security.UserMembershipProviderName);

            return Membership.Providers[Constants.Security.UserMembershipProviderName];
        }

        public IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return this;
        }
    }
}