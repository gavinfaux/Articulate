#nullable enable
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;

namespace Articulate.Controllers
{
    // TODO: http://issues.umbraco.org/issue/U4-2565
    [OutputCache(PolicyName = "Articulate120")]
    public class ArticulateRichTextController(
        ILogger<ArticulateRichTextController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedValueFallback publishedValueFallback)
        : BlogPostControllerBase(logger, compositeViewEngine, umbracoContextAccessor, publishedValueFallback);
}
