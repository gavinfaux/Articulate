using Umbraco.Cms.Web.Common.Routing;

namespace Articulate.Api.Management.Attributes
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    internal sealed class ManagementApiRouteAttribute(string template)
        : BackOfficeRouteAttribute("/articulate/api/v{version:apiVersion}/" + template.TrimStart('/'))
    {
        // Intentionally empty
    }
}
