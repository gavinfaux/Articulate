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
            var managementApiUrls = _apiDescriptionProvider.GetAllApiUrlsForGroups([ArticulateConstants.Name.AuthenticationApiGroup, ArticulateConstants.Name.ArticulateManagementApi
            ]);

            var vm = new MarkdownEditorInitModel
            {
                ArticulateNodeId = CurrentPage.Id,

                AuthSignInUrl = managementApiUrls[$"{nameof(ArticulateAuthenticationController)}.{nameof(ArticulateAuthenticationController.Login)}"],
                AuthSignOutUrl = managementApiUrls[$"{nameof(ArticulateAuthenticationController)}.{nameof(ArticulateAuthenticationController.Logout)}"],
                AuthCsrfTokenUrl = managementApiUrls[$"{nameof(ArticulateAuthenticationController)}.{nameof(ArticulateAuthenticationController.GetCsrfToken)}"],
                AuthStatusUrl = managementApiUrls[$"{nameof(ArticulateAuthenticationController)}.{nameof(ArticulateAuthenticationController.GetStatus)}"],

                PostUrl = managementApiUrls[$"{nameof(ArticulateMardownEditorController)}.{nameof(ArticulateMardownEditorController.CreatePost)}"]
            };

            Response.Headers["Permissions-Policy"] = "camera=(self)";

            return View("~/App_Plugins/Articulate/Views/MarkdownEditor.cshtml", vm);
        }
    }
}
