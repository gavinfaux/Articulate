#nullable enable
using System.Text.Encodings.Web;
using Articulate.Models;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace Articulate
{
    public static class HtmlHelperExtensions
    {
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
                SocialMetaTags(html, postModel, builder);
            }

            return builder;
        }

        /// <summary>
        /// Adds blog post social meta tags
        /// </summary>
        /// <param name="html"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        /// <remarks>
        /// Would be nice to add the Standard Template but need to get more author info in there
        /// </remarks>
        public static IHtmlContent SocialMetaTags(this IHtmlHelper html, PostModel model)
        {
            var builder = new HtmlContentBuilder();

            model.SocialMetaTags(builder);
            SocialMetaTags(html, model, builder);

            return builder;
        }

        private static void SocialMetaTags(this IHtmlHelper html, PostModel model, IHtmlContentBuilder builder)
        {
            if (!model.CroppedPostImageUrl.IsNullOrWhiteSpace())
            {
                var openGraphImage = new TagBuilder("meta")
                {
                    TagRenderMode = TagRenderMode.SelfClosing
                };
                openGraphImage.Attributes["property"] = "og:image";
                openGraphImage.Attributes["content"] = PathHelper.GetDomain(html.ViewContext.HttpContext.Request) + model.CroppedPostImageUrl;

                builder.AppendHtml(openGraphImage);
            }

            if (!model.SocialMetaDescription.IsNullOrWhiteSpace() || !model.Excerpt.IsNullOrWhiteSpace())
            {
                var openGraphDesc = new TagBuilder("meta")
                {
                    TagRenderMode = TagRenderMode.SelfClosing
                };
                openGraphDesc.Attributes["property"] = "og:description";
                openGraphDesc.Attributes["content"] = model.SocialMetaDescription.IsNullOrWhiteSpace() ? model.Excerpt : model.SocialMetaDescription;

                builder.AppendHtml(openGraphDesc);
            }
        }


        public static IHtmlContent ListCategoriesOrTags(this string[] items, Func<string, HelperResult> tagLink, string delimiter)
            => new HelperResult(writer =>
                {
                    foreach (var tag in items)
                    {
                        tagLink(tag).WriteTo(writer, HtmlEncoder.Default);
                        if (tag != items.Last())
                        {
                            writer.Write("<span>");
                            writer.Write(delimiter);
                            writer.Write("</span>");
                        }
                    }

                    return Task.CompletedTask;
                });

        /// <summary>
        /// Creates an Html table based on the collection
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="collection"></param>
        /// <param name="headers"></param>
        /// <param name="cssClasses"></param>
        /// <param name="cellTemplates"></param>
        /// <returns></returns>
        public static IHtmlContent Table<T>(
            this IEnumerable<T> collection,
            string[] headers,
            string[] cssClasses,
            params Func<T, HelperResult>[] cellTemplates) where T : class => Table(collection, null, headers, cssClasses, cellTemplates);

        /// <summary>
        /// Creates an Html table based on the collection
        /// </summary>
        public static IHtmlContent Table<T>(
            this IEnumerable<T> collection,
            object? htmlAttributes,
            string[] headers,
            string[] cssClasses,
            params Func<T, HelperResult>[] cellTemplates) where T : class
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
                        IDictionary<string, object?> atts = HtmlHelper.AnonymousObjectToHtmlAttributes(htmlAttributes);
                        table.MergeAttributes(atts);
                    }

                    var thead = new TagBuilder("thead");
                    var tr = new TagBuilder("tr");

                    for (var i = 0; i < cols; i++)
                    {
                        var th = new TagBuilder("th");
                        th.AddCssClass(cssClasses.Length - 1 >= 1 ? cssClasses[i] : string.Empty);
                        th.InnerHtml.SetContent(headers[i]);
                        tr.InnerHtml.AppendHtml(th);
                    }

                    thead.InnerHtml.AppendHtml(tr);

                    table.InnerHtml.AppendHtml(thead);

                    var tbody = new TagBuilder("tbody");
                    for (var rowIndex = 0; rowIndex < rows; rowIndex++)
                    {
                        var trContent = new TagBuilder("tr");

                        for (var colIndex = 0; colIndex < cols; colIndex++)
                        {
                            var tdContent = new TagBuilder("td");
                            tdContent.AddCssClass(cssClasses.Length - 1 >= 1 ? cssClasses[colIndex] : string.Empty);

                            T item = items[rowIndex];
                            //if there's an item at that grid location, call its template
                            tdContent.InnerHtml.SetHtmlContent(cellTemplates[colIndex](item));

                            //cellTemplates[colIndex](item).WriteTo(writer, HtmlEncoder.Default);

                            trContent.InnerHtml.AppendHtml(tdContent);
                        }

                        tbody.InnerHtml.AppendHtml(trContent);
                    }

                    table.InnerHtml.AppendHtml(tbody);

                    table.WriteTo(writer, HtmlEncoder.Default);
                    return Task.CompletedTask;
                });
    }
}
