#nullable enable
using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Website.ActionResults;
using Umbraco.Extensions;

namespace Articulate.Controllers
{
    public class ArticulateAuthorController : ListControllerBase
    {
        private readonly UmbracoHelper _umbracoHelper;
        private readonly ILogger<ArticulateAuthorController> _logger;

        public ArticulateAuthorController(
            ILogger<ArticulateAuthorController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedUrlProvider publishedUrlProvider,
            IPublishedValueFallback publishedValueFallback,
            UmbracoHelper umbracoHelper)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider, publishedValueFallback)
        {
            _umbracoHelper = umbracoHelper;
            _logger = logger;
        }

        /// <summary>
        /// Override and declare a NonAction so that we get routed to the Index action with the optional page route
        /// </summary>
        /// <returns></returns>
        [NonAction]
        public override IActionResult Index() => Index(0);

        public IActionResult Index(int? p)
        {
            if (CurrentPage == null)
            {
                _logger.LogWarning("ArticulateAuthorController.Index: CurrentPage is null, returning 404");
                return NotFound();
            }

            //create a master model
            var masterModel = new MasterModel(CurrentPage, PublishedValueFallback);

            IPublishedContent[]? listNodes = masterModel.RootBlogNode?.ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.ToArray();
            if (listNodes == null || listNodes.Length == 0)
            {
                throw new InvalidOperationException("An ArticulateArchive document must exist under the root Articulate document");
            }

            var totalPosts = _umbracoHelper.GetPostCount(CurrentPage.Name, listNodes.Select(x => x.Id).ToArray());

            if (!GetPagerModel(masterModel, totalPosts, p, out PagerModel? pager) || pager == null)
            {
                return new RedirectToUmbracoPageResult(
                    CurrentPage.Parent(),
                    PublishedUrlProvider,
                    UmbracoContextAccessor);
            }

            IEnumerable<IPublishedContent>? authorPosts = _umbracoHelper.GetContentByAuthor(
                listNodes,
                CurrentPage.Name,
                pager,
                PublishedValueFallback);


            var author = new AuthorModel(
                CurrentPage,
                authorPosts ?? [],
                pager,
                totalPosts,
                PublishedValueFallback);

            return View("Author", author);
        }

    }
}
