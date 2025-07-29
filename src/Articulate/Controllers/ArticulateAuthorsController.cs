#nullable enable
using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.ActionsResults;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Extensions;

namespace Articulate.Controllers
{
    /// <summary>
    /// This is used to redirect the Authors node to the root so no 404s occur
    /// </summary>
    public class ArticulateAuthorsController : RenderController
    {
        private readonly IPublishedValueFallback _publishedValueFallback;
        private readonly ILogger<ArticulateAuthorsController> _logger;


        public ArticulateAuthorsController(
            ILogger<ArticulateAuthorsController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedValueFallback publishedValueFallback)
            : base(logger, compositeViewEngine, umbracoContextAccessor)
        {
            _publishedValueFallback = publishedValueFallback;
            _logger = logger;
        }

        public override IActionResult Index()
        {
            if (CurrentPage is null)
            {
                _logger.LogWarning("ArticulateAuthorsController.Index: CurrentPage is null, returning 404");
                return NotFound();
            }

            var root = new MasterModel(
                CurrentPage,
                _publishedValueFallback);

            //TODO: Should we have another setting for authors?
            if (root.RootBlogNode.Value<bool>("redirectArchive"))
            {
                return RedirectPermanent(root.RootBlogNode.Url());
            }

            //default

            var action = ControllerContext.RouteData.Values["action"]?.ToString();
            if (!EnsurePhsyicalViewExists(action))
            {
                return new PublishedContentNotFoundResult(UmbracoContext);
            }

            return View(action, new ContentModel(CurrentPage));
        }
    }
}
