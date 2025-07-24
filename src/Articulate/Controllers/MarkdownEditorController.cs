using Articulate.Attributes;
using Articulate.Controllers.Api;
using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    [ArticulateDynamicRoute]
    public class MarkdownEditorController(
        ILogger<RenderController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IApiDescriptionGroupCollectionProvider apiDescriptionProvider)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        [HttpGet]
        public ViewResult NewPost()
        {
            var managementApiUrls = apiDescriptionProvider.ForGroups([
                ArticulateConstants.ManagementApi.MarkdownEditor
            ]);

            var vm = new MarkdownEditorInitModel
            {
                ArticulateNodeId = CurrentPage.Id,
                EditorPostUrl = managementApiUrls[
                    GetKey<MarkdownEditorApiController>(nameof(MarkdownEditorApiController
                        .CreatePost))]
            };

            Response.Headers["Permissions-Policy"] = "camera=(self)";

            return View("~/App_Plugins/Articulate/Views/MarkdownEditor.cshtml", vm);

            static string GetKey<T>(string actionName) => $"{typeof(T).Name}.{actionName}";
        }
    }
}
