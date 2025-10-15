#nullable enable
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Articulate.Api.Management.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;

namespace Articulate.Api.Management.Services
{
    /// <summary>
    /// Ensures the Articulate-specific OpenIddict client is registered at application startup.
    /// </summary>
    internal sealed class ArticulateApplicationManager(
        IServiceScopeFactory scopeFactory,
        IOptions<ArticulateOpenIdClientOptions> options,
        ILogger<ArticulateApplicationManager> logger) : IHostedService
    {
        private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
        private readonly IOptions<ArticulateOpenIdClientOptions> _options = options;
        private readonly ILogger<ArticulateApplicationManager> _logger = logger;

        /// <inheritdoc />
        public async Task StartAsync(CancellationToken cancellationToken)
        {
            ArticulateOpenIdClientOptions settings = _options.Value;

            if (!settings.Enabled)
            {
                _logger.LogDebug("Articulate OpenId client registration disabled via configuration.");
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

            object? existing = await applications.FindByClientIdAsync(settings.ClientId, cancellationToken);

            if (existing is null)
            {
                await applications.CreateAsync(descriptor, cancellationToken);
                _logger.LogInformation("Registered OpenIddict client '{ClientId}' for Articulate.", settings.ClientId);
            }
            else
            {
                await applications.UpdateAsync(existing, descriptor, cancellationToken);
                _logger.LogInformation("Updated OpenIddict client '{ClientId}' for Articulate.", settings.ClientId);
            }
        }

        /// <inheritdoc />
        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

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

        private static Uri EnsureTrailingSlash(Uri uri)
        {
            string path = uri.AbsolutePath;

            if (string.IsNullOrEmpty(path) || path.EndsWith('/'))
            {
                return uri;
            }

            var builder = new UriBuilder(uri)
            {
                Path = path + "/"
            };

            return builder.Uri;
        }
    }
}



