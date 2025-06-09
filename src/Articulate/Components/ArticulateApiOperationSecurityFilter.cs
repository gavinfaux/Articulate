using Umbraco.Cms.Api.Management.OpenApi;

namespace Articulate.Components
{
    public class ArticulateApiOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        protected override string ApiName => "articulate-api";
    }
}
