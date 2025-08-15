#nullable enable
using Articulate.Services;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PropertyEditors.ValueConverters;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Templates;

namespace Articulate.Api.Management.PropertyEditors
{
    // Full clone of src/Umbraco.Web.UI.Client/src/packages/markdown-editor
    // Prevent conflicts if both Markdown Editors on content type
    // TODO: Remove this when the Markdig package is merged into Umbraco
    //See: https://github.com/umbraco/Umbraco-CMS/pull/19500
    public class ArticulateMarkdownEditorValueConverter(HtmlLocalLinkParser localLinkParser, HtmlUrlParser urlParser)
        : MarkdownEditorValueConverter(localLinkParser, urlParser)
    {
        public override bool IsConverter(IPublishedPropertyType propertyType)

            // Maps to alias: \Client\src\packages\articulate-markdown-editor\property-editors\markdown-editor\Articulate.MarkdownEditor.ts
            => propertyType.EditorUiAlias.Equals(ArticulateConstants.DataType.ArticulateMarkdownEditor) || propertyType.EditorAlias.Equals(ArticulateConstants.DataType.ArticulateMarkdownEditor);

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
