using System;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Extensions;

namespace Articulate.Components
{
    /// <summary>
    /// Handles the generation of operation IDs for Articulate API endpoints in Swagger.
    /// </summary>
    public class ArticulateOperationIdHandler(IOptions<ApiVersioningOptions> apiVersioningOptions)
        : OperationIdHandler(apiVersioningOptions)
    {
        // Adapted from Umbraco.Cms.Api.Common.OpenApi.OperationIdHandler

        private readonly IOptions<ApiVersioningOptions> _apiVersioningOptions = apiVersioningOptions;

        protected override bool CanHandle(ApiDescription apiDescription,
            ControllerActionDescriptor controllerActionDescriptor)
            => controllerActionDescriptor.ControllerTypeInfo.Namespace?.StartsWith(
                "Articulate.Controllers.ManagementApi",
                StringComparison.InvariantCultureIgnoreCase) is true;

        public override string Handle(ApiDescription apiDescription)
            => ArticulateOperationId(apiDescription);

        protected string ArticulateOperationId(ApiDescription apiDescription)
        {
            if (apiDescription.ActionDescriptor is not ControllerActionDescriptor controllerActionDescriptor)
            {
                throw new ArgumentException($"This handler operates only on {nameof(ControllerActionDescriptor)}.");
            }

            var defaultVersion = _apiVersioningOptions.Value.DefaultApiVersion;
            var httpMethod = apiDescription.HttpMethod?.ToLower().ToFirstUpper() ?? "Get";

            var relativePath = apiDescription.RelativePath;

            if (string.IsNullOrWhiteSpace(relativePath))
            {
                throw new InvalidOperationException(
                    $"There is no relative path for controller action {apiDescription.ActionDescriptor.RouteValues["controller"]}");
            }

            // Remove the prefixed base path with version, e.g. /umbraco/management/api/v1/tracked-reference/{id} => tracked-reference/{id}
            var unprefixedRelativePath = ArticulateOperationIdRegexes
                .VersionPrefixRegex()
                .Replace(relativePath, string.Empty);

            // Remove template placeholders, e.g. tracked-reference/{id} => tracked-reference/Id
            var formattedOperationId = ArticulateOperationIdRegexes
                .TemplatePlaceholdersRegex()
                .Replace(unprefixedRelativePath, m => $"By{m.Groups[1].Value.ToFirstUpper()}");

            // Remove dashes (-) and slashes (/) and convert the following letter to uppercase with
            // the word "By" in front, e.g. tracked-reference/Id => TrackedReferenceById
            formattedOperationId = ArticulateOperationIdRegexes
                .ToCamelCaseRegex()
                .Replace(formattedOperationId, m => m.Groups[1].Value.ToUpper());

            // Get map to version attribute
            string version = null;

            var versionAttributeValue = controllerActionDescriptor.MethodInfo.GetMapToApiVersionAttributeValue();

            // We only want to add a version, if it is not the default one.
            if (string.Equals(versionAttributeValue, defaultVersion.ToString()) == false)
            {
                version = versionAttributeValue;
            }

            // Return the operation ID with the formatted http method verb in front, e.g. GetTrackedReferenceById
            return $"{httpMethod}{formattedOperationId.ToFirstUpper()}{version}";
        }
    }
}
