namespace Articulate.ImportExport;

/// <summary>
/// An intentional import rejection with a message safe to show to the operator.
/// </summary>
internal sealed class BlogMlImportException(string message) : InvalidOperationException(message);
