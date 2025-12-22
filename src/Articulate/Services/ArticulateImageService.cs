//#nullable enable
//using Articulate.Extensions;
//using Articulate.Validators;
//using Microsoft.Extensions.Logging;
//using Umbraco.Cms.Api.Management.Routing;
//using Umbraco.Cms.Core;
//using Umbraco.Cms.Core.IO;
//using Umbraco.Cms.Core.Models;
//using Umbraco.Cms.Core.PropertyEditors;
//using Umbraco.Cms.Core.Services;
//using Umbraco.Cms.Core.Strings;

//namespace Articulate.Services
//{
//    public class ArticulateImageService : IArticulateImageService
//    {
//        private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
//        // IOptions<GlobalSettings> globalSettings MaxRequestLength
//        private const long DefaultMaxSizeBytes = 10 * 1024 * 1024; // 10MB

//        private readonly ILogger<ArticulateImageService> _logger;
//        private readonly IMediaService _mediaService;
//        private readonly MediaFileManager _mediaFileManager;
//        private readonly IShortStringHelper _shortStringHelper;
//        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
//        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
//        private readonly IAbsoluteUrlBuilder _absoluteUrlBuilder;
//        private readonly IHttpClientFactory _httpClientFactory;

//        public ArticulateImageService(
//            ILogger<ArticulateImageService> logger,
//            IMediaService mediaService,
//            MediaFileManager mediaFileManager,
//            IShortStringHelper shortStringHelper,
//            MediaUrlGeneratorCollection mediaUrlGenerators,
//            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
//            IAbsoluteUrlBuilder absoluteUrlBuilder,
//            IHttpClientFactory httpClientFactory)
//        {
//            _logger = logger;
//            _mediaService = mediaService;
//            _mediaFileManager = mediaFileManager;
//            _shortStringHelper = shortStringHelper;
//            _mediaUrlGenerators = mediaUrlGenerators;
//            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
//            _absoluteUrlBuilder = absoluteUrlBuilder;
//            _httpClientFactory = httpClientFactory;
//        }

//        public Task<ImageValidationResult> ValidateImageAsync(Stream stream, string originalExtension, long maxSizeBytes = DefaultMaxSizeBytes)
//        {
//            // 1. Extension validation
//            var extension = originalExtension.ToLowerInvariant();
//            if (!extension.StartsWith('.'))
//            {
//                extension = $".{extension}";
//            }

//            if (!AllowedExtensions.Contains(extension))
//            {
//                return Task.FromResult(ImageValidationResult.Failure($"Extension '{extension}' not allowed. Supported: {string.Join(", ", AllowedExtensions)}"));
//            }

//            // 2. Size validation
//            if (stream.Length > maxSizeBytes)
//            {
//                return Task.FromResult(ImageValidationResult.Failure($"Image size {stream.Length} bytes exceeds maximum {maxSizeBytes} bytes ({maxSizeBytes / (1024.0 * 1024.0):F1} MB)"));
//            }

//            stream.Position = 0;

//            // 3. Magic byte validation
//            ImageMagicByteValidator.ImageFormat detectedFormat = ImageMagicByteValidator.DetectFormat(stream);
//            if (detectedFormat == ImageMagicByteValidator.ImageFormat.Unknown)
//            {
//                return Task.FromResult(ImageValidationResult.Failure("File does not appear to be a valid image (failed magic byte validation)"));
//            }

//            // 4. Verify extension matches content
//            if (!ImageMagicByteValidator.ValidateExtensionMatchesContent(stream, extension))
//            {
//                return Task.FromResult(ImageValidationResult.Failure($"Extension '{extension}' does not match content. Detected format: {detectedFormat}. Possible extension spoofing."));
//            }

//            // 5. Use detected format for extension (prevents extension spoofing)
//            var correctExtension = ImageMagicByteValidator.GetCorrectExtension(stream) ?? extension;

//            stream.Position = 0;
//            return Task.FromResult(ImageValidationResult.Success(stream, correctExtension));
//        }

//        public async Task<ImageValidationResult> DecodeAndValidateBase64ImageAsync(string base64Content, string originalFileName, long maxSizeBytes = DefaultMaxSizeBytes)
//        {
//            if (string.IsNullOrWhiteSpace(base64Content))
//            {
//                return ImageValidationResult.Failure("Base64 content is empty");
//            }

//            // Base64 is ~1.33x larger than binary, check string length first
//            var maxBase64Chars = maxSizeBytes * 4 / 3;
//            if (base64Content.Length > maxBase64Chars)
//            {
//                return ImageValidationResult.Failure($"Base64 content too large: {base64Content.Length} chars (max {maxBase64Chars})");
//            }

//            byte[] bytes;
//            try
//            {
//                bytes = Convert.FromBase64String(base64Content);
//            }
//            catch (FormatException)
//            {
//                return ImageValidationResult.Failure("Invalid base64 content");
//            }

//            // Double-check after decode
//            if (bytes.Length > maxSizeBytes)
//            {
//                return ImageValidationResult.Failure($"Decoded image exceeds limit: {bytes.Length} bytes (max {maxSizeBytes})");
//            }

//            var stream = new MemoryStream(bytes);
//            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

//            return await ValidateImageAsync(stream, extension, maxSizeBytes).ConfigureAwait(false);
//        }

//        public async Task<ImageValidationResult> DownloadAndValidateImageAsync(Uri imageUrl, long maxSizeBytes = DefaultMaxSizeBytes, CancellationToken cancellationToken = default)
//        {
//            if (!imageUrl.IsAbsoluteUri)
//            {
//                return ImageValidationResult.Failure("Image URL must be absolute");
//            }
//            // SSRF protection: Only allow HTTP/HTTPS schemes
//            if (imageUrl.Scheme != Uri.UriSchemeHttp && imageUrl.Scheme != Uri.UriSchemeHttps)
//            {
//                return ImageValidationResult.Failure("Only HTTP and HTTPS URLs are allowed");
//            }
//            try
//            {
//                HttpClient client = _httpClientFactory.CreateClient();

//                // Use ResponseHeadersRead to check Content-Length before downloading entire file
//                using HttpResponseMessage response = await client.GetAsync(
//                    imageUrl,
//                    HttpCompletionOption.ResponseHeadersRead,
//                    cancellationToken).ConfigureAwait(false);

//                response.EnsureSuccessStatusCode();

//                // Check Content-Length header if available
//                if (response.Content.Headers.ContentLength > maxSizeBytes)
//                {
//                    return ImageValidationResult.Failure($"Remote image too large: {response.Content.Headers.ContentLength} bytes (max {maxSizeBytes})");
//                }
//                // Block private/internal IP ranges
//                //    if (IsPrivateOrReservedHost(imageUrl.Host))
//                //{
//                //return ImageValidationResult.Failure("URLs pointing to internal networks are not allowed");
//                //}

//                var contentLength = response.Content.Headers.ContentLength;
//                var intendedCapacity = contentLength.HasValue ? Math.Min(maxSizeBytes, contentLength.Value) : 0;
//                var capacity = (int)Math.Min(int.MaxValue, intendedCapacity);
//                MemoryStream memStream = capacity > 0 ? new MemoryStream(capacity) : new MemoryStream();

//                await using Stream downloadStream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
//                await downloadStream.CopyWithLimitAsync(memStream, maxSizeBytes, cancellationToken).ConfigureAwait(false);
//                memStream.Position = 0;

//                var extension = Path.GetExtension(imageUrl.AbsolutePath).ToLowerInvariant();
//                return await ValidateImageAsync(memStream, extension, maxSizeBytes).ConfigureAwait(false);
//            }
//            catch (InvalidDataException)
//            {
//                return ImageValidationResult.Failure($"Remote image exceeded size limit during download");
//            }
//            catch (HttpRequestException ex)
//            {
//                _logger.LogWarning(ex, "HTTP error downloading image from {Url}", imageUrl);
//                return ImageValidationResult.Failure("Failed to download image from the provided URL");
//            }
//            catch (Exception ex)
//            {
//                _logger.LogWarning(ex, "Error downloading image from {Url}", imageUrl);
//                return ImageValidationResult.Failure("Unexpected error downloading image");
//            }
//        }

//        public Task<MediaSaveResult> SaveToMediaLibraryAsync(Stream imageStream, string mediaName, string extension, IMedia? parentFolder = null)
//        {
//            try
//            {
//                // Sanitize media name
//                var safeName = AltTextSanitizer.Sanitize(mediaName, $"image-{Guid.NewGuid():N}"[..20], maxLength: 100);

//                // Create safe filename
//                var safeFileName = CreateSafeFileName(extension);

//                // Determine parent folder (use provided or root)
//                var parentId = parentFolder?.Id ?? Umbraco.Cms.Core.Constants.System.Root;

//                // Create media item
//                IMedia media = _mediaService.CreateMedia(safeName, parentId, Umbraco.Cms.Core.Constants.Conventions.MediaTypes.Image);
//                media.SetValue(
//                    _mediaFileManager,
//                    _mediaUrlGenerators,
//                    _shortStringHelper,
//                    _contentTypeBaseServiceProvider,
//                    Umbraco.Cms.Core.Constants.Conventions.Media.File,
//                    safeFileName,
//                    imageStream);

//                Attempt<OperationResult?> saveResult = _mediaService.Save(media);
//                if (!saveResult.Success)
//                {
//                    return Task.FromResult(MediaSaveResult.Failed($"Failed to save media item: {safeName}"));
//                }

//                // Get UDI (caller will need to get the URL using UmbracoHelper if needed)
//                var udi = Udi.Create(Umbraco.Cms.Core.Constants.UdiEntityType.Media, media.Key).ToString();

//                // Return media and UDI - caller can retrieve URL if needed
//                return Task.FromResult(MediaSaveResult.Succeeded(media, udi, string.Empty));
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error saving image to media library");
//                return Task.FromResult(MediaSaveResult.Failed($"Unexpected error: {ex.Message}"));
//            }
//        }

//        public Task<string> SaveToFileSystemAsync(Stream imageStream, string extension)
//        {
//            try
//            {
//                var rndId = Guid.NewGuid().ToString("N");
//                var safeFileName = CreateSafeFileName(extension);
//                var fileUrl = $"articulate/{rndId}/{safeFileName}";

//                imageStream.Position = 0;
//                _mediaFileManager.FileSystem.AddFile(fileUrl, imageStream);

//                var fileSystemUrl = _mediaFileManager.FileSystem.GetUrl(fileUrl);
//                var absoluteUrl = _absoluteUrlBuilder.ToAbsoluteUrl(fileSystemUrl).ToString();

//                return Task.FromResult(absoluteUrl);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error saving image to file system");
//                return Task.FromResult(string.Empty);
//            }
//        }

//        public string CreateSafeFileName(string extension)
//        {
//            var rndId = Guid.NewGuid().ToString("N");
//            return $"{rndId}{extension}".ToSafeFileName(_shortStringHelper);
//        }
//    }
//}
