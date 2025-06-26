using System.Collections.Generic;
using Articulate.Models;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Extensions;

namespace Articulate.Controllers
{
    [ArticulateDynamicRoute]
    public class MarkdownEditorController : RenderController
    {
        private readonly LinkGenerator _linkGenerator;

        public MarkdownEditorController(
            ILogger<RenderController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            LinkGenerator linkGenerator)
            : base(logger, compositeViewEngine, umbracoContextAccessor)
        {
            _linkGenerator = linkGenerator;
        }

        [HttpGet]
        public IActionResult NewPost()
        {
            var method = nameof(MardownEditorApiController.PostNew);
            var type = nameof(MardownEditorApiController);

            var vm = new MarkdownEditorInitModel
            {
                ArticulateNodeId = CurrentPage.Id,


                PostUrl = _linkGenerator.GetPathByAction(action: method, controller: type, values: null),
                IsAuthUrl = "",
                DoAuthUrl = "",
                //IsAuthUrl = _linkGenerator.GetUmbracoControllerUrl(nameof(AuthenticationController.IsAuthenticated), typeof(AuthenticationController)),
                //DoAuthUrl = _linkGenerator.GetUmbracoControllerUrl(
                //    nameof(AuthenticationController.PostLogin),
                //    typeof(AuthenticationController),
                   // new Dictionary<string, object> { ["loginModel"] = null }
            };
            
            return View("~/App_Plugins/Articulate/Views/MarkdownEditor.cshtml", vm);
        }
    }
}
