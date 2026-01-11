#nullable enable
using Articulate.Api.Management.Controllers;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Common.OpenApi;

namespace Articulate.Api.Management.Swagger
{
    /// <summary>
    /// Handles the generation of operation IDs for Articulate API endpoints in Swagger.
    /// </summary>
#pragma warning disable CS9107 // Parameter captured and passed to base - intentional, base class doesn't expose options
    internal class ArticulateOperationIdHandler(IOptions<ApiVersioningOptions> apiVersioningOptions)
        : OperationIdHandler(apiVersioningOptions)
#pragma warning restore CS9107
    {
        /// <inheritdoc/>
        public override string Handle(ApiDescription apiDescription) => ArticulateOperationId(apiDescription);

        // Adapted from Umbraco.Cms.Api.Common.OpenApi.OperationIdHandler
        /// <inheritdoc/>
        protected override bool CanHandle(
            ApiDescription apiDescription,
            ControllerActionDescriptor controllerActionDescriptor)
        {
            Type type = typeof(BlogMlApiController);
            var namespaceName = type.Namespace ?? "Articulate.Api.Management.Controllers";

            return controllerActionDescriptor.ControllerTypeInfo.Namespace?.StartsWith(
                namespaceName,
                StringComparison.InvariantCultureIgnoreCase) is true;
        }

        private string ArticulateOperationId(ApiDescription apiDescription)
        {
            if (apiDescription.ActionDescriptor is not ControllerActionDescriptor controllerActionDescriptor)
            {
                throw new ArgumentException($"This handler operates only on {nameof(ControllerActionDescriptor)}.");
            }

            ApiVersion defaultVersion = apiVersioningOptions.Value.DefaultApiVersion;
            var httpMethod = apiDescription.HttpMethod?.ToLower().ToFirstUpper() ?? "Get";
            var relativePath = apiDescription.RelativePath;

            if (string.IsNullOrWhiteSpace(relativePath))
            {
                throw new InvalidOperationException(
                    $"There is no relative path for controller action {apiDescription.ActionDescriptor.RouteValues["controller"]}");
            }

            // Remove the prefixed base path with version, e.g. /umbraco/articulate/api/v1/tracked-reference/{id} => tracked-reference/{id}
            var unprefixedRelativePath = ArticulateOperationIdRegexes
                .VersionPrefixRegex()
                .Replace(relativePath, string.Empty);

            // Remove template placeholders, e.g. tracked-reference/{id} => tracked-reference/ID
            var formattedOperationId = ArticulateOperationIdRegexes
                .TemplatePlaceholdersRegex()
                .Replace(unprefixedRelativePath, m => $"By{m.Groups[1].Value.ToFirstUpper()}");

            // Remove dashes (-) and slashes (/) and convert the following letter to uppercase with
            // the word "By" in front, e.g. tracked-reference/Id => trackedReferenceById
            formattedOperationId = ArticulateOperationIdRegexes
                .ToCamelCaseRegex()
                .Replace(formattedOperationId, m => m.Groups[1].Value.ToUpper());

            // Get map to version attribute
            var version = string.Empty;

            var versionAttributeValue = controllerActionDescriptor.MethodInfo.GetMapToApiVersionAttributeValue();

            // We only want to add a version, if it is not the default one.
            if (!string.IsNullOrEmpty(versionAttributeValue) &&
                !string.Equals(versionAttributeValue, defaultVersion.ToString()))
            {
                version = versionAttributeValue;
            }

            // Return the operation ID with the formatted http method verb in front, e.g. GetTrackedReferenceById
            return $"{httpMethod}{formattedOperationId.ToFirstUpper()}{version}";
        }
    }
}
