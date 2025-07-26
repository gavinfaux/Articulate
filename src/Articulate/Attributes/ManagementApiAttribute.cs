using System;
using Microsoft.AspNetCore.Mvc;
using static Articulate.ArticulateEnum;

namespace Articulate.Attributes
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class ManagementApiAttribute : ApiExplorerSettingsAttribute
    {
        public ManagementApi Group { get; }

        public ManagementApiAttribute(ManagementApi group)
        {
            Group = group;

            GroupName = group.GetStringValue();
        }
    }
}
