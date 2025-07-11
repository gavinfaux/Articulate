using Articulate.Controllers.ManagementApi;
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
                ArticulateConstants.ManagementApi.Authentication, ArticulateConstants.ManagementApi.MarkdownEditor
            ]);

            var vm = new MarkdownEditorInitModel
            {
                ArticulateNodeId = CurrentPage.Id,
                AuthSignInUrl =
                    managementApiUrls
                        [GetKey<BackOfficeAuthenticationController>(nameof(BackOfficeAuthenticationController.Login))],
                AuthSignOutUrl =
                    managementApiUrls
                        [GetKey<BackOfficeAuthenticationController>(nameof(BackOfficeAuthenticationController.Logout))],
                AuthCsrfTokenUrl =
                    managementApiUrls
                        [GetKey<BackOfficeAuthenticationController>(nameof(BackOfficeAuthenticationController.GetCsrfToken))],
                AuthStatusUrl =
                    managementApiUrls
                        [GetKey<BackOfficeAuthenticationController>(nameof(BackOfficeAuthenticationController.GetStatus))],
                PostUrl = managementApiUrls[
                    GetKey<ManagementApi.MarkdownEditorController>(nameof(ManagementApi.MarkdownEditorController
                        .CreatePost))]
            };

            Response.Headers["Permissions-Policy"] = "camera=(self)";

            return View("~/App_Plugins/Articulate/Views/MarkdownEditor.cshtml", vm);

            static string GetKey<T>(string actionName) => $"{typeof(T).Name}.{actionName}";
        }
    }
}
