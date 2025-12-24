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
