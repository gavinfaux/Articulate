#nullable enable
using Markdig;
using Umbraco.Cms.Core.Security;

namespace Articulate.Services
{
    public class MarkdownService(IHtmlSanitizer htmlSanitizer) : IMarkdownToHtmlConverter
    {
        private readonly MarkdownPipeline _markdownPipeline = new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .Build();

        // TODO: Consider centralizing HTML sanitization across all content types.
        // Currently only Markdown content is sanitized via IHtmlSanitizer.
        // Future enhancement: Create IArticulateContentRenderer service to sanitize
        // both Markdown and RichText (MetaWebLog/BlogML imports) consistently.
        // This would require a centralized rendering service to avoid performance overhead on every save.
        public string ToHtml(string markdown)
        {
            if (string.IsNullOrWhiteSpace(markdown))
            {
                return string.Empty;
            }

            var html = Markdown.ToHtml(markdown, _markdownPipeline);
            return htmlSanitizer.Sanitize(html);
        }
    }
}
