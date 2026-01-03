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

            // Use Posts collection (from ListModel) instead of obsolete Children property
            _lastPostDate = new Lazy<DateTime?>(() => Posts.FirstOrDefault()?.Value<DateTime>("publishedDate"), true);
        }

        public string Bio => this.Value<string>("authorBio") ?? string.Empty;

        public string? AuthorUrl => this.Value<string>("authorUrl").ToSafeHrefUrl();

        /// <inheritdoc/>
        public MediaWithCrops? Image => _image.Value;

        public int PostCount { get; }

        // We know the list of posts passed in is already ordered descending so get the first
        public DateTime? LastPostDate => _lastPostDate.Value;

        /// <inheritdoc/>
        string IImageModel.Url => this.Url();
    }
}
