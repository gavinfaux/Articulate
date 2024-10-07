using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    //TODO: http://issues.umbraco.org/issue/U4-2565
    [ApiController]
    [Route("/umbraco/api/articulate/text")]

    public class ArticulateRichTextController : BlogPostControllerBase
    {
        public ArticulateRichTextController(ILogger<RenderController> logger, ICompositeViewEngine compositeViewEngine, IUmbracoContextAccessor umbracoContextAccessor, IPublishedValueFallback publishedValueFallback, IVariationContextAccessor variationContextAccessor)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedValueFallback, variationContextAccessor)
        {
        }
    }
}
