using System.Linq;
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

            // Get all API descriptions from the provider
            var allApiDescriptions = _apiDescriptionProvider.ApiDescriptionGroups.Items
                .SelectMany(group => group.Items)
                .ToList();

            var vm = new MarkdownEditorInitModel
            {
                ArticulateNodeId = CurrentPage.Id,
                AuthSignInUrl = _apiDescriptionProvider.GetApiUrlFor<ArticulateAuthenticationController>(nameof(ArticulateAuthenticationController.SignIn)),
                AuthSignOutUrl = _apiDescriptionProvider.GetApiUrlFor<ArticulateAuthenticationController>(nameof(ArticulateAuthenticationController.SignOut)),
                AuthCsrfTokenUrl = _apiDescriptionProvider.GetApiUrlFor<ArticulateAuthenticationController>(nameof(ArticulateAuthenticationController.GetCsrfToken)),
                AuthStatusUrl = _apiDescriptionProvider.GetApiUrlFor<ArticulateAuthenticationController>(nameof(ArticulateAuthenticationController.GetStatus)),
                PostUrl = _apiDescriptionProvider.GetApiUrlFor<ArticulateMardownEditorController>(nameof(ArticulateMardownEditorController.CreatePost))
            };

            Response.Headers["Permissions-Policy"] = "camera=(self)";

            return View("~/App_Plugins/Articulate/Views/MarkdownEditor.cshtml", vm);
        }
    }
}
