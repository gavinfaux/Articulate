#nullable enable
using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{
    // TODO: Replace with Umbraco.MarkdownEditor if/when #19500 PR made and accepted and merged into Umbraco.Cms.Core (v17+)
    [DataEditor(ArticulateConstants.DataType.ArticulateMarkdownEditor, ValueType = ValueTypes.Text, ValueEditorIsReusable = false)]
    public class ArticulateMarkdownPropertyEditor(IDataValueEditorFactory dataValueEditorFactor)
        : MarkdownPropertyEditor(dataValueEditorFactor);
}
