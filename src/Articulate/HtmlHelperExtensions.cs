#nullable enable
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using PublishedContentExtensions = Articulate.Models.PublishedContentExtensions;

namespace Articulate
{
    public static class HtmlHelperExtensions
    {
        [Obsolete("Use Articulate.Models.PublishedContentExtensions.AuthorCitation(this PostModel model)")]
        public static IHtmlContent? AuthorCitation(this IHtmlHelper html, PostModel model) => model.AuthorCitation();

        /// <summary>
        /// Adds generic social meta tags
        /// </summary>
        /// <param name="html"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        public static IHtmlContent SocialMetaTags(this IHtmlHelper html, IMasterModel model)
        {
            var builder = new HtmlContentBuilder();
            model.SocialMetaTags(builder);

            if (model is PostModel postModel)
            {
                PublishedContentExtensions.PostSocialMetaTags(postModel, html.ViewContext.HttpContext.Request, builder);
            }

            return builder;
        }

        [Obsolete("Use PublishedContentExtensions.PostSocialMetaTags(this PostModel model, httpRequest request)")]
        public static IHtmlContent SocialMetaTags(this IHtmlHelper html, PostModel model)
        {
            var builder = new HtmlContentBuilder();
            PublishedContentExtensions.PostSocialMetaTags(model, html.ViewContext.HttpContext.Request, builder);
            return builder;
        }

        [Obsolete("Use PublishedContentExtensions.RenderOpenSearch(this IMasterModel model)")]
        public static IHtmlContent? RenderOpenSearch(this IHtmlHelper html, IMasterModel model) =>
            model.RenderOpenSearch();

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.RssFeed(this IMasterModel model)")]
        public static IHtmlContent? RssFeed(this IHtmlHelper html, IMasterModel model) => model.RssFeed();

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.AuthorRssFeed(this IMasterModel model)")]
        public static IHtmlContent? AuthorRssFeed(this IHtmlHelper html, AuthorModel model, IUrlHelper urlHelper) =>
            model.AuthorRssFeed();

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.AdvertiseWeblogApi(this IMasterModel model)")]
        public static IHtmlContent? AdvertiseWeblogApi(this IHtmlHelper html, IMasterModel model) =>
            model.AdvertiseWeblogApi();

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.MetaTags(this IMasterModel model)")]
        public static IHtmlContent? MetaTags(this IHtmlHelper html, IMasterModel model) => model.MetaTags();

        [Obsolete(
            "Use Articulate.Models.PublishedContentExtensions.GoogleAnalyticsTracking(this IMasterModel model) and Articulate.Models.PublishedContentExtensions.GoogleAnalyticsNoScript(this IMasterModel model)")]
        public static IHtmlContent? GoogleAnalyticsTracking(this IHtmlHelper html, IMasterModel model) =>
            model.GoogleAnalyticsTracking();

        /// <summary>
        /// Renders a partial view in the current theme based on the current IMasterModel
        /// </summary>
        /// <param name="html"></param>
        /// <param name="model"></param>
        /// <param name="partialName"></param>
        /// <param name="viewModel"></param>
        /// <param name="viewData"></param>
        /// <returns></returns>
        [Obsolete("Use Html.PartialAsync(partialName, viewModel, viewData)")]
        public static Task<IHtmlContent>? ThemedPartialAsync(
            this IHtmlHelper html,
            IMasterModel model,
            string partialName,
            object viewModel,
            ViewDataDictionary? viewData = null) => viewData is null
            ? html.PartialAsync(partialName, model)
            : html.PartialAsync(partialName, viewModel, viewData);

        /// <summary>
        /// Renders a partial view in the current theme based on the current IMasterModel
        /// </summary>
        /// <param name="html"></param>
        /// <param name="model"></param>
        /// <param name="partialName"></param>
        /// <param name="viewData"></param>
        /// <returns></returns>
        [Obsolete("Use Html.PartialAsync(partialName, model, viewData)")]
        public static Task<IHtmlContent>? ThemedPartialAsync(
            this IHtmlHelper html,
            IMasterModel model,
            string partialName,
            ViewDataDictionary? viewData = null) => viewData is null
            ? html.PartialAsync(partialName, model)
            : html.PartialAsync(partialName, model, viewData);

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.TagCloud(model, maxWeight, maxResults)")]
        public static IHtmlContent? TagCloud(
            this IHtmlHelper html,
            PostTagCollection model,
            decimal maxWeight,
            int maxResults) => model.TagCloud(maxWeight, maxResults);

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.TagCloud(model, tagLink, maxWeight, maxResults)")]
        public static IHtmlContent? TagCloud(
            this IHtmlHelper html,
            PostTagCollection model,
            Func<PostsByTagModel, HelperResult> tagLink,
            decimal maxWeight,
            int maxResults) =>
            model.TagCloud(tagLink, maxWeight, maxResults);

        [Obsolete(
            "Use Articulate.Models.PublishedContentExtensions.ListTags(model, tagLink, maxWeight, maxResults, delimiter)")]
        public static IHtmlContent? ListTags(
            this IHtmlHelper html,
            PostModel model,
            Func<string, HelperResult> tagLink,
            string delimiter = ", ") =>
            PublishedContentExtensions.ListCategoriesOrTags([.. model.Tags], tagLink, delimiter);

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ListCategories(model, tagLink, delimiter)")]
        public static IHtmlContent? ListCategories(
            this IHtmlHelper html,
            PostModel model,
            Func<string, HelperResult> tagLink,
            string delimiter = ", ") =>
            PublishedContentExtensions.ListCategoriesOrTags([.. model.Categories], tagLink, delimiter);

        [Obsolete("Use Articulate.Models.PublishedContentExtensions.ListCategoriesOrTags(items, tagLink, delimiter)")]
        public static IHtmlContent? ListCategoriesOrTags(
            this IHtmlHelper html,
            string[] items,
            Func<string, HelperResult> tagLink,
            string delimiter) =>
            PublishedContentExtensions.ListCategoriesOrTags(items, tagLink, delimiter);

        /// <summary>
        /// Creates an Html table based on the collection
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="collection"></param>
        /// <param name="headers"></param>
        /// <param name="cssClasses"></param>
        /// <param name="cellTemplates"></param>
        /// <returns></returns>
        [Obsolete(
            "Use Articulate.Models.PublishedContentExtensions.Table<T>(collection, headers, cssClasses, cellTemplates)")]
        public static IHtmlContent? Table<T>(
            IEnumerable<T> collection,
            string[] headers,
            string[] cssClasses,
            params Func<T, HelperResult>[] cellTemplates) where T : class =>
            collection.Table(new Dictionary<string, object>(), headers, cssClasses, cellTemplates);

        /// <summary>
        /// Creates an Html table based on the collection
        /// </summary>
        [Obsolete(
            "Use Articulate.Models.PublishedContentExtensions.Table<T>(collection, htmlAttributes, headers, cssClasses)")]
        public static IHtmlContent? Table<T>(
            this IHtmlHelper html,
            IEnumerable<T> collection,
            object? htmlAttributes,
            string[] headers,
            string[] cssClasses,
            params Func<T, HelperResult>[] cellTemplates) where T : class =>
            collection.Table(htmlAttributes ?? new Dictionary<string, object>(), headers, cssClasses, cellTemplates);
    }
}
