#nullable enable
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    public class AuthorModel(
        IPublishedContent? content,
        IEnumerable<IPublishedContent>? listItems,
        PagerModel? pager,
        int postCount,
        IPublishedValueFallback publishedValueFallback)
        : ListModel(content, pager, listItems, publishedValueFallback), IImageModel
    {
        [Obsolete("Use AuthorModel(IEnumerable<IPublishedContent>? listItems,PagerModel? pager, int postCount,  IPublishedValueFallback publishedValueFallback)")]
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

        public string AuthorUrl => this.Value<string>("authorUrl") ?? string.Empty;

        /// <inheritdoc/>
        public MediaWithCrops? Image => field ??= Unwrap().Value<MediaWithCrops>("authorImage");

        public int PostCount { get; } = postCount;

        // We know the list of posts passed in is already ordered descending so get the first
        [Obsolete("Please use TryGetChildrenKeys() on IDocumentNavigationQueryService or IMediaNavigationQueryService instead. Scheduled for removal in V16.", false)]
        public DateTime? LastPostDate { get => field ??= Children.FirstOrDefault()?.Value<DateTime>("publishedDate"); private set; }

        /// <inheritdoc/>
        string IImageModel.Url => this.Url();
    }
}
