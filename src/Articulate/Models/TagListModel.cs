#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    public class TagListModel : MasterModel
    {
        [Obsolete("Use TagListModel(IPublishedContent content, string name, int pageSize, PostTagCollection tags, IPublishedValueFallback publishedValueFallback)")]
        public TagListModel(
            IMasterModel masterModel,
            string name,
            int pageSize,
            PostTagCollection tags,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor)
            : this(masterModel, name, pageSize, tags, publishedValueFallback)
        {
        }

        public TagListModel(
        IMasterModel masterModel,
        string name,
        int pageSize,
        PostTagCollection tags,
        IPublishedValueFallback publishedValueFallback)
        : base(masterModel.RootBlogNode, publishedValueFallback)
        {
            Name = name;
            Theme = masterModel.Theme;
            RootBlogNode = masterModel.RootBlogNode;
            BlogArchiveNode = masterModel.BlogArchiveNode;
            PageSize = pageSize;
            BlogTitle = masterModel.BlogTitle;
            BlogDescription = masterModel.BlogDescription;
            Tags = tags;
            BlogBanner = masterModel.BlogBanner;
            BlogLogo = masterModel.BlogLogo;
            DisqusShortName = masterModel.DisqusShortName;
            CustomRssFeed = masterModel.CustomRssFeed;
            PageTitle = Name + " - " + BlogTitle;
        }

        public PostTagCollection Tags { get; }

        public override string Name { get; }
    }
}
