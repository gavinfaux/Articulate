#nullable enable
using Articulate.Services;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PropertyEditors.ValueConverters;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Templates;

namespace Articulate.PropertyEditors
{
    public class ArticulateMarkdownEditorValueConverter(HtmlLocalLinkParser localLinkParser, HtmlUrlParser urlParser)
        : MarkdownEditorValueConverter(localLinkParser, urlParser)
    {
        public override bool IsConverter(IPublishedPropertyType propertyType)
            => propertyType.EditorUiAlias.Equals("Articulate.MarkdownEditor");

        public override object ConvertIntermediateToObject(
            IPublishedElement owner,
            IPublishedPropertyType propertyType,
            PropertyCacheLevel referenceCacheLevel,
            object? inter,
            bool preview)
        {
            var md = inter as string;
            return new HtmlEncodedString(inter is null ? string.Empty : MarkdownHelper.ToHtml(md));
        }
    }
}
