#nullable enable
using Umbraco.Cms.Api.Management.OpenApi;

namespace Articulate.Components
{
    /// <summary>
    /// Adds security requirements to Articulate API operations for Swagger documentation.
    /// </summary>
    public class ArticulateOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        /// <summary>
        /// Gets the API name for which security requirements are applied.
        /// </summary>
        protected override string ApiName => ArticulateConstants.ManagementApi.Name;
    }
}
