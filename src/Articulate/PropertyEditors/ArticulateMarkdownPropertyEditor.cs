#nullable enable
using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{
    // Keep this editor while supported Umbraco versions still expose the legacy Markdown editor shape.
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
