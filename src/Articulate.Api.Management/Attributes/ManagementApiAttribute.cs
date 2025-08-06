using Microsoft.AspNetCore.Mvc;

namespace Articulate.Api.Management.Attributes
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class ManagementApiAttribute : ApiExplorerSettingsAttribute
    {
        public ManagementApiAttribute(string group) => GroupName = group;
    }
}
