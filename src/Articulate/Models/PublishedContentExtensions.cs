using System.Collections;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;

// TODO: #nullable enable
namespace Articulate.Models
{
    public static class PublishedContentExtensions
    {
        [Obsolete("Prefer an extension method from Umbraco.Extensions.FriendlyImageCropperTemplateExtensions.GetCropUrl()")]
        public static string GetArticulateCropUrl(this IPublishedContent content, string propertyAlias, VariationContext variationContext)
        {
            ArgumentNullException.ThrowIfNull(content, nameof(content));
            ArgumentNullException.ThrowIfNull(propertyAlias, nameof(propertyAlias));

            var cropUrl = string.Empty;

            if (content.ContentType.ItemType == PublishedItemType.Content)
            {
                var property = content.HasProperty(propertyAlias) && content.HasValue(propertyAlias);
                MediaWithCrops value = property ? content.Value<MediaWithCrops>(propertyAlias) : null;
                cropUrl = value != null ? value.GetCropUrl() : content.GetCropUrl(propertyAlias: propertyAlias);
            }

            if (string.IsNullOrEmpty(cropUrl))
            {
                cropUrl = content.GetCropUrl();
            }

            return cropUrl;
        }

        public static IPublishedContent Next(this IPublishedContent content)
        {
            IPublishedContent parent = content?.Parent();

            if (parent?.Children() is null || content is null)
            {
                return null;
            }

            var found = false;
            foreach (IPublishedContent sibling in parent.Children())
            {
                if (found)
                {
                    return sibling;
                }

                if (sibling.Id == content.Id)
                {
                    found = true;
                }
            }

            return null;
        }

        public static IPublishedContent Previous(this IPublishedContent content)
        {
            IPublishedContent parent = content?.Parent();

            if (parent?.Children() is null || content is null)
            {
                return null;
            }

            var found = false;
            IPublishedContent last = null;
            foreach (IPublishedContent sibling in parent.Children())
            {
                if (found)
                {
                    return last;
                }

                if (sibling.Id == content.Id)
                {
                    found = true;
                }
                else
                {
                    last = sibling;
                }
            }

            // it could have been at the end
            return found ? last : null;
        }

        /// <summary>
        /// Returns true if there is more than x items
        /// </summary>
        /// <param name="source"></param>
        /// <param name="count"></param>
        /// <returns></returns>
        /// <summary>
        /// Returns true if source has at least <paramref name="count"/> elements efficiently.
        /// </summary>
        /// <remarks>Based on int Enumerable.Count() method.</remarks>
        public static bool HasMoreThan<TSource>(this IEnumerable<TSource> source, int count)
        {
            switch (source)
            {
                case null:
                    throw new ArgumentNullException(nameof(source));
                case ICollection<TSource> collection:
                    return collection.Count > count;
                case ICollection collection2:
                    return collection2.Count > count;
            }

            var num = 0;
            checked
            {
                using IEnumerator<TSource> enumerator = source.GetEnumerator();
                while (enumerator.MoveNext())
                {
                    num++;
                    if (num > count)
                    {
                        return true;
                    }
                }
            }

            return false; // < count
        }

        /// <summary>
        ///     Returns a new list containing the elements of a source sequence in random order.
        /// </summary>
        public static List<T> InRandomOrder<T>(this IEnumerable<T> source)
        {
            ArgumentNullException.ThrowIfNull(source, nameof(source));

            var list = source.ToList();
            list.Shuffle();
            return list;
        }

        /// <summary>
        /// Returns the main rss feed url for this blog
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public static string ArticulateRssUrl(this IMasterModel model) =>
            model.CustomRssFeed.IsNullOrWhiteSpace()
                ? model.RootBlogNode.Url(mode: UrlMode.Absolute).EnsureEndsWith('/') + "rss"
                : model.CustomRssFeed;

        public static string ArticulateCreateBlogEntryUrl(this IMasterModel model) => model.RootBlogNode.Url().EnsureEndsWith('/') + "a-new/";

        /// <summary>
        /// Returns an RSS feed URL specific to this tag
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public static string ArticulateTagRssUrl(this PostsByTagModel model) => model.TagUrl.EnsureEndsWith('/') + "rss";

        /// <summary>
        /// Returns an RSS feed URL specific to this author
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public static string ArticulateAuthorRssUrl(this AuthorModel model) => model.RootBlogNode.Url().EnsureEndsWith('/') + "author/" + model.Id + "/rss";

        /// <summary>
        /// Get the search url without the 'term' query string
        /// </summary>
        /// <param name="model"></param>
        /// <param name="includeDomain"></param>
        /// <returns></returns>
        public static string ArticulateSearchUrl(this IMasterModel model, bool includeDomain = false) =>
            (includeDomain
                ? model.RootBlogNode.Url(mode: UrlMode.Absolute).EnsureEndsWith('/')
                : model.RootBlogNode.Url().EnsureEndsWith('/')) +
            model.RootBlogNode.Value<string>("searchUrlName");

        /// <summary>
        /// The Home Blog Url
        /// </summary>
        public static string ArticulateRootUrl(this IMasterModel model) => model.RootBlogNode.Url();

        /// <summary>
        /// Returns the default categories list URL for blog posts
        /// </summary>
        public static string ArticulateCategoriesUrl(this IMasterModel model) =>
            model.RootBlogNode.Url().EnsureEndsWith('/') +
            model.RootBlogNode.Value<string>("categoriesUrlName");

        /// <summary>
        /// Returns the authors list URL
        /// </summary>
        public static string ArticulateAuthorsUrl(this IMasterModel model) => model.RootBlogNode.ChildrenOfType(ArticulateConstants.ContentType.ArticulateAuthors)?.FirstOrDefault()?.Url();

        /// <summary>
        /// Returns the URL for the tag list
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public static string ArticulateTagsUrl(this IMasterModel model) =>
            model.RootBlogNode.Url().EnsureEndsWith('/') +
            model.RootBlogNode.Value<string>("tagsUrlName");

        /// <summary>
        /// Returns the url for a single tag
        /// </summary>
        /// <param name="model"></param>
        /// <param name="tag"></param>
        /// <returns></returns>
        public static string ArticulateTagUrl(this IMasterModel model, string tag) =>
            model.RootBlogNode.Url().EnsureEndsWith('/') +
            model.RootBlogNode.Value<string>("tagsUrlName")?.EnsureEndsWith('/') +
            tag.SafeEncodeUrlSegments();

        /// <summary>
        /// Returns the url for a single category
        /// </summary>
        /// <param name="model"></param>
        /// <param name="category"></param>
        /// <returns></returns>
        public static string ArticulateCategoryUrl(this IMasterModel model, string category) =>
            model.RootBlogNode.Url().EnsureEndsWith('/') +
            model.RootBlogNode.Value<string>("categoriesUrlName")?.EnsureEndsWith('/') +
            category.SafeEncodeUrlSegments();

        /// <summary>
        /// Renders the Post date with Author details if author details are supplied
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public static IHtmlContent AuthorCitation(this PostModel model)
        {
            var builder = new HtmlContentBuilder();
            _ = builder.AppendHtml("<span>");
            _ = builder.Append("By ");

            // TODO: Check if the current theme has an Author.cshtml theme file otherwise don't render a link!
            // In that case we should have a 'ThemeSupport' class that will check to see what a theme supports.
            if (model.Author.BlogUrl.IsNullOrWhiteSpace())
            {
                _ = builder.Append(model.Author.Name);
            }
            else
            {
                _ = builder.AppendHtml($"""<a href="{model.Author.BlogUrl}">{model.Author.Name}</a>""");
            }

            _ = builder.AppendHtml("&nbsp;on&nbsp;");
            _ = builder.AppendHtml("</span>");

            return builder;
        }

        public static IHtmlContent RenderOpenSearch(this IMasterModel model)
        {
            var openSearchUrl = model.RootBlogNode.Url(mode: UrlMode.Absolute).EnsureEndsWith('/') + "opensearch/" + model.RootBlogNode.Id;
            var tag = $"""<link rel="search" type="application/opensearchdescription+xml" href="{openSearchUrl}" title="Search {model.RootBlogNode.Name}" >""";

            return new HtmlString(tag);
        }

        public static IHtmlContent RssFeed(this IMasterModel model)
        {
            var url = model.CustomRssFeed.IsNullOrWhiteSpace()
                ? model.RootBlogNode.Url(mode: UrlMode.Absolute).EnsureEndsWith('/') + "rss"
                : model.CustomRssFeed;

            return new HtmlString(
                $"""<link rel="alternate" type="application/rss+xml" title="RSS" href="{url}" />""");
        }

        public static IHtmlContent AuthorRssFeed(this AuthorModel model)
        {
            var url = model.ArticulateAuthorRssUrl();

            return new HtmlString(
                $"""<link rel="alternate" type="application/rss+xml" title="RSS" href="{url}" />""");
        }

        public static IHtmlContent AdvertiseWeblogApi(this IMasterModel model)
        {
            var rsdUrl = model.RootBlogNode.Url(mode: UrlMode.Absolute).EnsureEndsWith('/') + "rsd/" + model.RootBlogNode.Id;
            var manifestUrl = model.RootBlogNode.Url(mode: UrlMode.Absolute).EnsureEndsWith('/') + "wlwmanifest/" + model.RootBlogNode.Id;

            return new HtmlString(
                string.Concat(
                    $"""<link type="application/rsd+xml" rel="edituri" title="RSD" href="{rsdUrl}" />""",
                    Environment.NewLine,
                    $"""<link rel="wlwmanifest" type="application/wlwmanifest+xml" href="{manifestUrl}" />"""));
        }

        public static IHtmlContent MetaTags(this IMasterModel model)
        {
            var htmlContent = new HtmlContentBuilder();

            var metaDescriptionTag = new TagBuilder("meta")
            {
                TagRenderMode = TagRenderMode.SelfClosing,
                Attributes = { ["name"] = "description", ["content"] = model.PageDescription },
            };
            _ = htmlContent.AppendHtml(metaDescriptionTag);

            if (string.IsNullOrWhiteSpace(model.PageTags))
            {
                return htmlContent;
            }

            var tagsTag = new TagBuilder("meta")
            {
                TagRenderMode = TagRenderMode.SelfClosing,
                Attributes = { ["name"] = "tags", ["content"] = model.PageTags },
            };
            _ = htmlContent.AppendHtml(tagsTag);

            return htmlContent;
        }

        public static IHtmlContent GoogleAnalyticsTracking(this IMasterModel model)
        {
            var tag = model.RootBlogNode.Value<string>("googleAnalyticsId") ?? string.Empty;
            if (!tag.IsNullOrWhiteSpace())
            {
                return new HtmlString(
                    $$"""
                      <!-- Google Tag Manager -->
                      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                      })(window,document,'script','dataLayer','{{tag}}');</script>
                      <!-- End Google Tag Manager -->
                      """);
            }

            return new HtmlString(string.Empty);
        }

        public static IHtmlContent GoogleAnalyticsNoScript(this IMasterModel model)
        {
            var tag = model.RootBlogNode.Value<string>("googleAnalyticsId") ?? string.Empty;
            if (!tag.IsNullOrWhiteSpace())
            {
                return new HtmlString(
                    $"""
                     <!-- Google Tag Manager (noscript) -->
                     <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={tag}"
                     height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
                     <!-- End Google Tag Manager (noscript) -->
                     """);
            }

            return new HtmlString(string.Empty);
        }

        public static IHtmlContent TagCloud(this PostTagCollection model, decimal maxWeight, int maxResults)
        {
            var tagsAndWeight = model.Select(x => new { tag = x, weight = model.GetTagWeight(x, maxWeight) })
                .OrderByDescending(x => x.weight)
                .Take(maxResults).InRandomOrder();

            var ul = new TagBuilder("ul");
            ul.AddCssClass("tag-cloud");
            foreach (var tag in tagsAndWeight)
            {
                var a = new TagBuilder("a");
                a.MergeAttribute("href", tag.tag.TagUrl);
                a.MergeAttribute("title", tag.tag.TagName);
                _ = a.InnerHtml.SetContent(tag.tag.TagName);

                var li = new TagBuilder("li");
                li.AddCssClass("tag-cloud-" + tag.weight);
                _ = li.InnerHtml.AppendHtml(a);

                _ = ul.InnerHtml.AppendHtml(li);
            }

            return ul;
        }

        public static IHtmlContent TagCloud(this PostTagCollection model, Func<PostsByTagModel, HelperResult> tagLink, decimal maxWeight, int maxResults)
            => new HelperResult(writer =>
            {
                var tagsAndWeight = model.Select(x => new { tag = x, weight = model.GetTagWeight(x, maxWeight) })
                    .OrderByDescending(x => x.weight)
                    .Take(maxResults).InRandomOrder();

                var ul = new TagBuilder("ul");
                ul.AddCssClass("tag-cloud");
                foreach (var tag in tagsAndWeight)
                {
                    var li = new TagBuilder("li");
                    li.AddCssClass("tag-cloud-" + tag.weight);

                    _ = li.InnerHtml.AppendHtml(tagLink(tag.tag));

                    _ = ul.InnerHtml.AppendHtml(li);
                }

                ul.WriteTo(writer, HtmlEncoder.Default);

                return Task.CompletedTask;
            });

        public static IHtmlContent ListTags(this PostModel model, Func<string, HelperResult> tagLink, string delimiter = ", ") => ListCategoriesOrTags(model.Tags.ToArray(), tagLink, delimiter);

        public static IHtmlContent ListCategories(this PostModel model, Func<string, HelperResult> tagLink, string delimiter = ", ") => ListCategoriesOrTags(model.Categories.ToArray(), tagLink, delimiter);

        public static void SocialMetaTags(this IPublishedContent model, IHtmlContentBuilder builder)
        {
            var twitterTag = new TagBuilder("meta")
            {
                TagRenderMode = TagRenderMode.StartTag,
                Attributes =
                {
                    ["name"] = "twitter:card", ["content"] = "summary"
                }, // non-closing since that's just the way it is
            };
            _ = builder.AppendHtml(twitterTag);

            var openGraphTitle = new TagBuilder("meta")
            {
                TagRenderMode = TagRenderMode.SelfClosing,
                Attributes = { ["property"] = "og:title", ["content"] = model.Name },
            };
            _ = builder.AppendHtml(openGraphTitle);

            var openGraphType = new TagBuilder("meta")
            {
                TagRenderMode = TagRenderMode.SelfClosing,
                Attributes = { ["property"] = "og:type", ["content"] = "article" },
            };
            _ = builder.AppendHtml(openGraphType);

            var openGraphUrl = new TagBuilder("meta")
            {
                TagRenderMode = TagRenderMode.SelfClosing,
                Attributes = { ["property"] = "og:url", ["content"] = model.Url(mode: UrlMode.Absolute) },
            };
            _ = builder.AppendHtml(openGraphUrl);
        }

        public static void PostSocialMetaTags(PostModel model, HttpRequest request)
        {
            var builder = new HtmlContentBuilder();
            PostSocialMetaTags(model, request, builder);
        }

        public static void PostSocialMetaTags(PostModel model, HttpRequest request, IHtmlContentBuilder builder)
        {
            if (!model.CroppedPostImageUrl.IsNullOrWhiteSpace())
            {
                var openGraphImage = new TagBuilder("meta")
                {
                    TagRenderMode = TagRenderMode.SelfClosing,
                    Attributes =
                    {
                        ["property"] = "og:image", ["content"] = GetDomain(request) + model.CroppedPostImageUrl
                    },
                };

                _ = builder.AppendHtml(openGraphImage);
            }

            if (model.SocialMetaDescription.IsNullOrWhiteSpace() && model.Excerpt.IsNullOrWhiteSpace())
            {
                return;
            }

            var openGraphDesc = new TagBuilder("meta")
            {
                TagRenderMode = TagRenderMode.SelfClosing,
                Attributes =
                {
                    ["property"] = "og:description", ["content"] = model.SocialMetaDescription.IsNullOrWhiteSpace() ? model.Excerpt : model.SocialMetaDescription
                },
            };

            _ = builder.AppendHtml(openGraphDesc);
        }

        public static IPublishedContent[] GetListNodes(IMasterModel masterModel)
        {
            IPublishedContent[] listNodes = masterModel.RootBlogNode.ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.ToArray();
            if (listNodes?.Length == 0)
            {
                throw new InvalidOperationException(
                    "An ArticulateArchive document must exist under the root Articulate document");
            }

            return listNodes;
        }

        public static IHtmlContent ListCategoriesOrTags(string[] items, Func<string, HelperResult> tagLink, string delimiter)
            => new HelperResult(writer =>
            {
                foreach (var tag in items)
                {
                    tagLink(tag).WriteTo(writer, HtmlEncoder.Default);
                    if (tag == items[^1])
                    {
                        continue;
                    }

                    writer.Write("<span>");
                    writer.Write(delimiter);
                    writer.Write("</span>");
                }

                return Task.CompletedTask;
            });

        public static IHtmlContent Table<T>(
            this IEnumerable<T> collection,
            string[] headers,
            string[] cssClasses,
            params Func<T, HelperResult>[] cellTemplates)
            where T : class => Table(collection, new Dictionary<string, object>(), headers, cssClasses, cellTemplates);

        public static IHtmlContent Table<T>(
            this IEnumerable<T> collection,
            object htmlAttributes,
            string[] headers,
            string[] cssClasses,
            params Func<T, HelperResult>[] cellTemplates)
            where T : class
            => new HelperResult(writer =>
            {
                T[] items = collection.ToArray();
                var rows = items.Length;
                var cols = headers.Length;
                if (cellTemplates.Length != cols)
                {
                    throw new InvalidOperationException("The number of cell templates must equal the number of columns defined");
                }

                var table = new TagBuilder("table");
                if (htmlAttributes is not null)
                {
                    IDictionary<string, object> attrs = HtmlHelper.AnonymousObjectToHtmlAttributes(htmlAttributes) ?? new Dictionary<string, object>();
                    if (attrs.Any())
                    {
                        table.MergeAttributes(attrs);
                    }
                }

                var thead = new TagBuilder("thead");
                var tr = new TagBuilder("tr");

                for (var i = 0; i < cols; i++)
                {
                    var th = new TagBuilder("th");
                    th.AddCssClass(cssClasses.Length - 1 >= 1 ? cssClasses[i] : string.Empty);
                    _ = th.InnerHtml.SetContent(headers[i]);
                    _ = tr.InnerHtml.AppendHtml(th);
                }

                _ = thead.InnerHtml.AppendHtml(tr);

                _ = table.InnerHtml.AppendHtml(thead);

                var tbody = new TagBuilder("tbody");
                for (var rowIndex = 0; rowIndex < rows; rowIndex++)
                {
                    var trContent = new TagBuilder("tr");

                    for (var colIndex = 0; colIndex < cols; colIndex++)
                    {
                        var tdContent = new TagBuilder("td");
                        tdContent.AddCssClass(cssClasses.Length - 1 >= 1 ? cssClasses[colIndex] : string.Empty);

                        T item = items[rowIndex];
                        if (item != null)
                        {
                            // if there's an item at that grid location, call its template
                            _ = tdContent.InnerHtml.SetHtmlContent(cellTemplates[colIndex](item));

                            // cellTemplates[colIndex](item).WriteTo(writer, HtmlEncoder.Default);
                        }

                        _ = trContent.InnerHtml.AppendHtml(tdContent);
                    }

                    _ = tbody.InnerHtml.AppendHtml(trContent);
                }

                _ = table.InnerHtml.AppendHtml(tbody);

                table.WriteTo(writer, HtmlEncoder.Default);
                return Task.CompletedTask;
            });

        /// <summary>
        /// Get the full domain of the current page.
        /// </summary>
        private static string GetDomain(this HttpRequest request) => $"{request.Scheme}{Uri.SchemeDelimiter}{request.Host.Value}";

        /// <summary>
        ///     Shuffles a List&lt;T&gt; in-place.
        /// </summary>
        private static void Shuffle<T>(this List<T> list)
        {
            if (list is not null)
            {
                Random rng = Random.Shared;
                for (var i = list.Count - 1; i >= 1; i--)
                {
                    var j = rng.Next(i + 1);
                    (list[i], list[j]) = (list[j], list[i]);
                }
            }
            else
            {
                throw new ArgumentNullException(nameof(list));
            }
        }
     }
}
