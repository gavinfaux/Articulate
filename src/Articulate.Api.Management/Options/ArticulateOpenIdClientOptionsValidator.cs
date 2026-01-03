#nullable enable
using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;

namespace Articulate.Api.Management.Options
{
    internal sealed class ArticulateOpenIdClientOptionsValidator : IValidateOptions<ArticulateOpenIdClientOptions>
    {
        public ValidateOptionsResult Validate(string? name, ArticulateOpenIdClientOptions options)
        {
            if (!options.Enabled)
            {
                return ValidateOptionsResult.Success;
            }

            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(options.ClientId))
            {
                errors.Add("Articulate:ManagementApi:OpenIddict:Client: ClientId is required when Enabled=true.");
            }

            if (!HasAbsoluteRedirectUri(options.RedirectUris))
            {
                errors.Add("Articulate:ManagementApi:OpenIddict:Client: Provide at least one absolute RedirectUris entry when Enabled=true.");
            }

            bool isPublic = string.Equals(options.ClientType, OpenIddictConstants.ClientTypes.Public, StringComparison.OrdinalIgnoreCase);
            if (!isPublic && !options.HasClientSecret())
            {
                errors.Add("Articulate:ManagementApi:OpenIddict:Client: Confidential clients must specify ClientSecret.");
            }

            return errors.Count == 0 ? ValidateOptionsResult.Success : ValidateOptionsResult.Fail(errors);
        }

        private static bool HasAbsoluteRedirectUri(IEnumerable<string> candidates)
        {
            if (candidates is null)
            {
                return false;
            }

            foreach (string candidate in candidates)
            {
                if (Uri.TryCreate(candidate, UriKind.Absolute, out _))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
