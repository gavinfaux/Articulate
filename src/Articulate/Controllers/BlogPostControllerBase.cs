#nullable enable
using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    public abstract class BlogPostControllerBase : RenderController
    {
        private readonly IPublishedValueFallback _publishedValueFallback;
        private readonly ILogger<BlogPostControllerBase> _logger;

        protected BlogPostControllerBase(
            ILogger<BlogPostControllerBase> logger,
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
                _logger.LogWarning("BlogPostControllerBase.Index: CurrentPage is null, returning 404");
                return NotFound();
            }

            var post = new PostModel(CurrentPage, _publishedValueFallback);
            return View("Post", post);
        }
    }
}
