using AngleSharp.Html.Dom;
using Ganss.Xss;
using Markdig;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Configuration.Models;

namespace Articulate
{
    public class MarkdownHelper(IOptions<WebRoutingSettings> _routeSettings)
    {
        private static readonly MarkdownPipeline s_markdownPipeline = new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .Build();

        public string ToHtml(string input)
        {
            var baseUrl = _routeSettings.Value.UmbracoApplicationUrl;
            var html = Markdown.ToHtml(input, s_markdownPipeline);
            var sanitizer = new HtmlSanitizer();
            sanitizer.AllowedSchemes.Add("mailto");
            sanitizer.PostProcessNode += (sender, e) =>
            {
                if (e.Node is not IHtmlAnchorElement a || a.HostName == baseUrl)
                {
                    return;
                }

                a.RelationList.Add("external");
                a.RelationList.Add("nofollow");
            };
            return sanitizer.Sanitize(html, baseUrl: baseUrl);
        }
    }
}
