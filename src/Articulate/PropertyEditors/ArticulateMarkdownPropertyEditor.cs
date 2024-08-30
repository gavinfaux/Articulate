using System;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PropertyEditors.ValueConverters;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Templates;

namespace Articulate.PropertyEditors
{
    [DataEditor("Articulate.MarkdownEditor", IsDeprecated = false, ValueEditorIsReusable = false,  ValueType = ValueTypes.Text)]
    public class ArticulateMarkdownPropertyEditor(IDataValueEditorFactory dataValueEditorFactory)
        : MarkdownPropertyEditor(dataValueEditorFactory);

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
