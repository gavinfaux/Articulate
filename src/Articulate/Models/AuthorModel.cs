#nullable enable
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    public class AuthorModel : ListModel, IImageModel
    {
        private readonly Lazy<MediaWithCrops?> _image;
        private readonly Lazy<DateTime?> _lastPostDate;

        public AuthorModel(
            IPublishedContent? content,
            IEnumerable<IPublishedContent>? listItems,
            PagerModel? pager,
            int postCount,
            IPublishedValueFallback publishedValueFallback)
            : base(content, pager, listItems, publishedValueFallback)
        {
            PostCount = postCount;
            _image = new Lazy<MediaWithCrops?>(() => Unwrap().Value<MediaWithCrops>("authorImage"), true);

            // TODO: Replace Children access with IDocumentNavigationQueryService.TryGetChildrenKeys() once available
            // to avoid relying on the obsolete PublishedContentWrapped API slated for removal in Umbraco v16.
            _lastPostDate = new Lazy<DateTime?>(() => Children.FirstOrDefault()?.Value<DateTime>("publishedDate"), true);
        }

        [Obsolete("Use AuthorModel(IPublishedContent? content, IEnumerable<IPublishedContent>? listItems, PagerModel? pager, int postCount, IPublishedValueFallback publishedValueFallback)")]
        public AuthorModel(
            IPublishedContent? content,
            IEnumerable<IPublishedContent>? listItems,
            PagerModel? pager,
            int postCount,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor)
            : this(content, listItems, pager, postCount, publishedValueFallback)
        {
        }

        public string Bio => this.Value<string>("authorBio") ?? string.Empty;

        public string? AuthorUrl => this.Value<string>("authorUrl").ToSafeHrefUrl();

        /// <inheritdoc/>
        public MediaWithCrops? Image => _image.Value;

        public int PostCount { get; }

        // We know the list of posts passed in is already ordered descending so get the first
        [Obsolete("Please use TryGetChildrenKeys() on IDocumentNavigationQueryService or IMediaNavigationQueryService instead. Scheduled for removal in V16.", false)]
        public DateTime? LastPostDate => _lastPostDate.Value;
        /// <inheritdoc/>
        string IImageModel.Url => this.Url();
    }
}
