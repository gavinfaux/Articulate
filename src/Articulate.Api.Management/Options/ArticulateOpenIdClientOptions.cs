#nullable enable
using System.Collections.ObjectModel;
using OpenIddict.Abstractions;

namespace Articulate.Api.Management.Options
{
    /// <summary>
    /// Configuration options for registering a custom OpenIddict client used by the Articulate management extensions.
    /// </summary>
    public sealed class ArticulateOpenIdClientOptions
    {
        /// <summary>
        /// The configuration section that maps to <see cref="ArticulateOpenIdClientOptions"/>.
        /// </summary>
        public const string SectionName = "Articulate:ManagementApi:OpenIddict:Client";

        /// <summary>
        /// Gets or sets a value indicating whether the custom client registration is enabled.
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Gets or sets the client identifier for the custom application.
        /// </summary>
        public string? ClientId { get; set; }

        /// <summary>
        /// Gets or sets the display name shown for the client application.
        /// </summary>
        public string? DisplayName { get; set; }

        /// <summary>
        /// Gets or sets the client type to register with OpenIddict. Defaults to <see cref="OpenIddictConstants.ClientTypes.Public"/>.
        /// </summary>
        public string ClientType { get; set; } = OpenIddictConstants.ClientTypes.Public;

        /// <summary>
        /// Gets or sets the client secret used for confidential clients.
        /// </summary>
        public string? ClientSecret { get; set; }

        /// <summary>
        /// Gets or sets the redirect URIs allowed for the custom client. When <see cref="Enabled"/> is
        /// <see langword="true"/>, at least one absolute URI must be provided.
        /// </summary>
        public List<string> RedirectUris { get; set; } = new();

        /// <summary>
        /// Gets or sets the post-logout redirect URIs allowed for the custom client.
        /// </summary>
        public List<string> PostLogoutRedirectUris { get; set; } = new();

        /// <summary>
        /// Gets the permissions granted to the custom client. Defaults cover the authorization code flow.
        /// </summary>
        public IReadOnlyCollection<string> Permissions => _defaultPermissions;

        /// <summary>
        /// Gets the requirements enforced for the custom client. Defaults enforce PKCE support.
        /// </summary>
        public IReadOnlyCollection<string> Requirements => _defaultRequirements;

        /// <summary>
        /// Determines whether a non-empty client secret is configured.
        /// </summary>
        public bool HasClientSecret() => !string.IsNullOrWhiteSpace(ClientSecret);

        private static readonly IReadOnlyCollection<string> _defaultPermissions = Array.AsReadOnly(new[]
        {
            OpenIddictConstants.Permissions.Endpoints.Authorization,
            OpenIddictConstants.Permissions.Endpoints.Token,
            OpenIddictConstants.Permissions.Endpoints.EndSession,
            OpenIddictConstants.Permissions.Endpoints.Revocation,
            OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
            OpenIddictConstants.Permissions.ResponseTypes.Code,
        });

        private static readonly IReadOnlyCollection<string> _defaultRequirements = Array.AsReadOnly(new[]
        {
            OpenIddictConstants.Requirements.Features.ProofKeyForCodeExchange
        });
    }
}

