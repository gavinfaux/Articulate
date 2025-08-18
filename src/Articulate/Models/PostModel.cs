#nullable enable
using Microsoft.AspNetCore.Html;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Strings;

namespace Articulate.Models
{
    public sealed class PostModel : MasterModel, IImageModel
    {
        private PostAuthorModel? _author;
        private MediaWithCrops? _postImage;
        private string? _croppedPostImageUrl;

        [Obsolete("Use PostModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)")]
        public PostModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback, IVariationContextAccessor variationContextAccessor)
            : this(content, publishedValueFallback)
        { }

        public PostModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)
            : base(content, publishedValueFallback)
        {
            PageTitle = Name + " - " + BlogTitle;
            PageDescription = Excerpt;
            PageTags = string.Join(",", Tags);
        }

        public IEnumerable<string> Tags => this.Value<IEnumerable<string>>("tags") ?? [];

        public IEnumerable<string> Categories => this.Value<IEnumerable<string>>("categories") ?? [];

        public bool EnableComments => Unwrap().Value<bool>("enableComments", fallback: Fallback.ToAncestors);

        public PostAuthorModel Author
        {
            get
            {
                if (_author is not null)
                {
                    return _author;
                }

                _author = new PostAuthorModel
                {
                    Name = Unwrap().Value<string>("author", fallback: Fallback.ToAncestors)
                };

                // look up assocated author node if we can
                IPublishedContent? authors = RootBlogNode.Children(content => content.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateAuthors))?.FirstOrDefault();
                IPublishedContent? authorNode = authors?.Children(content => content.Name.InvariantEquals(_author.Name))?.FirstOrDefault();

                if (authorNode is null)
                {
                    return _author;
                }

                _author.Bio = authorNode.Value<string>("authorBio");
                _author.Url = authorNode.Value<string>("authorUrl");
                _author.Image = authorNode.Value<MediaWithCrops>("authorImage");
                _author.BlogUrl = authorNode.Url();

                return _author;
            }
        }

        public string Excerpt => this.Value<string>("excerpt") ?? string.Empty;

        public DateTime PublishedDate => Unwrap().Value<DateTime>("publishedDate");

        /// <summary>
        /// Gets the blog post associated image
        /// </summary>
        public MediaWithCrops? PostImage => _postImage ??= Unwrap().Value<MediaWithCrops>("postImage");

        /// <summary>
        /// Gets a Cropped version of the PostImageUrl
        /// </summary>
        public string CroppedPostImageUrl
        {
            get
            {
                if (_croppedPostImageUrl is not null)
                {
                    return _croppedPostImageUrl;
                }

                if (PostImage is null)
                {
                    return string.Empty;
                }

                var wideCropUrl = PostImage.GetCropUrl("wide");
                _croppedPostImageUrl = (wideCropUrl ?? string.Empty) + (wideCropUrl is not null && wideCropUrl.Contains('?') ? "&" : "?");
                return _croppedPostImageUrl;
            }
        }

        /// <summary>
        /// Gets the Social Meta Description
        /// </summary>
        public string SocialMetaDescription => this.Value<string>("socialDescription") ?? string.Empty;

        public IHtmlContent Body =>
            new HtmlString(
                this.Value<IHtmlEncodedString>(
                        this.HasProperty("richText") ? "richText" : "markdown")
                    ?.ToHtmlString());

        public string ExternalUrl => this.Value<string>("externalUrl") ?? string.Empty;

        MediaWithCrops? IImageModel.Image => PostImage;

        string IImageModel.Name => Name;

        string IImageModel.Url => this.Url();
    }
}
