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
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Extensions;

namespace Articulate.Controllers
{
    /// <summary>
    /// Renders the Articulate Archive node as a blog post list by date
    /// </summary>
    public class ArticulateArchiveController : ListControllerBase
    {
        private readonly ILogger<ArticulateArchiveController> _logger;

        public ArticulateArchiveController(
            ILogger<ArticulateArchiveController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedUrlProvider publishedUrlProvider,
            IPublishedValueFallback publishedValueFallback,
            UmbracoHelper umbraco)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider, publishedValueFallback)
        {
            Umbraco = umbraco;
            _logger = logger;
        }

        private UmbracoHelper Umbraco { get; }

        /// <summary>
        /// Declare new Index action with optional page number
        /// </summary>
        /// <param name="p"></param>
        /// <returns></returns>
        public IActionResult Index(int? p)
        {
            if (CurrentPage != null)
            {
                return RenderView(new ContentModel(CurrentPage), p);
            }

            _logger.LogWarning("ArticulateArchiveController.Index: CurrentPage is null, returning 404");
            return NotFound();
        }

        /// <summary>
        /// Override and declare a NonAction so that we get routed to the Index action with the optional page route
        /// </summary>
        /// <returns></returns>
        [NonAction]
        public override IActionResult Index() => Index(0);

        private IActionResult RenderView(IContentModel model, int? p = null)
        {
            var archive = new MasterModel(model.Content, PublishedValueFallback);

            // redirect to root node when "redirectArchive" is configured
            if (archive.RootBlogNode?.Value<bool>("redirectArchive") ?? false)
            {
                return RedirectPermanent(archive.RootBlogNode.Url());
            }

            //Get post count by xpath is much faster than iterating all children to get a count
            var count = Umbraco.GetPostCount(archive.Id);

            if (!int.TryParse(archive.RootBlogNode?.Value<string>("pageSize"), out var pageSize))
            {
                pageSize = 10;
            }

            IEnumerable<PostModel> posts = Umbraco.GetRecentPostsByArchive(
                archive,
                p ?? 1,
                pageSize,
                PublishedValueFallback) ?? [];

            return GetPagedListView(archive, archive, posts, count, null);
        }
    }
}
