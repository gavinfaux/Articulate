using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection; 
using Articulate.Attributes;
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
            var groupNameSet = new HashSet<string>(apiGroupNames, StringComparer.OrdinalIgnoreCase);

            return provider.ApiDescriptionGroups.Items
                // Step 1: find only the groups that match our names ("Authentication", "Markdown Editor").
                .Where(group => group.GroupName != null && groupNameSet.Contains(group.GroupName))
                .SelectMany(group => group.Items)

                // Step 2: filter list to ensure the controllers have our custom attribute.
                // This prevents conflicts with any other package that might use the same group name.
                .Where(desc =>
                {
                    if (desc.ActionDescriptor is not ControllerActionDescriptor controllerActionDescriptor)
                    {
                        return false;
                    }

                    return controllerActionDescriptor.ControllerTypeInfo.GetCustomAttribute<ManagementApiAttribute>() != null;
                })

                .ToDictionary(
                    desc =>
                    {
                        var cad = (ControllerActionDescriptor)desc.ActionDescriptor;
                        return $"{cad.ControllerTypeInfo.Name}.{cad.ActionName}";
                    },
                    desc => $"/{desc.RelativePath?.TrimStart('/')}"
                );
        }
    }
}
