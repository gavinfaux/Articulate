using Microsoft.AspNetCore.Mvc;

namespace Articulate.Api.Management.Attributes
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    internal sealed class ManagementApiAttribute : ApiExplorerSettingsAttribute
    {
        public ManagementApiAttribute(string group) => GroupName = group;
    }
}
