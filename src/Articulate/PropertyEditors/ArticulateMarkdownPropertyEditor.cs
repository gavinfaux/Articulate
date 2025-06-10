// // TODO: Replace with Umbraco.MarkdownEditor if/when #19500 #19501 accepted and merged into Umbraco.Cms.Core

// // TODO: Copy \Umbraco.Web.UI.Client\src\packages\markdown-editor as our own 'Articulate' editor, else this does nothing by itself

using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PropertyEditors.ValueConverters;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Templates;

namespace Articulate.PropertyEditors
{

    [DataEditor("Articulate.MarkdownEditor", ValueType = ValueTypes.Text,
        ValueEditorIsReusable = true)]
    public class ArticulateMarkdownPropertyEditor(IDataValueEditorFactory dataValueEditorFactor)
        : MarkdownPropertyEditor(dataValueEditorFactor)
    {
    }

    // using a reasonable Markdown converter
    public class ArticulateMarkdownEditorValueConverter(HtmlLocalLinkParser localLinkParser, HtmlUrlParser urlParser)
        : MarkdownEditorValueConverter(localLinkParser, urlParser)
    {
        public override bool IsConverter(IPublishedPropertyType propertyType)
            => "Articulate.MarkdownEditor" == propertyType.EditorAlias;

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
