using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace Articulate.Controllers.ManagementApi
{
    public static class ApiDescriptionProviderExtensions
    {
        /// <summary>
        /// Gets a dictionary of all API URLs for a specified API group names.
        /// </summary>
        /// <param name="provider">The API description provider.</param>
        /// <param name="apiGroupNames">Array of GroupNames as defined  by the ApiExplorerSettings attribute GroupName.</param>
        /// <returns>A dictionary mapping ActionName to its root-relative URL (e.g. "CreatePost" -> "/umbraco/management/api/v1/articulate/editors/markdown").</returns>
        public static IReadOnlyDictionary<string, string> GetAllApiUrlsForGroups(
            this IApiDescriptionGroupCollectionProvider provider,
            string[] apiGroupNames)
        {
            //Find all matching groups.
            return provider.ApiDescriptionGroups.Items
                .Where(group => apiGroupNames.Contains(group.GroupName))
                //Flatten all their API descriptions into a single list.
                .SelectMany(group => group.Items)
                //Filter for valid controller actions.
                .Where(desc => desc.ActionDescriptor is ControllerActionDescriptor)
                // Create the final dictionary with a unique composite key.
                .ToDictionary(
                    // "ControllerName.ActionName" (e.g., "ArticulateAuthenticationController.Login")
                    desc =>
                    {
                        var cad = (ControllerActionDescriptor)desc.ActionDescriptor;
                        return $"{cad.ControllerName}.{cad.ActionName}";
                    },
                    // URL relative path (e.g., "/articulate/management/api/v1/authentication/login")
                    desc => $"/{desc.RelativePath.TrimStart('/')}"
                );
        }
    }
}
