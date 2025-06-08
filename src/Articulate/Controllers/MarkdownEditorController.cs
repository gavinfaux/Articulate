// // TODO: Deprecated for now. See the comment in the MarkdownEditorController.cs file

//using System.Collections.Generic;
//using Articulate.Models;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.Mvc.ViewEngines;
//using Microsoft.AspNetCore.Routing;
//using Microsoft.Extensions.Logging;
//using Umbraco.Cms.Api.Management.Controllers;
//using Umbraco.Cms.Core;
//using Umbraco.Cms.Core.Web;
//using Umbraco.Cms.Web.Common.Controllers;
//using Umbraco.Extensions;

//namespace Articulate.Controllers
//{
//    [ArticulateDynamicRoute]
//    public class MarkdownEditorController : RenderController
//    {
//        private readonly LinkGenerator _linkGenerator;

//        public MarkdownEditorController(
//            ILogger<RenderController> logger,
//            ICompositeViewEngine compositeViewEngine,
//            IUmbracoContextAccessor umbracoContextAccessor,
//            LinkGenerator linkGenerator)
//            : base(logger, compositeViewEngine, umbracoContextAccessor)
//        {
//            _linkGenerator = linkGenerator;
//        }

//        [HttpGet]
//        public IActionResult NewPost()
//        {
//            // Work around? to resolve "Cannot resolve action 'PostNew' and cannot resolve controller 'MarkdownEditorApiController'." errors
//            var actionName = nameof(MarkdownEditorApiController.PostNew);
//            var controllerName = "MarkdownEditorApiController";

//            var vm = new MarkdownEditorInitModel
//            {
//                ArticulateNodeId = CurrentPage.Id,
//                PostUrl = _linkGenerator.GetPathByAction(action: actionName, controller: controllerName, values: null),

//                // hmm... unsure how to handle this in Umbraco 15+ - unsure we can use the link generator here, or redirect to login and back again, or use BackOfficeSignInManager

//                //IsAuthUrl = _linkGenerator.GetUmbracoControllerUrl(nameof(AuthenticationController.IsAuthenticated), typeof(AuthenticationController)),
//                //DoAuthUrl = _linkGenerator.GetUmbracoControllerUrl(
//                //    nameof(AuthenticationController.PostLogin),
//                //    typeof(AuthenticationController),
//                //    new Dictionary<string, object> { ["loginModel"] = null })
//            };

//            return View("~/App_Plugins/Articulate/Views/MarkdownEditor.cshtml", vm);
//        }
//    }
//}
