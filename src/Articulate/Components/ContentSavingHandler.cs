#nullable enable
using Articulate.Options;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace Articulate.Components
{
    public sealed class ContentSavingHandler(
        IContentTypeService contentTypeService,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        IOptions<ArticulateOptions> articulateOptions,
        IAbsoluteUrlBuilder absoluteUrlBuilder)
        : INotificationHandler<ContentSavingNotification>
    {
        private readonly ArticulateOptions _articulateOptions = articulateOptions.Value;
        private readonly IAbsoluteUrlBuilder _absoluteUrlBuilder = absoluteUrlBuilder;

        /// <inheritdoc/>
        public void Handle(ContentSavingNotification notification)
        {
            var saved = notification.SavedEntities.ToList();
            if (saved.Count == 0)
            {
                return;
            }

            var contentTypes = contentTypeService.GetMany(saved.Select(x => x.ContentTypeId).ToArray()).ToDictionary(x => x.Id);

            foreach (IContent content in saved)
            {
                IContentType contentType = contentTypes[content.ContentTypeId];

                if (IsArticulatePost(content))
                {
                    SetPostDefaults(content, contentType);
                    NormalizeContentUrls(content, contentType);

                    if (_articulateOptions.AutoGenerateExcerpt)
                    {
                        GenerateExcerptIfNeeded(content, contentType);
                    }
                }
                else if (IsArticulateRoot(content))
                {
                    SetArticulateRootDefaults(content, contentType);
                }
            }
        }

        private static bool IsArticulatePost(IContent content) =>
            content.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateRichText) ||
            content.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateMarkdown);

        private static bool IsArticulateRoot(IContent content) =>
            content.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate);

        private void SetPostDefaults(IContent content, IContentType contentType)
        {
            // Set publishedDate if not already set
            content.SetAllPropertyCultureValues(
                "publishedDate",
                contentType,
                (c, _, culture) => c.GetValue("publishedDate", culture?.Culture) is null ? (DateTime?)DateTime.Now : null);

            // Set author if not already set
            content.SetAllPropertyCultureValues(
                "author",
                contentType,
                (c, _, culture) => c.GetValue("author", culture?.Culture) is null ? backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser?.Name : null);

            // Set enableComments default for new content
            if (!content.HasIdentity)
            {
                content.SetAllPropertyCultureValues(
                    "enableComments",
                    contentType,
                    (_, _, _) => 1);
            }
        }

        private void GenerateExcerptIfNeeded(IContent content, IContentType contentType)
        {
            // Generate excerpt from richText or markdown if not already set
            content.SetAllPropertyCultureValues(
                "excerpt",
                contentType,
                (c, ct, culture) =>
                {
                    var currentExcerpt = c.GetValue("excerpt", culture?.Culture)?.ToString();
                    if (!currentExcerpt.IsNullOrWhiteSpace())
                    {
                        return null;
                    }

                    return GenerateExcerptFromContent(c, ct, culture);
                });

            // Set socialDescription from excerpt if not already set
            if (content.HasProperty("socialDescription"))
            {
                content.SetAllPropertyCultureValues(
                    "socialDescription",
                    contentType,
                    (c, ct, culture) =>
                    {
                        var currentSocialDescription = c.GetValue("socialDescription", culture?.Culture)?.ToString();
                        if (!currentSocialDescription.IsNullOrWhiteSpace())
                        {
                            return null;
                        }

                        IPropertyType excerptProperty = ct.CompositionPropertyTypes.First(x => x.Alias == "excerpt");
                        return c.GetValue<string>("excerpt", excerptProperty.VariesByCulture() ? culture?.Culture : null);
                    });
            }
        }

        private string GenerateExcerptFromContent(IContentBase content, IContentTypeComposition contentType, ContentCultureInfos? culture)
        {
            if (content.HasProperty("richText"))
            {
                IPropertyType richTextProperty = contentType.CompositionPropertyTypes.First(x => x.Alias == "richText");
                var val = content.GetValue<string>("richText", richTextProperty.VariesByCulture() ? culture?.Culture : null);
                return string.IsNullOrWhiteSpace(val) ? string.Empty : _articulateOptions.GenerateExcerpt(val);
            }

            if (content.HasProperty("markdown"))
            {
                IPropertyType markdownProperty = contentType.CompositionPropertyTypes.First(x => x.Alias == "markdown");
                var val = content.GetValue<string>("markdown", markdownProperty.VariesByCulture() ? culture?.Culture : null);
                if (string.IsNullOrWhiteSpace(val))
                {
                    return string.Empty;
                }

                var html = MarkdownHelper.ToHtml(val);
                return _articulateOptions.GenerateExcerpt(html);
            }

            return string.Empty;
        }

        private void SetArticulateRootDefaults(IContent content, IContentType contentType)
        {
            SetPropertyDefault(content, contentType, "theme", "VAPOR");
            SetPropertyDefault(content, contentType, "pageSize", 10);
            SetPropertyDefault(content, contentType, "categoriesUrlName", "categories");
            SetPropertyDefault(content, contentType, "tagsUrlName", "tags");
            SetPropertyDefault(content, contentType, "searchUrlName", "search");
            SetPropertyDefault(content, contentType, "categoriesPageName", "Categories");
            SetPropertyDefault(content, contentType, "tagsPageName", "Tags");
            SetPropertyDefault(content, contentType, "searchPageName", "Search results");
        }

        private static void SetPropertyDefault(IContent content, IContentType contentType, string propertyAlias, object defaultValue)
        {
            if (!content.HasProperty(propertyAlias))
            {
                return;
            }

            content.SetAllPropertyCultureValues(
                propertyAlias,
                contentType,
                (c, _, culture) =>
                {
                    var current = c.GetValue(propertyAlias, culture?.Culture)?.ToString();
                    return current.IsNullOrWhiteSpace() ? defaultValue : null;
                });
        }

        /// <summary>
        /// Normalizes all URLs in richText and markdown content to absolute URLs.
        /// This ensures consistency for RSS feeds, email notifications, and URL comparison logic.
        /// Handles both manual backoffice edits and programmatic saves.
        /// </summary>
        private void NormalizeContentUrls(IContent content, IContentType contentType)
        {
            // Normalize richText content (HTML)
            if (content.HasProperty("richText"))
            {
                content.SetAllPropertyCultureValues(
                    "richText",
                    contentType,
                    (c, ct, culture) =>
                    {
                        IPropertyType richTextProperty = ct.CompositionPropertyTypes.First(x => x.Alias == "richText");
                        var html = c.GetValue<string>("richText", richTextProperty.VariesByCulture() ? culture?.Culture : null);

                        if (string.IsNullOrWhiteSpace(html))
                        {
                            return null; // Don't modify if empty
                        }

                        var normalized = NormalizeHtmlUrls(html);

                        // Only update if changed
                        return normalized != html ? normalized : null;
                    });
            }

            // Normalize markdown content
            if (content.HasProperty("markdown"))
            {
                content.SetAllPropertyCultureValues(
                    "markdown",
                    contentType,
                    (c, ct, culture) =>
                    {
                        IPropertyType markdownProperty = ct.CompositionPropertyTypes.First(x => x.Alias == "markdown");
                        var markdown = c.GetValue<string>("markdown", markdownProperty.VariesByCulture() ? culture?.Culture : null);

                        if (string.IsNullOrWhiteSpace(markdown))
                        {
                            return null; // Don't modify if empty
                        }

                        var normalized = NormalizeMarkdownUrls(markdown);

                        // Only update if changed
                        return normalized != markdown ? normalized : null;
                    });
            }
        }

        /// <summary>
        /// Normalizes URLs in HTML content (richText property).
        /// Converts relative URLs in src and href attributes to absolute URLs.
        /// </summary>
        private string NormalizeHtmlUrls(string html)
        {
            // Normalize <img src="..."> attributes
            html = System.Text.RegularExpressions.Regex.Replace(
                html,
                @"(<img[^>]+src\s*=\s*[""'])([^""']+)([""'][^>]*>)",
                match =>
                {
                    var prefix = match.Groups[1].Value;
                    var url = match.Groups[2].Value;
                    var suffix = match.Groups[3].Value;

                    var absoluteUrl = _absoluteUrlBuilder.ToAbsoluteUrl(url).ToString();
                    return prefix + absoluteUrl + suffix;
                },
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            // Normalize <a href="..."> attributes
            html = System.Text.RegularExpressions.Regex.Replace(
                html,
                @"(<a[^>]+href\s*=\s*[""'])([^""']+)([""'][^>]*>)",
                match =>
                {
                    var prefix = match.Groups[1].Value;
                    var url = match.Groups[2].Value;
                    var suffix = match.Groups[3].Value;

                    var absoluteUrl = _absoluteUrlBuilder.ToAbsoluteUrl(url).ToString();
                    return prefix + absoluteUrl + suffix;
                },
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            return html;
        }

        /// <summary>
        /// Normalizes URLs in Markdown content.
        /// Converts relative URLs in image and link syntax to absolute URLs.
        /// </summary>
        private string NormalizeMarkdownUrls(string markdown)
        {
            // Normalize markdown images: ![alt](url)
            markdown = System.Text.RegularExpressions.Regex.Replace(
                markdown,
                @"(!\[[^\]]*\]\()([^)]+)(\))",
                match =>
                {
                    var prefix = match.Groups[1].Value;
                    var url = match.Groups[2].Value;
                    var suffix = match.Groups[3].Value;

                    var absoluteUrl = _absoluteUrlBuilder.ToAbsoluteUrl(url).ToString();
                    return prefix + absoluteUrl + suffix;
                });

            // Normalize markdown links: [text](url) - but skip if it looks like an anchor (#heading)
            markdown = System.Text.RegularExpressions.Regex.Replace(
                markdown,
                @"(\[[^\]]+\]\()([^)#][^)]*)(\))",
                match =>
                {
                    var prefix = match.Groups[1].Value;
                    var url = match.Groups[2].Value;
                    var suffix = match.Groups[3].Value;

                    // Skip mailto: and external URLs that are already absolute
                    if (url.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase) ||
                        url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                        url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        return match.Value; // Already absolute or special protocol
                    }

                    var absoluteUrl = _absoluteUrlBuilder.ToAbsoluteUrl(url).ToString();
                    return prefix + absoluteUrl + suffix;
                });

            return markdown;
        }
    }
}
