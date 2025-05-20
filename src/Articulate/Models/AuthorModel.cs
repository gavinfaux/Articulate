using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
#if NET9_0_OR_GREATER
using Umbraco.Cms.Core.Services.Navigation;
#endif
using Umbraco.Extensions;

namespace Articulate.Models
{
    public class AuthorModel : ListModel, IImageModel
    {        
        private DateTime? _lastPostDate;
#if NET9_0_OR_GREATER
        private INavigationQueryService _navigationQueryService;
        private IPublishedContentStatusFilteringService _publishedContentStatusFilteringService;
        
        public AuthorModel(
            IPublishedContent content,
            IEnumerable<IPublishedContent> listItems,
            PagerModel pager,
            int postCount,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor, INavigationQueryService navigationQueryService, IPublishedContentStatusFilteringService publishedContentStatusFilteringService)
            : base(content, pager, listItems, publishedValueFallback, variationContextAccessor, navigationQueryService, publishedContentStatusFilteringService)
        {
            PostCount = postCount;
        }
#else
        public AuthorModel(
            IPublishedContent content,
            IEnumerable<IPublishedContent> listItems,
            PagerModel pager,
            int postCount,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor)
            : base(content, pager, listItems, publishedValueFallback, variationContextAccessor)
        {
            PostCount = postCount;
        }
#endif
        public string Bio => this.Value<string>("authorBio");

        public string AuthorUrl => this.Value<string>("authorUrl");

        private MediaWithCrops _image;
        public MediaWithCrops Image => (_image ??= base.Unwrap().Value<MediaWithCrops>("authorImage"));
       
        public int PostCount { get; }

        //We know the list of posts passed in is already ordered descending so get the first
        public DateTime? LastPostDate => _lastPostDate ?? (_lastPostDate = Children.FirstOrDefault()?.Value<DateTime>("publishedDate"));

        string IImageModel.Url => this.Url();
    }

}
