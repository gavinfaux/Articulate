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
    public class MarkdownEditorController : RenderController
    {
        private readonly IApiDescriptionGroupCollectionProvider _apiDescriptionProvider;

        public MarkdownEditorController(
            ILogger<RenderController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IApiDescriptionGroupCollectionProvider apiDescriptionProvider
        )
            : base(logger, compositeViewEngine, umbracoContextAccessor)
        {
            _apiDescriptionProvider = apiDescriptionProvider;
        }

        [HttpGet]
        public ViewResult NewPost()
        {
            var managementApiUrls = _apiDescriptionProvider.ForGroups([
                ArticulateConstants.ManagementApi.Authentication, ArticulateConstants.ManagementApi.MarkdownEditor
            ]);

            var vm = new MarkdownEditorInitModel
            {
                ArticulateNodeId = CurrentPage.Id,
                AuthSignInUrl =
                    managementApiUrls
                        [$"{nameof(BackOfficeAuthenticationControllerController)}.{nameof(BackOfficeAuthenticationControllerController.Login)}"],
                AuthSignOutUrl =
                    managementApiUrls
                        [$"{nameof(BackOfficeAuthenticationControllerController)}.{nameof(BackOfficeAuthenticationControllerController.Logout)}"],
                AuthCsrfTokenUrl =
                    managementApiUrls[
                        $"{nameof(BackOfficeAuthenticationControllerController)}.{nameof(BackOfficeAuthenticationControllerController.GetStatus)}"],
                PostUrl = managementApiUrls[$"{nameof(Articulate.Controllers.ManagementApi.MarkdownEditorController)}.{nameof(Articulate.Controllers.ManagementApi.MarkdownEditorController.CreatePost)}"]
            };

            Response.Headers["Permissions-Policy"] = "camera=(self)";

            return View("~/App_Plugins/Articulate/Views/MarkdownEditor.cshtml", vm);
        }
    }
}
