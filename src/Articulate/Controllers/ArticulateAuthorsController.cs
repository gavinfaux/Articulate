#nullable enable
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.ActionsResults;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    /// <summary>
    /// This is used to redirect the Authors node to the root so no 404s occur
    /// </summary>
    public class ArticulateAuthorsController(
        ILogger<ArticulateAuthorsController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedValueFallback publishedValueFallback)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        /// <inheritdoc/>
        public override IActionResult Index()
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("ArticulateAuthorsController.Index: CurrentPage is null, returning 404");
                return NotFound();
            }

            var root = new MasterModel(
                CurrentPage,
                publishedValueFallback);

            // TODO: Should we have another setting for authors?
            if (root.RootBlogNode.Value<bool>("redirectArchive"))
            {
                return RedirectPermanent(root.RootBlogNode.Url());
            }

            // default
            var action = ControllerContext.RouteData.Values["action"]?.ToString();
#if NET10_0_OR_GREATER
            if (!EnsurePhysicalViewExists(action))
#else
            if (!EnsurePhsyicalViewExists(action))
#endif
            {
                return new PublishedContentNotFoundResult(UmbracoContext);
            }

            return View(action, new ContentModel(CurrentPage));
        }
    }
}
