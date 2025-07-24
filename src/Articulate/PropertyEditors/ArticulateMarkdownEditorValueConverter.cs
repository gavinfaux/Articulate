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
            => "Articulate.MarkdownEditor" == propertyType.EditorUiAlias;

        public override object ConvertIntermediateToObject(
            IPublishedElement owner,
            IPublishedPropertyType propertyType,
            PropertyCacheLevel referenceCacheLevel,
            object inter,
            bool preview)
        {
            var md = (string)inter;
            return new HtmlEncodedString((inter == null) ? string.Empty : MarkdownHelper.ToHtml(md));
        }
    }
}
