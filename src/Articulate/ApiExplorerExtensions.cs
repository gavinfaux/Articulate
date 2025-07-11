using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace Articulate
{
    public static class ApiExplorerExtensions
    {
        public static IReadOnlyDictionary<string, string> ForGroups(
            this IApiDescriptionGroupCollectionProvider provider,
            string[] apiGroupNames)
        {
            // Create a HashSet for fast, case-insensitive lookups. This is the best practice.
            var groupNameSet = new HashSet<string>(apiGroupNames, StringComparer.OrdinalIgnoreCase);

            //Find all matching groups.
            return provider.ApiDescriptionGroups.Items
                //Flatten all their API descriptions into a single list.
                .SelectMany(g => g.Items)
                // Use the HashSet for a fast and case-insensitive check.
                .Where(desc => desc.GroupName != null && groupNameSet.Contains(desc.GroupName))
                //Filter for valid controller actions.
                .Where(desc => desc.ActionDescriptor is ControllerActionDescriptor)
                // Create the final dictionary with a unique composite key.
                .ToDictionary(
                    // Key: "ControllerTypeName.ActionName" - This matches nameof(ControllerType.Action)
                    desc =>
                    {
                        var cad = (ControllerActionDescriptor)desc.ActionDescriptor;
                        return $"{cad.ControllerTypeInfo.Name}.{cad.ActionName}";
                    },
                    // Value: URL relative path
                    desc => $"/{desc.RelativePath?.TrimStart('/')}"
                );
        }
    }
}
