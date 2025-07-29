#nullable enable
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Articulate.Models
{
    public class AuthorModel : ListModel, IImageModel
    {
        private DateTime? _lastPostDate;

        public AuthorModel(
            IPublishedContent? content,
            IEnumerable<IPublishedContent>? listItems,
            PagerModel? pager,
            int postCount,
            IPublishedValueFallback publishedValueFallback)
            : base(content, pager, listItems, publishedValueFallback)
        {
            PostCount = postCount;
        }

        public string Bio => this.Value<string>("authorBio") ?? string.Empty;

        public string AuthorUrl => this.Value<string>("authorUrl") ?? string.Empty;

        private MediaWithCrops? _image;
        public MediaWithCrops? Image => _image ??= Unwrap().Value<MediaWithCrops>("authorImage");

        public int PostCount { get; }

        //We know the list of posts passed in is already ordered descending so get the first
        [Obsolete("Please use TryGetChildrenKeys() on IDocumentNavigationQueryService or IMediaNavigationQueryService instead. Scheduled for removal in V16.", false)]
        public DateTime? LastPostDate => _lastPostDate ??= Children.FirstOrDefault()?.Value<DateTime>("publishedDate");

        string IImageModel.Url => this.Url();
    }

}
