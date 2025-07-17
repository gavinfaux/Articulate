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
                .Where(group => group.GroupName != null && groupNameSet.Contains(group.GroupName))
                .SelectMany(group => group.Items)
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
