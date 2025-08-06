#nullable enable
using Articulate.Attributes;
//using Articulate.Controllers.Api;
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
        ILogger<MarkdownEditorController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IApiDescriptionGroupCollectionProvider apiDescriptionProvider)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        [HttpGet]
        public IActionResult NewPost()
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("MarkdownEditorController.NewPost: CurrentPage is null, returning 404");
                return NotFound();
            }

            //IReadOnlyDictionary<string, string>? managementApiUrls = apiDescriptionProvider.ManagementApiUrlMap([
            //    ArticulateConstants.ManagementApi.MarkdownEditor
            //]);

            //var key = GetKey<MarkdownEditorApiController>(nameof(MarkdownEditorApiController.CreatePost));

            //string? editorUrl = null;

            //if (managementApiUrls?.TryGetValue(key, out var urlFromMap) == true)
            //{
            //    editorUrl = urlFromMap;
            //}

            //if (string.IsNullOrEmpty(editorUrl))
            //{
            //    throw new InvalidOperationException(
            //        $"Could not find the Management API URL for '{key}'. " +
            //        "Check if the Articulate API routes are registered correctly at startup.");
            //}

            //var vm = new MarkdownEditorInitModel
            //{
            //    ArticulateNodeId = CurrentPage.Id,
            //    EditorPostUrl = editorUrl
            //};

            //// TODO: CSP
            //Response.Headers["Permissions-Policy"] = "camera=(self)";

            //return View("MarkdownEditor", vm);

            //static string GetKey<T>(string actionName) => $"{typeof(T).Name}.{actionName}";
            return View("MarkdownEditor");

        }
    }
}
