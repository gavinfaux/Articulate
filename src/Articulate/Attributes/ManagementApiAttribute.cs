#nullable enable
using Microsoft.AspNetCore.Mvc;

namespace Articulate.Attributes
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class ManagementApiAttribute : ApiExplorerSettingsAttribute
    {
        public ManagementApiAttribute(string group) => GroupName = group;
    }
}
