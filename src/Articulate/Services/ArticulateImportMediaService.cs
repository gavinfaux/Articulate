#nullable enable
using System.Collections.Frozen;
using System.Net;
using System.Net.Sockets;
using FileSignatures;
using FileSignatures.Formats;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Articulate.Services
{
    /// <summary>
    /// Service for importing media into Articulate.
    /// </summary>
    public sealed class ArticulateImportMediaService : IArticulateImportMediaService
    {
        private static readonly HttpRequestOptionsKey<IPAddress> _pinnedAddressOption =
            new("ArticulatePinnedAddress");
        private const int MaxRedirects = 5;
        private static readonly FrozenSet<string> _fallbackAllowedExtensions =
            FrozenSet.ToFrozenSet([".png", ".jpg", ".jpeg", ".gif"]);
        private static readonly FrozenSet<string> _alwaysBlockedExternalImageHostNames =
            FrozenSet.ToFrozenSet([
                "metadata.amazonaws.com",
                "metadata.google",
                "metadata.google.internal"
            ]);
        private static readonly FrozenSet<string> _alwaysBlockedExternalImageHostSuffixes =
            FrozenSet.ToFrozenSet([
                "localtest.me",
                "lvh.me",
                "nip.io",
                "sslip.io",
                "traefik.me",
                "xip.io"
            ]);
        private static readonly IPAddress _awsIpv6MetadataAddress = IPAddress.Parse("fd00:ec2::254");

        private readonly ILogger<ArticulateImportMediaService> _logger;
        private readonly IMediaService _mediaService;
        private readonly MediaFileManager _mediaFileManager;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly IAbsoluteUrlBuilder _absoluteUrlBuilder;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IOptionsMonitor<ContentSettings> _contentSettings;
        private readonly IOptionsMonitor<RuntimeSettings> _runtimeSettings;
        private readonly IOptionsMonitor<Options.ArticulateOptions> _articulateOptions;
        private readonly IFileFormatInspector _fileFormatInspector;
        private readonly Lazy<IMedia> _articulateMediaFolder;

        public ArticulateImportMediaService(
            ILogger<ArticulateImportMediaService> logger,
            IMediaService mediaService,
            MediaFileManager mediaFileManager,
            IShortStringHelper shortStringHelper,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            IAbsoluteUrlBuilder absoluteUrlBuilder,
            IHttpClientFactory httpClientFactory,
            IFileFormatInspector fileFormatInspector,
            IOptionsMonitor<ContentSettings> contentSettings,
            IOptionsMonitor<RuntimeSettings> runtimeSettings,
            IOptionsMonitor<Options.ArticulateOptions> articulateOptions)
        {
            _logger = logger;
            _mediaService = mediaService;
            _mediaFileManager = mediaFileManager;
            _shortStringHelper = shortStringHelper;
            _mediaUrlGenerators = mediaUrlGenerators;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _absoluteUrlBuilder = absoluteUrlBuilder;
            _httpClientFactory = httpClientFactory;
            _fileFormatInspector = fileFormatInspector;
            _contentSettings = contentSettings;
            _runtimeSettings = runtimeSettings;
            _articulateOptions = articulateOptions;

            _articulateMediaFolder = new Lazy<IMedia>(() =>
            {
                IMedia? root = _mediaService.GetRootMedia().FirstOrDefault(x =>
                    x.Name == ArticulateConstants.Convention.ArticulateMediaFolder &&
                    x.ContentType.Alias.InvariantEquals(Constants.Conventions.MediaTypes.Folder));
                return root ?? _mediaService.CreateMediaWithIdentity(
                    ArticulateConstants.Convention.ArticulateMediaFolder,
                    Constants.System.Root,
                    Constants.Conventions.MediaTypes.Folder);
            });
        }

        /// <inheritdoc/>
        public IMedia GetOrCreateArticulateMediaFolder() => _articulateMediaFolder.Value;

        /// <inheritdoc/>
        public ValueTask<ImportMediaValidationResult> ValidateImageAsync(Stream stream, string originalExtension)
        {
            ContentSettings contentSettings = _contentSettings.CurrentValue;

            var extension = originalExtension.ToLowerInvariant();
            if (!extension.StartsWith('.'))
            {
                extension = $".{extension}";
            }

            if (!contentSettings.IsFileAllowedForUpload(extension))
            {
                return ValueTask.FromResult(ImportMediaValidationResult.Failure(
                    $"Extension '{extension}' is blocked by Umbraco upload settings"));
            }

            FrozenSet<string> allowedExtensions = GetAllowedImageExtensions();
            if (!allowedExtensions.Contains(extension))
            {
                return ValueTask.FromResult(ImportMediaValidationResult.Failure(
                    $"Extension '{extension}' not allowed. Supported: {string.Join(", ", allowedExtensions)}"));
            }

            return ValueTask.FromResult(ValidateImageSignature(stream, extension, allowedExtensions));
        }

        /// <inheritdoc/>
        public async Task<ImportMediaValidationResult> DecodeAndValidateBase64ImageAsync(
            string base64Content,
            string originalFileName)
        {
            if (string.IsNullOrWhiteSpace(base64Content))
            {
                return ImportMediaValidationResult.Failure("Base64 content is empty");
            }

            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(base64Content);
            }
            catch (FormatException)
            {
                return ImportMediaValidationResult.Failure("Invalid base64 content");
            }

            var stream = new MemoryStream(bytes);
            string extension = Path.GetExtension(originalFileName).ToLowerInvariant();

            ImportMediaValidationResult result = await ValidateImageAsync(stream, extension);
            if (!result.IsValid)
            {
                await stream.DisposeAsync();
            }

            return result;
        }

        /// <inheritdoc/>
        public async Task<ImportMediaValidationResult> DownloadAndValidateImageAsync(
            Uri imageUrl,
            CancellationToken cancellationToken = default)
        {
            try
            {
                using HttpClient templateClient = _httpClientFactory.CreateClient();
                using HttpClient client = CreatePinnedHttpClient(templateClient);
                (HttpResponseMessage response, Uri finalUri) = await SendWithValidatedRedirectsAsync(
                    client,
                    imageUrl,
                    cancellationToken);
                using (response)
                {
                    if (!response.IsSuccessStatusCode)
                    {
                        return ImportMediaValidationResult.Failure($"HTTP error: {response.StatusCode}");
                    }

                    long maxExternalImageBytes = _articulateOptions.CurrentValue.MaxExternalImageBytes;
                    if (maxExternalImageBytes <= 0)
                    {
                        return ImportMediaValidationResult.Failure("MaxExternalImageBytes must be greater than zero");
                    }

                    long? contentLength = response.Content.Headers.ContentLength;
                    if (contentLength is { } knownLength && knownLength > maxExternalImageBytes)
                    {
                        return ImportMediaValidationResult.Failure(
                            $"Image download exceeded the configured limit of {maxExternalImageBytes} bytes");
                    }

                    var memoryStream = new MemoryStream();
                    await using Stream httpStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                    bool copiedWithinLimit = await TryCopyToMemoryStreamAsync(
                        httpStream,
                        memoryStream,
                        maxExternalImageBytes,
                        cancellationToken);

                    if (!copiedWithinLimit)
                    {
                        await memoryStream.DisposeAsync();
                        return ImportMediaValidationResult.Failure(
                            $"Image download exceeded the configured limit of {maxExternalImageBytes} bytes");
                    }

                    memoryStream.Position = 0;
                    string extension = Path.GetExtension(finalUri.AbsolutePath).ToLowerInvariant();
                    ImportMediaValidationResult result = await ValidateImageAsync(memoryStream, extension);

                    if (!result.IsValid)
                    {
                        await memoryStream.DisposeAsync();
                        return result;
                    }

                    memoryStream.Position = 0;
                    return ImportMediaValidationResult.Success(
                        memoryStream,
                        result.CorrectExtension!,
                        result.MimeType!);
                }
            }
            catch (HttpRequestException ex)
            {
                return ImportMediaValidationResult.Failure($"Failed to download image: {ex.Message}");
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return ImportMediaValidationResult.Failure("Image download was cancelled");
            }
            catch (TaskCanceledException)
            {
                return ImportMediaValidationResult.Failure("Image download timed out");
            }
        }

        /*
         * Implementation references:
         * - OWASP SSRF Prevention Cheat Sheet:
         *   https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
         * - .NET SocketsHttpHandler.ConnectCallback:
         *   https://learn.microsoft.com/en-us/dotnet/api/system.net.http.socketshttphandler.connectcallback
         * - HTTP redirection semantics (RFC 9110):
         *   https://www.rfc-editor.org/rfc/rfc9110.html#name-redirection-3xx
         * - IANA IPv4 / IPv6 special-purpose registries:
         *   https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
         *   https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml
         * - Umbraco content settings:
         *   https://docs.umbraco.com/umbraco-cms/reference/configuration/contentsettings
         *   https://docs.umbraco.com/umbraco-cms/reference/configuration/imagingsettings
         */
        private async Task<(HttpResponseMessage Response, Uri FinalUri)> SendWithValidatedRedirectsAsync(
            HttpClient client,
            Uri imageUrl,
            CancellationToken cancellationToken)
        {
            // OWASP SSRF guidance recommends validating each redirect target, not just the initial URL.
            // We handle redirects manually so every hop is re-checked against the Umbraco host allowlist,
            // IP safety rules, and pinned-connection transport.
            Uri currentUri = imageUrl;

            for (var redirectCount = 0; redirectCount <= MaxRedirects; redirectCount++)
            {
                IPAddress[] pinnedAddresses = await GetValidatedPinnedAddressesAsync(currentUri, cancellationToken);

                HttpResponseMessage response = await SendPinnedRequestAsync(
                    client,
                    currentUri,
                    pinnedAddresses,
                    cancellationToken);

                if (!IsRedirectStatusCode(response.StatusCode))
                {
                    return (response, currentUri);
                }

                Uri redirectUri = GetValidatedRedirectUri(response, currentUri, redirectCount);
                response.Dispose();
                currentUri = redirectUri;
            }

            throw new HttpRequestException("Image redirect handling failed unexpectedly");
        }

        private async Task<IPAddress[]> GetValidatedPinnedAddressesAsync(Uri imageUrl, CancellationToken cancellationToken)
        {
            (IPAddress[]? pinnedAddresses, string? validationError) =
                await ValidateExternalImageUrlAsync(imageUrl, cancellationToken);

            if (validationError is not null || pinnedAddresses is null || pinnedAddresses.Length == 0)
            {
                throw new HttpRequestException(validationError ?? "Image URL rejected");
            }

            return pinnedAddresses;
        }

        private static Uri GetValidatedRedirectUri(HttpResponseMessage response, Uri currentUri, int redirectCount)
        {
            if (redirectCount == MaxRedirects)
            {
                response.Dispose();
                throw new HttpRequestException("Too many redirects while downloading image");
            }

            if (response.Headers.Location is null)
            {
                response.Dispose();
                throw new HttpRequestException("Redirect response did not contain a Location header");
            }

            Uri redirectUri = response.Headers.Location.IsAbsoluteUri
                ? response.Headers.Location
                : new Uri(currentUri, response.Headers.Location);

            if (currentUri.Scheme == Uri.UriSchemeHttps && redirectUri.Scheme != Uri.UriSchemeHttps)
            {
                response.Dispose();
                throw new HttpRequestException("Image redirects cannot downgrade from HTTPS");
            }

            return redirectUri;
        }

        // Redirect status codes follow HTTP Semantics (RFC 9110 section 15.4), plus 308 Permanent Redirect.
        private static bool IsRedirectStatusCode(HttpStatusCode statusCode) =>
            statusCode == HttpStatusCode.Moved ||
            statusCode == HttpStatusCode.Redirect ||
            statusCode == HttpStatusCode.RedirectMethod ||
            (int)statusCode == 307 ||
            (int)statusCode == 308;

        private async Task<bool> TryCopyToMemoryStreamAsync(
            Stream source,
            MemoryStream destination,
            long maxBytes,
            CancellationToken cancellationToken)
        {
            byte[] buffer = new byte[81920];
            long totalBytes = 0;

            while (true)
            {
                int bytesRead = await source.ReadAsync(buffer, cancellationToken);
                if (bytesRead == 0)
                {
                    break;
                }

                totalBytes += bytesRead;
                if (totalBytes > maxBytes)
                {
                    return false;
                }

                await destination.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
            }

            return true;
        }

        private FrozenSet<string> GetAllowedImageExtensions()
        {
            string[] configuredExtensions = _contentSettings.CurrentValue.Imaging.ImageFileTypes
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.StartsWith('.') ? x.ToLowerInvariant() : $".{x.ToLowerInvariant()}")
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            return configuredExtensions.Length == 0
                ? _fallbackAllowedExtensions
                : configuredExtensions.ToFrozenSet();
        }

        private ImportMediaValidationResult ValidateImageSignature(
            Stream stream,
            string requestedExtension,
            FrozenSet<string> allowedExtensions)
        {
            if (!stream.CanSeek)
            {
                return ImportMediaValidationResult.Failure("Image stream must be seekable");
            }

            stream.Position = 0;
            FileFormat? detectedFormat = _fileFormatInspector.DetermineFileFormat(stream);
            stream.Position = 0;

            if (detectedFormat is not Image imageFormat)
            {
                return ImportMediaValidationResult.Failure(
                    "File does not appear to be a valid image");
            }

            string detectedExtension = NormalizeExtension($".{imageFormat.Extension}");
            string canonicalExtension = GetCanonicalImageExtension(requestedExtension, detectedExtension, allowedExtensions);
            if (!allowedExtensions.Contains(canonicalExtension))
            {
                return ImportMediaValidationResult.Failure(
                    $"Detected image format '{detectedExtension}' not allowed. Supported: {string.Join(", ", allowedExtensions)}");
            }

            string mimeType = canonicalExtension.GetImageMimeType();
            return ImportMediaValidationResult.Success(stream, canonicalExtension, mimeType);
        }

        private async Task<(IPAddress[]? PinnedAddresses, string? Error)> ValidateExternalImageUrlAsync(
            Uri imageUrl,
            CancellationToken cancellationToken)
        {
            // Articulate provides the explicit host allowlist via Articulate:AllowedMediaHosts.
            // After host validation we still resolve and vet the destination IPs per OWASP SSRF guidance.
            Options.ArticulateOptions articulateOptions = _articulateOptions.CurrentValue;
            bool allowUnsafeLocalExternalImageHosts =
                _runtimeSettings.CurrentValue.Mode != RuntimeMode.Production &&
                articulateOptions.AllowUnsafeLocalExternalImageHostsInDevelopment;

            string? validationError = ValidateExternalImageUri(imageUrl);
            if (validationError is not null)
            {
                return (null, validationError);
            }

            ISet<string> allowedHosts = articulateOptions.AllowedMediaHosts.ToHashSet(StringComparer.OrdinalIgnoreCase);
            validationError = ValidateExternalImageHost(imageUrl.Host, allowedHosts, allowUnsafeLocalExternalImageHosts);
            if (validationError is not null)
            {
                return (null, validationError);
            }

            IPAddress[] addresses;
            try
            {
                addresses = await Dns.GetHostAddressesAsync(imageUrl.DnsSafeHost, cancellationToken);
            }
            catch (SocketException ex)
            {
                return (null, $"Could not resolve image host '{imageUrl.Host}': {ex.Message}");
            }

            if (addresses.Length == 0)
            {
                return (null, $"Could not resolve any addresses for image host '{imageUrl.Host}'");
            }

            validationError = ValidateResolvedAddresses(addresses, imageUrl.Host, allowUnsafeLocalExternalImageHosts);
            if (validationError is not null)
            {
                return (null, validationError);
            }

            return (addresses, null);
        }

        private static string? ValidateExternalImageUri(Uri imageUrl) =>
            !imageUrl.IsAbsoluteUri ||
            (imageUrl.Scheme != Uri.UriSchemeHttp && imageUrl.Scheme != Uri.UriSchemeHttps)
                ? "Only absolute HTTP(S) image URLs are allowed"
                : null;

        internal static string? ValidateExternalImageHost(
            string host,
            ISet<string> allowedHosts,
            bool allowUnsafeLocalExternalImageHosts)
        {
            string normalizedHost = NormalizeHost(host);
            if (normalizedHost.Length == 0)
            {
                return "Image URL host cannot be empty";
            }

            if (IsAlwaysBlockedExternalImageHost(normalizedHost))
            {
                return $"Host '{host}' is not allowed for external image downloads";
            }

            if (allowedHosts.Count == 0)
            {
                return "External image downloads are disabled because no allowed media hosts are configured";
            }

            if (allowedHosts.All(x => NormalizeHost(x) != normalizedHost))
            {
                return $"Host '{host}' is not configured in Articulate:AllowedMediaHosts";
            }

            if (IPAddress.TryParse(normalizedHost, out IPAddress? literalAddress) &&
                IsDisallowedAddress(literalAddress, allowUnsafeLocalExternalImageHosts))
            {
                return $"Address '{literalAddress}' for host '{host}' is not allowed";
            }

            if (IsLocalhostName(normalizedHost) && !allowUnsafeLocalExternalImageHosts)
            {
                return $"Host '{host}' is a local host and requires AllowUnsafeLocalExternalImageHostsInDevelopment in a non-production runtime mode";
            }

            return null;
        }

        private string? ValidateResolvedAddresses(
            IEnumerable<IPAddress> addresses,
            string host,
            bool allowUnsafeLocalExternalImageHosts)
        {
            foreach (IPAddress address in addresses)
            {
                if (IsDisallowedAddress(address, allowUnsafeLocalExternalImageHosts))
                {
                    return $"Resolved address '{address}' for host '{host}' is not allowed";
                }
            }

            return null;
        }

        private async Task<HttpResponseMessage> SendPinnedRequestAsync(
            HttpClient client,
            Uri requestUri,
            IReadOnlyList<IPAddress> pinnedAddresses,
            CancellationToken cancellationToken)
        {
            Exception? lastException = null;

            foreach (IPAddress pinnedAddress in pinnedAddresses)
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
                request.Options.Set(_pinnedAddressOption, pinnedAddress);

                try
                {
                    return await client.SendAsync(
                        request,
                        HttpCompletionOption.ResponseHeadersRead,
                        cancellationToken);
                }
                catch (Exception ex) when (ex is HttpRequestException or SocketException)
                {
                    lastException = ex;
                }
            }

            throw new HttpRequestException(
                $"Failed to connect to any resolved address for '{requestUri.Host}'",
                lastException);
        }

        internal static SocketsHttpHandler CreatePinnedHttpHandler() =>
            new()
            {
                AllowAutoRedirect = false,
                AutomaticDecompression = DecompressionMethods.All,
                UseProxy = false,
                ConnectCallback = async (context, cancellationToken) =>
                {
                    if (!context.InitialRequestMessage.Options.TryGetValue(_pinnedAddressOption, out IPAddress? pinnedAddress))
                    {
                        throw new HttpRequestException("No validated IP address was available for the outbound image request");
                    }

                    var socket = new Socket(pinnedAddress.AddressFamily, SocketType.Stream, ProtocolType.Tcp);

                    try
                    {
                        await socket.ConnectAsync(pinnedAddress, context.DnsEndPoint.Port, cancellationToken);
                        return new NetworkStream(socket, ownsSocket: true);
                    }
                    catch
                    {
                        socket.Dispose();
                        throw;
                    }
                }
            };

        internal static HttpClient CreatePinnedHttpClient(HttpClient templateClient)
        {
            SocketsHttpHandler handler = CreatePinnedHttpHandler();

            HttpClient client = new(handler, disposeHandler: true)
            {
                BaseAddress = templateClient.BaseAddress,
                DefaultRequestVersion = templateClient.DefaultRequestVersion,
                DefaultVersionPolicy = templateClient.DefaultVersionPolicy,
                MaxResponseContentBufferSize = templateClient.MaxResponseContentBufferSize,
                Timeout = templateClient.Timeout
            };

            return client;
        }

        internal static string NormalizeHost(string host) => host.Trim().TrimEnd('.').ToLowerInvariant();

        private static bool IsAlwaysBlockedExternalImageHost(string normalizedHost) =>
            _alwaysBlockedExternalImageHostNames.Contains(normalizedHost) ||
            _alwaysBlockedExternalImageHostSuffixes.Any(suffix =>
                normalizedHost == suffix || normalizedHost.EndsWith($".{suffix}", StringComparison.Ordinal));

        private static bool IsLocalhostName(string normalizedHost) =>
            normalizedHost == "localhost" ||
            normalizedHost.EndsWith(".localhost", StringComparison.Ordinal);

        private static string NormalizeExtension(string extension)
        {
            string normalized = extension.ToLowerInvariant();
            return normalized.StartsWith('.') ? normalized : $".{normalized}";
        }

        private static string GetCanonicalImageExtension(
            string requestedExtension,
            string detectedExtension,
            FrozenSet<string> allowedExtensions)
        {
            if (IsEquivalentJpegExtension(requestedExtension, detectedExtension) &&
                allowedExtensions.Contains(requestedExtension))
            {
                return requestedExtension;
            }

            return detectedExtension;
        }

        private static bool IsEquivalentJpegExtension(string requestedExtension, string detectedExtension) =>
            (requestedExtension, detectedExtension) is
            (".jpg", ".jpeg") or
            (".jpeg", ".jpg");

        // Reject special-use and non-public destinations before connect time. This follows the OWASP SSRF
        // prevention guidance and the IANA special-purpose address registries for IPv4/IPv6.
        internal static bool IsDisallowedAddress(IPAddress address, bool allowUnsafeLocalExternalImageHosts)
        {
            if (address.Equals(IPAddress.Any) ||
                address.Equals(IPAddress.IPv6Any) ||
                address.Equals(IPAddress.None) ||
                address.Equals(IPAddress.IPv6None))
            {
                return true;
            }

            if (!allowUnsafeLocalExternalImageHosts && IPAddress.IsLoopback(address))
            {
                return true;
            }

            if (address.AddressFamily == AddressFamily.InterNetworkV6)
            {
                return IsDisallowedIPv6Address(address, allowUnsafeLocalExternalImageHosts);
            }

            if (address.AddressFamily != AddressFamily.InterNetwork)
            {
                return true;
            }

            return IsDisallowedIPv4Address(address, allowUnsafeLocalExternalImageHosts);
        }

        // IPv6 checks focus on non-routable/local scopes such as link-local, site-local, and unique-local.
        private static bool IsDisallowedIPv6Address(IPAddress address, bool allowUnsafeLocalExternalImageHosts)
        {
            if (address.IsIPv6Multicast)
            {
                return true;
            }

            if (address.Equals(IPAddress.IPv6Loopback))
            {
                return false;
            }

            if (TryGetEmbeddedIPv4Address(address, out IPAddress embeddedIPv4Address))
            {
                return IsDisallowedIPv4Address(embeddedIPv4Address, allowUnsafeLocalExternalImageHosts);
            }

            if (IsAlwaysBlockedMetadataIPv6Address(address))
            {
                return true;
            }

            byte[] bytes = address.GetAddressBytes();
            if (allowUnsafeLocalExternalImageHosts)
            {
                return false;
            }

            return address.IsIPv6LinkLocal ||
                address.IsIPv6SiteLocal ||
                bytes[0] == 0 ||
                (bytes[0] & 0xFE) == 0xFC;
        }

        // IPv4 checks cover unspecified, loopback, RFC 1918 private space, carrier-grade NAT, link-local,
        // benchmarking/test ranges, and multicast/reserved space.
        private static bool IsDisallowedIPv4Address(IPAddress address, bool allowUnsafeLocalExternalImageHosts)
        {
            byte[] ipv4 = address.GetAddressBytes();

            if (IsAlwaysBlockedMetadataIPv4Address(ipv4))
            {
                return true;
            }

            if (ipv4[0] == 0 ||
                ipv4[0] >= 224)
            {
                return true;
            }

            if (allowUnsafeLocalExternalImageHosts)
            {
                return false;
            }

            return
                ipv4[0] == 10 ||
                ipv4[0] == 127 ||
                (ipv4[0] == 100 && ipv4[1] >= 64 && ipv4[1] <= 127) ||
                (ipv4[0] == 169 && ipv4[1] == 254) ||
                (ipv4[0] == 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
                (ipv4[0] == 192 && ipv4[1] == 168) ||
                (ipv4[0] == 198 && (ipv4[1] == 18 || ipv4[1] == 19));
        }

        private static bool TryGetEmbeddedIPv4Address(IPAddress address, out IPAddress embeddedIPv4Address)
        {
            if (address.IsIPv4MappedToIPv6)
            {
                embeddedIPv4Address = address.MapToIPv4();
                return true;
            }

            byte[] bytes = address.GetAddressBytes();
            if (IsIPv4CompatibleIPv6Address(bytes) ||
                IsIPv4TranslatedIPv6Address(bytes) ||
                IsWellKnownNat64Address(bytes))
            {
                embeddedIPv4Address = new IPAddress(bytes[^4..]);
                return true;
            }

            embeddedIPv4Address = IPAddress.None;
            return false;
        }

        private static bool IsIPv4CompatibleIPv6Address(byte[] bytes) =>
            bytes.Take(12).All(x => x == 0) &&
            bytes.Skip(12).Any(x => x != 0);

        private static bool IsIPv4TranslatedIPv6Address(byte[] bytes) =>
            bytes.Take(8).All(x => x == 0) &&
            bytes[8] == 0xFF &&
            bytes[9] == 0xFF &&
            bytes[10] == 0 &&
            bytes[11] == 0;

        private static bool IsWellKnownNat64Address(byte[] bytes) =>
            bytes[0] == 0x00 &&
            bytes[1] == 0x64 &&
            bytes[2] == 0xFF &&
            bytes[3] == 0x9B &&
            bytes.Skip(4).Take(8).All(x => x == 0);

        private static bool IsAlwaysBlockedMetadataIPv4Address(byte[] ipv4) =>
            (ipv4[0] == 169 && ipv4[1] == 254 && ipv4[2] == 169 && ipv4[3] == 254) ||
            (ipv4[0] == 169 && ipv4[1] == 254 && ipv4[2] == 170 && ipv4[3] == 2) ||
            (ipv4[0] == 100 && ipv4[1] == 100 && ipv4[2] == 100 && ipv4[3] == 200);

        private static bool IsAlwaysBlockedMetadataIPv6Address(IPAddress address) =>
            address.Equals(_awsIpv6MetadataAddress);

        /// <inheritdoc/>
        public ImportMediaSaveResult SaveToMediaLibrary(
            Stream imageStream,
            string mediaName,
            string extension,
            IMedia? parentFolder = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(mediaName))
                {
                    throw new ArgumentException(@"Media name cannot be empty", nameof(mediaName));
                }

                // Strip extension to avoid doubling up (e.g., image.png -> image-png.png)
                var cleanMediaName = Path.GetFileNameWithoutExtension(mediaName);
                if (string.IsNullOrWhiteSpace(cleanMediaName))
                {
                    cleanMediaName = "image";
                }

                var safeFileName = $"{cleanMediaName.ToSafeFileName(_shortStringHelper)}{extension}";

                // Display name for backoffice - ToFriendlyName strips extensions and applies Title Case
                var displayName = safeFileName.ToFriendlyName();
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    displayName = "Image";
                }

                if (displayName.Length > 100)
                {
                    displayName = displayName[..100];
                }

                var parentId = parentFolder?.Id ?? Constants.System.Root;

                IMedia media = _mediaService.CreateMedia(displayName, parentId, Constants.Conventions.MediaTypes.Image);
                media.SetValue(
                    _mediaFileManager,
                    _mediaUrlGenerators,
                    _shortStringHelper,
                    _contentTypeBaseServiceProvider,
                    Constants.Conventions.Media.File,
                    safeFileName,
                    imageStream);

                Attempt<OperationResult?> saveResult = _mediaService.Save(media);
                if (!saveResult.Success)
                {
                    return ImportMediaSaveResult.Failed($"Failed to save media item: {displayName}");
                }

                var udi = Udi.Create(Constants.UdiEntityType.Media, media.Key).ToString();
                return ImportMediaSaveResult.Succeeded(media, udi);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image to media library");
                return ImportMediaSaveResult.Failed($"Unexpected error: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public string SaveToFileSystem(Stream imageStream, string extension, string? originalFileName = null)
        {
            try
            {
                // 8-char GUID folder for file isolation
                var uniqueFolder = Guid.NewGuid().ToString("N")[..8];
                string safeFileName;

                if (!string.IsNullOrWhiteSpace(originalFileName))
                {
                    var fileNameWithoutExt = Path.GetFileNameWithoutExtension(originalFileName);
                    var sanitized = fileNameWithoutExt.ToSafeFileName(_shortStringHelper);
                    safeFileName = $"{sanitized}{extension}";
                }
                else
                {
                    safeFileName = $"{Guid.NewGuid():N}{extension}".ToSafeFileName(_shortStringHelper);
                }

                var fileUrl = $"articulate/{uniqueFolder}/{safeFileName}";

                imageStream.Position = 0;
                _mediaFileManager.FileSystem.AddFile(fileUrl, imageStream);

                var fileSystemUrl = _mediaFileManager.FileSystem.GetUrl(fileUrl);
                return _absoluteUrlBuilder.ToAbsoluteUrl(fileSystemUrl).ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image to file system");
                return string.Empty;
            }
        }
    }
}
