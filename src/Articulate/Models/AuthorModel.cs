using System;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Articulate.Models
{
    public class AuthorModel(
        IPublishedContent content,
        IEnumerable<IPublishedContent> listItems,
        PagerModel pager,
        int postCount,
        IPublishedValueFallback publishedValueFallback,
        IVariationContextAccessor variationContextAccessor)
        : ListModel(content, pager, listItems, publishedValueFallback, variationContextAccessor), IImageModel
    {
        private DateTime? _lastPostDate;

        public string Bio => this.Value<string>("authorBio");

        public string AuthorUrl => this.Value<string>("authorUrl");

        private MediaWithCrops _image;
        public MediaWithCrops Image => _image ??= Unwrap().Value<MediaWithCrops>("authorImage");

        public int PostCount { get; } = postCount;

        //We know the list of posts passed in is already ordered descending so get the first
        
        public DateTime? LastPostDate =>
            _lastPostDate ?? (_lastPostDate = Children.FirstOrDefault()?.Value<DateTime>("publishedDate"));

        string IImageModel.Url => this.Url();
    }
}
