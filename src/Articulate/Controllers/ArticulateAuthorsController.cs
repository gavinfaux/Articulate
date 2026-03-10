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

            // Build author list for custom themes that provide Authors.cshtml
            var authorNodes = CurrentPage.Children().ToList();
            var authors = authorNodes
                .Select(a => new AuthorModel(
                    a,
                    null,  // No posts in listing
                    null,  // No pager for author listing
                    0,     // Post count not needed for listing
                    publishedValueFallback))
                .ToList();

            var model = new AuthorListModel(CurrentPage, publishedValueFallback)
            {
                Authors = authors
            };

            // Check if theme has custom Authors.cshtml view
            if (EnsurePhysicalViewExists("Authors"))
            {
                return View("Authors", model);
            }

            // No custom view available
            logger.LogInformation(
                "ArticulateAuthorsController: No Authors.cshtml view found. " +
                "Recommend enabling 'redirectArchive' or creating custom Authors.cshtml in theme.");

            return NotFound();
        }
    }
}
