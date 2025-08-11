#nullable enable
using Articulate;
using Umbraco.Cms.Api.Management.OpenApi;

namespace Articulate.Api.Management.Swagger
{
    /// <summary>
    /// Adds security requirements to Articulate API operations for Swagger documentation.
    /// </summary>
    internal class ArticulateOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        /// <summary>
        /// Gets the API name for which security requirements are applied.
        /// </summary>
        protected override string ApiName => Constants.ManagementApi.Name;
    }
}
