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
    /// Handles the ArticulateAuthors container node (/authors/).
    /// </summary>
    /// <remarks>
    /// By default, redirects to blog root when redirectArchive is enabled.
    /// If a custom theme provides Authors.cshtml, it will render the author listing.
    /// Individual author pages (/authors/john-doe/) are handled by <see cref="ArticulateAuthorController"/>
    /// </remarks>
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

            var root = new MasterModel(CurrentPage, publishedValueFallback);

            if (root.RootBlogNode.Value<bool>("redirectArchive"))
            {
                return RedirectPermanent(root.RootBlogNode.Url());
            }

            // Check if theme has custom Authors.cshtml view before building the listing model.
            if (!EnsurePhysicalViewExists("Authors"))
            {
                logger.LogInformation(
                    "ArticulateAuthorsController: No Authors.cshtml view found. " +
                    "Recommend enabling 'redirectArchive' or creating custom Authors.cshtml in theme.");

                return NotFound();
            }

            // Build author list for custom themes that provide Authors.cshtml
            var listingPager = new PagerModel(1, 0, 1);
            var authorNodes = CurrentPage.Children().ToList();
            var authors = authorNodes
                .Select(a => new AuthorModel(
                    a,
                    [], // Author listing pages do not need post items.
                    listingPager,
                    0,
                    publishedValueFallback))
                .ToList();

            var model = new AuthorListModel(CurrentPage, publishedValueFallback)
            {
                Authors = authors
            };

            return View("Authors", model);
        }
    }
}
