using Microsoft.AspNetCore.Mvc;

namespace Articulate
{
    [Obsolete("Use Articulate.Models.PublishedContentExtensions")]
    public static class UrlHelperExtensions
    {
        /// <summary>
        /// Returns the url of a themed asset
        /// </summary>
        /// <param name="url"></param>
        /// <param name="model"></param>
        /// <param name="relativeAssetPath"></param>
        /// <returns></returns>
        [Obsolete("Use your custom themes asset URLs instead.", error: true)]
        public static string ThemedAsset(this IUrlHelper url, IMasterModel model, string relativeAssetPath) => throw new NotSupportedException("ThemedAsset is no longer supported.");

        /// <summary>
        /// Returns the main rss feed url for this blog
        /// </summary>
        /// <param name="url"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateRssUrl(this IMasterModel model)")]
        public static string ArticulateRssUrl(this IUrlHelper url, IMasterModel model) => model.ArticulateRssUrl();

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateCreateBlogEntryUrl(this IMasterModel model)")]
        public static string ArticulateCreateBlogEntryUrl(this IUrlHelper url, IMasterModel model) => model.ArticulateCreateBlogEntryUrl();

        /// <summary>
        /// Returns an RSS feed URL specific to this tag
        /// </summary>
        /// <param name="url"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateTagRssUrl(this IMasterModel model)")]
        public static string ArticulateTagRssUrl(this IUrlHelper url, PostsByTagModel model)
            => model.ArticulateTagRssUrl();

        /// <summary>
        /// Returns an RSS feed URL specific to this author
        /// </summary>
        /// <param name="url"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateAuthorRssUrl(this IMasterModel model)")]
        public static string ArticulateAuthorRssUrl(this IUrlHelper url, AuthorModel model)
            => model.ArticulateAuthorRssUrl();

        /// <summary>
        /// Get the search url without the 'term' query string
        /// </summary>
        /// <param name="url"></param>
        /// <param name="model"></param>
        /// <param name="includeDomain"></param>
        /// <returns></returns>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateSearchUrl(this IMasterModel model)")]
        public static string ArticulateSearchUrl(this IUrlHelper url, IMasterModel model, bool includeDomain = false) => model.ArticulateSearchUrl(includeDomain);

        /// <summary>
        /// The Home Blog Url
        /// </summary>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateRootUrl(this IMasterModel model)")]
        public static string ArticulateRootUrl(this IUrlHelper url, IMasterModel model) => model.ArticulateRootUrl();

        /// <summary>
        /// Returns the default categories list URL for blog posts
        /// </summary>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateCategoriesUrl(this IMasterModel model)")]
        public static string ArticulateCategoriesUrl(this IUrlHelper url, IMasterModel model) => model.ArticulateCategoriesUrl();

        /// <summary>
        /// Returns the authors list URL
        /// </summary>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateAuthorsUrl(this IMasterModel model)")]
        public static string ArticulateAuthorsUrl(this IUrlHelper url, IMasterModel model) => model.ArticulateAuthorsUrl();

        /// <summary>
        /// Returns the URL for the tag list
        /// </summary>
        /// <param name="url"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateTagsUrl(this IMasterModel model)")]
        public static string ArticulateTagsUrl(this IUrlHelper url, IMasterModel model) => model.ArticulateTagsUrl();

        /// <summary>
        /// Returns the url for a single category
        /// </summary>
        /// <param name="url"></param>
        /// <param name="model"></param>
        /// <param name="category"></param>
        /// <returns></returns>
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ArticulateCategoryUrl(this IMasterModel model)")]
        public static string ArticulateCategoryUrl(this IUrlHelper url, IMasterModel model, string category) => model.ArticulateCategoryUrl(category);
    }
}
