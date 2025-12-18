#nullable enable
using Articulate.Api.Management.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Articulate.Api.Management.Services
{
    /// <summary>
    /// Ensures the Articulate-specific OpenIddict client is registered at application startup.
    /// </summary>
    internal sealed class ArticulateApplicationManager(
        IServiceScopeFactory scopeFactory,
        IOptions<ArticulateOpenIdClientOptions> options,
        IRuntimeState runtimeState,
        ILogger<ArticulateApplicationManager> logger) :
        INotificationAsyncHandler<UmbracoApplicationStartedNotification>
    {
        private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
        private readonly IOptions<ArticulateOpenIdClientOptions> _options = options;
        private readonly ILogger<ArticulateApplicationManager> _logger = logger;
        private readonly IRuntimeState _runtimeState = runtimeState;

        /// <inheritdoc />
        public Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken) =>
            EnsureOpenIdClientAsync(cancellationToken);
        private async Task EnsureOpenIdClientAsync(CancellationToken cancellationToken)
        {
            ArticulateOpenIdClientOptions settings = _options.Value;

            if (_runtimeState.Level == RuntimeLevel.Install)
            {
                _logger.LogWarning("Skipping Articulate OpenId client registration: Umbraco installer is running.");
                return;
            }

            if (_runtimeState.Level < RuntimeLevel.Run)
            {
                _logger.LogWarning("Skipping Articulate OpenId client registration: runtime level '{Level}' is below Run.", _runtimeState.Level);
                return;
            }

            if (!settings.Enabled)
            {
                _logger.LogWarning("Articulate OpenId client registration disabled via configuration.");
                return;
            }

            if (string.IsNullOrWhiteSpace(settings.ClientId))
            {
                _logger.LogWarning("Articulate OpenId client registration skipped because no client id was configured.");
                return;
            }

            await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();
            IOpenIddictApplicationManager applications = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();

            OpenIddictApplicationDescriptor? descriptor = BuildDescriptor(settings);
            if (descriptor is null)
            {
                _logger.LogWarning(
                    "Articulate OpenId client '{ClientId}' was not created. Provide at least one valid redirect URI.",
                    settings.ClientId);
                return;
            }

            object? existing = await applications.FindByClientIdAsync(settings.ClientId, cancellationToken).ConfigureAwait(false);

            if (existing is null)
            {
                _ = await applications.CreateAsync(descriptor, cancellationToken).ConfigureAwait(false);
                _logger.LogInformation("Registered OpenIddict client '{ClientId}' for Articulate.", settings.ClientId);
            }
            else
            {
                await applications.UpdateAsync(existing, descriptor, cancellationToken).ConfigureAwait(false);
                _logger.LogInformation("Updated OpenIddict client '{ClientId}' for Articulate.", settings.ClientId);
            }
        }

        private OpenIddictApplicationDescriptor? BuildDescriptor(ArticulateOpenIdClientOptions settings)
        {
            var descriptor = new OpenIddictApplicationDescriptor
            {
                ClientId = settings.ClientId,
                DisplayName = string.IsNullOrWhiteSpace(settings.DisplayName) ? settings.ClientId : settings.DisplayName,
                ClientType = settings.ClientType
            };

            if (settings.HasClientSecret())
            {
                descriptor.ClientSecret = settings.ClientSecret;
            }

            if (!TryPopulateMandatoryUris(descriptor.RedirectUris, settings.RedirectUris, settings.ClientId ?? string.Empty))
            {
                return null;
            }

            TryPopulateOptionalUris(descriptor.PostLogoutRedirectUris, settings.PostLogoutRedirectUris, settings.ClientId ?? string.Empty);

            if (settings.Permissions.Count > 0)
            {
                descriptor.Permissions.UnionWith(settings.Permissions);
            }

            if (settings.Requirements.Count > 0)
            {
                descriptor.Requirements.UnionWith(settings.Requirements);
            }

            return descriptor;
        }

        private bool TryPopulateMandatoryUris(ICollection<Uri> target, IEnumerable<string> sources, string clientId)
        {
            bool added = false;

            foreach (string candidate in sources)
            {
                if (Uri.TryCreate(candidate, UriKind.Absolute, out Uri? uri))
                {
                    target.Add(EnsureTrailingSlash(uri));
                    added = true;
                }
                else
                {
                    _logger.LogWarning(
                        "Ignoring invalid redirect URI '{Uri}' while registering OpenIddict client '{ClientId}'.",
                        candidate,
                        clientId);
                }
            }

            return added;
        }

        private void TryPopulateOptionalUris(ICollection<Uri> target, IEnumerable<string> sources, string clientId)
        {
            foreach (string candidate in sources)
            {
                if (Uri.TryCreate(candidate, UriKind.Absolute, out Uri? uri))
                {
                    target.Add(EnsureTrailingSlash(uri));
                }
                else
                {
                    _logger.LogWarning(
                        "Ignoring invalid post-logout redirect URI '{Uri}' while registering OpenIddict client '{ClientId}'.",
                        candidate,
                        clientId);
                }
            }
        }


        // ?? dup  of extension method
        private static Uri EnsureTrailingSlash(Uri uri)
        {
            var path = uri.AbsolutePath;
            if (path.Length > 0 && path[^1] == '/')
            {
                return uri;
            }

            var builder = new UriBuilder(uri) { Path = path.EnsureEndsWith('/') };
            return builder.Uri;
        }
    }
}
