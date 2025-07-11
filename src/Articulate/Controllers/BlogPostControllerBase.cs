using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    public abstract class BlogPostControllerBase(
        ILogger<RenderController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedValueFallback publishedValueFallback,
        IVariationContextAccessor variationContextAccessor)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        public override IActionResult Index()
        {
            var post = new PostModel(CurrentPage, publishedValueFallback, variationContextAccessor);
            return View(PathHelper.GetThemeViewPath(post, "Post"), post);
        }
    }
}
