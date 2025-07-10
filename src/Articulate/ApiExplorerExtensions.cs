using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;

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
                // THE FIX: Use the HashSet for a fast and case-insensitive check.
                .Where(g => g.GroupName != null && groupNameSet.Contains(g.GroupName))
                //Flatten all their API descriptions into a single list.
                .SelectMany(g => g.Items)
                //Filter for valid controller actions.
                .Where(desc => desc.ActionDescriptor is ControllerActionDescriptor)
                // Create the final dictionary with a unique composite key.
                .ToDictionary(
                    // Key: "ControllerName.ActionName"
                    desc =>
                    {
                        var cad = (ControllerActionDescriptor)desc.ActionDescriptor;
                        return $"{cad.ControllerName}.{cad.ActionName}";
                    },
                    // Value: URL relative path
                    desc => $"/{desc.RelativePath.TrimStart('/')}"
                );
        }
    }
}
