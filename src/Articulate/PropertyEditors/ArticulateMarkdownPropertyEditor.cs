#nullable enable
using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{
    // TODO: Remove this when HeyRed is replaced with Markdig package in Umbraco 18
    /// <summary>
    /// Property editor for the Articulate Markdown editor.
    /// </summary>
    [DataEditor(
        ArticulateConstants.DataType.ArticulateMarkdownEditor,
        ValueType = ValueTypes.Text,
        ValueEditorIsReusable = false)]
    public class ArticulateMarkdownPropertyEditor(IDataValueEditorFactory dataValueEditorFactor)
        : MarkdownPropertyEditor(dataValueEditorFactor);
}
