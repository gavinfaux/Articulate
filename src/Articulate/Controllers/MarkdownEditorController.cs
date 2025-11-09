#nullable enable
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    /// <summary>
    /// Temporary redirect controller for the legacy front-end Markdown editor route (/a-new).
    /// Maps to the Articulate root and returns a 301 to the blog home.
    /// </summary>
    public class MarkdownEditorController(
        ILogger<MarkdownEditorController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedValueFallback publishedValueFallback)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        public IActionResult NewPost()
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("MarkdownEditorController.NewPost: CurrentPage is null, returning 404");
                return NotFound();
            }

            var master = new MasterModel(CurrentPage, publishedValueFallback);
            var target = master.RootBlogNode.Url(mode: UrlMode.Absolute);
            return Redirect(target); // 302 temporary
        }
    }
}
