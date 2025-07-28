#nullable enable
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    //TODO: http://issues.umbraco.org/issue/U4-2565
    public class ArticulateRichTextController : BlogPostControllerBase
    {
        public ArticulateRichTextController(ILogger<ArticulateRichTextController> logger, ICompositeViewEngine compositeViewEngine, IUmbracoContextAccessor umbracoContextAccessor, IPublishedValueFallback publishedValueFallback)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedValueFallback)
        {
        }
    }
}
