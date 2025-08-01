#nullable enable
using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common;

namespace Articulate.Controllers
{
    /// <summary>
    /// Renders the Articulate root node as the main blog post list by date
    /// </summary>
    public class ArticulateController : ListControllerBase
    {
        private readonly UmbracoHelper _umbracoHelper;
        private readonly ILogger<ArticulateController> _logger;

        public ArticulateController(
            ILogger<ArticulateController> logger,
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
        /// Declare new Index action with optional page number
        /// </summary>
        /// <param name="p"></param>
        /// <returns></returns>
        public IActionResult Index(int? p)
        {
            if (CurrentPage is not null)
            {
                return RenderView(new ContentModel(CurrentPage), p);
            }

            _logger.LogWarning("ArticulateController.Index: CurrentPage is null, returning 404");
            return NotFound();

        }

        /// <summary>
        /// Override and declare a NonAction so that we get routed to the Index action with the optional page route
        /// </summary>
        /// <returns></returns>
        [NonAction]
        public override IActionResult Index() => Index(0);

        private IActionResult RenderView(ContentModel model, int? p = null)
        {
            IPublishedContent[]? listNodes = model.Content.ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.ToArray();

            if (listNodes is null || listNodes.Length == 0)
            {
                throw new InvalidOperationException("An ArticulateArchive document must exist under the root Articulate document");
            }

            var master = new MasterModel(model.Content, PublishedValueFallback);

            var count = _umbracoHelper.GetPostCount(listNodes.Select(x => x.Id).ToArray());

            IEnumerable<PostModel> posts = _umbracoHelper.GetRecentPosts(
                master,
                p ?? 1,
                master.PageSize,
                PublishedValueFallback) ?? [];

            return GetPagedListView(master, listNodes[0], posts, count, p);

        }
    }
}
