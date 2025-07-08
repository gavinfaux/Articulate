using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace Articulate.Controllers.ManagementApi
{
    public static class ApiExtensions
    {
        public static string GetApiUrlFor<TController>(this IApiDescriptionGroupCollectionProvider apiDescriptionGroupCollectionProvider, string actionName) where TController : ControllerBase
        {
            // if we do this often we may need to move elsewhere; with some caching.
            var apiDescription = apiDescriptionGroupCollectionProvider.ApiDescriptionGroups.Items
                .SelectMany(group => group.Items)
                .FirstOrDefault(desc =>
                    desc.ActionDescriptor is ControllerActionDescriptor cad &&
                    cad.ControllerTypeInfo.AsType() == typeof(TController) &&
                    cad.ActionName == actionName);

            if (apiDescription is null)
            {
                return string.Empty;
            }

            return $"/{apiDescription.RelativePath}";
        }
    }
}
