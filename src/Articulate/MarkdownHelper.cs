#nullable enable
using Markdig;

namespace Articulate
{
    public static class MarkdownHelper
    {
        private static readonly MarkdownPipeline _sMarkdownPipeline = new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .Build();

        public static string ToHtml(string? input) => string.IsNullOrWhiteSpace(input) ? string.Empty : Markdown.ToHtml(input, _sMarkdownPipeline);
    }
}
