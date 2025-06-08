using System;
using System.Linq;
using Articulate.Options;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace Articulate.Components
{

    public sealed class ContentSavingHandler : INotificationHandler<ContentSavingNotification>
    {
        private readonly IContentTypeService _contentTypeService;
        private readonly IUmbracoContextAccessor _umbracoContextAccessor;
        private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;
        private readonly ArticulateOptions _articulateOptions;

        public ContentSavingHandler(
            IContentTypeService contentTypeService,
            IUmbracoContextAccessor umbracoContextAccessor,
            IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
            IOptions<ArticulateOptions> articulateOptions)
        {
            _contentTypeService = contentTypeService;
            _umbracoContextAccessor = umbracoContextAccessor;
            _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
            _articulateOptions = articulateOptions.Value;
        }

        public void Handle(ContentSavingNotification notification)
        {
            var saved = notification.SavedEntities.ToList();
            if (saved.Count == 0) return;

            var contentTypes = _contentTypeService.GetMany(saved.Select(x => x.ContentTypeId).ToArray()).ToDictionary(x => x.Id);
            foreach (var content in saved)
            {
                if (content.ContentType.Alias.InvariantEquals("ArticulateRichText")
                    || content.ContentType.Alias.InvariantEquals("ArticulateMarkdown"))

                {
                    content.SetAllPropertyCultureValues(
                        "publishedDate",
                        contentTypes[content.ContentTypeId],
                        // if the publishedDate is not already set, then set it 
                        (c, ct, culture) => c.GetValue("publishedDate", culture?.Culture) == null ? (DateTime?)DateTime.Now : null);

                    content.SetAllPropertyCultureValues(
                        "author",
                        contentTypes[content.ContentTypeId],
                        // if the author is not already set, then set it 
                        (c, ct, culture) => c.GetValue("author", culture?.Culture) == null ? _backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser?.Name : null);

                    if (!content.HasIdentity)
                    {
                        // default values
                        content.SetAllPropertyCultureValues(
                            "enableComments",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) => 1);
                    }
                }

                if (_articulateOptions.AutoGenerateExcerpt)
                {
                    if (content.ContentType.Alias.InvariantEquals("ArticulateRichText")
                        || content.ContentType.Alias.InvariantEquals("ArticulateMarkdown"))
                    {

                        // fill in the excerpt if it is empty
                        content.SetAllPropertyCultureValues(
                            "excerpt",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var currentExcerpt = c.GetValue("excerpt", culture?.Culture)?.ToString();
                                if (!currentExcerpt.IsNullOrWhiteSpace()) return null;

                                if (content.HasProperty("richText"))
                                {
                                    var richTextProperty = ct.CompositionPropertyTypes.First(x => x.Alias == "richText");
                                    var val = c.GetValue<string>("richText", richTextProperty.VariesByCulture() ? culture?.Culture : null);
                                    return _articulateOptions.GenerateExcerpt(val);
                                }
                                else
                                {
                                    var markdownProperty = ct.CompositionPropertyTypes.First(x => x.Alias == "markdown");
                                    var val = c.GetValue<string>("markdown", markdownProperty.VariesByCulture() ? culture?.Culture : null);
                                    var html = MarkdownHelper.ToHtml(val);
                                    return _articulateOptions.GenerateExcerpt(html);
                                }
                            });

                        //now fill in the social description if it is empty with the excerpt
                        if (content.HasProperty("socialDescription"))
                        {
                            content.SetAllPropertyCultureValues(
                                "socialDescription",
                                contentTypes[content.ContentTypeId],
                                (c, ct, culture) =>
                                {
                                    // don't set it if it's already set
                                    var currentSocialDescription = c.GetValue("socialDescription", culture?.Culture)?.ToString();
                                    if (!currentSocialDescription.IsNullOrWhiteSpace()) return null;

                                    var excerptProperty = ct.CompositionPropertyTypes.First(x => x.Alias == "excerpt");
                                    return content.GetValue<string>("excerpt", excerptProperty.VariesByCulture() ? culture?.Culture : null);
                                });
                        }
                    }
                }

                if (content.ContentType.Alias.InvariantEquals(ArticulateConstants.ArticulateContentTypeAlias))
                {
                    if (content.HasProperty("theme"))
                    {
                        content.SetAllPropertyCultureValues(
                            "theme",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var current = c.GetValue("theme", culture?.Culture)?.ToString();
                                if (!current.IsNullOrWhiteSpace())
                                    return null;

                                return "VAPOR";
                            });
                    }

                    if (content.HasProperty("pageSize"))
                    {
                        content.SetAllPropertyCultureValues(
                            "pageSize",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var current = c.GetValue("pageSize", culture?.Culture)?.ToString();
                                if (!current.IsNullOrWhiteSpace())
                                    return null;

                                return 10;
                            });
                    }

                    if (content.HasProperty("categoriesUrlName"))
                    {
                        content.SetAllPropertyCultureValues(
                            "categoriesUrlName",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var current = c.GetValue("categoriesUrlName", culture?.Culture)?.ToString();
                                if (!current.IsNullOrWhiteSpace())
                                    return null;

                                return "categories";
                            });
                    }

                    if (content.HasProperty("tagsUrlName"))
                    {
                        content.SetAllPropertyCultureValues(
                            "tagsUrlName",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var current = c.GetValue("tagsUrlName", culture?.Culture)?.ToString();
                                if (!current.IsNullOrWhiteSpace())
                                    return null;

                                return "tags";
                            });
                    }

                    if (content.HasProperty("searchUrlName"))
                    {
                        content.SetAllPropertyCultureValues(
                            "searchUrlName",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var current = c.GetValue("searchUrlName", culture?.Culture)?.ToString();
                                if (!current.IsNullOrWhiteSpace())
                                    return null;

                                return "search";
                            });
                    }

                    if (content.HasProperty("categoriesPageName"))
                    {
                        content.SetAllPropertyCultureValues(
                            "categoriesPageName",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var current = c.GetValue("categoriesPageName", culture?.Culture)?.ToString();
                                if (!current.IsNullOrWhiteSpace())
                                    return null;

                                return "Categories";
                            });
                    }

                    if (content.HasProperty("tagsPageName"))
                    {
                        content.SetAllPropertyCultureValues(
                            "tagsPageName",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var current = c.GetValue("tagsPageName", culture?.Culture)?.ToString();
                                if (!current.IsNullOrWhiteSpace())
                                    return null;

                                return "Tags";
                            });
                    }

                    if (content.HasProperty("searchPageName"))
                    {
                        content.SetAllPropertyCultureValues(
                            "searchPageName",
                            contentTypes[content.ContentTypeId],
                            (c, ct, culture) =>
                            {
                                // don't set it if it's already set
                                var current = c.GetValue("searchPageName", culture?.Culture)?.ToString();
                                if (!current.IsNullOrWhiteSpace())
                                    return null;

                                return "Search results";
                            });
                    }

                }

            }
        }
    }
}
