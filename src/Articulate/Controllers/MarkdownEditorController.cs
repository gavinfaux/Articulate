using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    [ArticulateDynamicRoute]
    public class MarkdownEditorController : RenderController
    {

        public MarkdownEditorController(
            ILogger<RenderController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor
            )
            : base(logger, compositeViewEngine, umbracoContextAccessor)
        {
        }

        [HttpGet]
        public IActionResult NewPost()
        {

            var vm = new MarkdownEditorInitModel
            {
                ArticulateNodeId = CurrentPage.Id,

            };

            return View("~/App_Plugins/Articulate/Views/MarkdownEditor.cshtml");
        }
    }
}
