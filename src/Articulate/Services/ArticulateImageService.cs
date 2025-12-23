#nullable enable
using System.Text.RegularExpressions;
using Articulate.Extensions;
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
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Task = System.Threading.Tasks.Task;

namespace Articulate.Services
{
    public class ArticulateImageService(
        ILogger<ArticulateImageService> logger,
        IMediaService mediaService,
        MediaFileManager mediaFileManager,
        IShortStringHelper shortStringHelper,
        MediaUrlGeneratorCollection mediaUrlGenerators,
        IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
        IAbsoluteUrlBuilder absoluteUrlBuilder,
        IHttpClientFactory httpClientFactory,
        IFileFormatInspector formatInspector,
        IOptions<RuntimeSettings> runtimeSettings)
        : IArticulateImageService
    {
        private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
        private const long DefaultMaxSizeBytes = 10 * 1024 * 1024; // 10MB

        private readonly RuntimeSettings _runtimeSettings = runtimeSettings.Value;

        private long MaxImageSizeBytes => _runtimeSettings.MaxRequestLength > 0
            ? _runtimeSettings.MaxRequestLength.Value * 1024L
            : DefaultMaxSizeBytes;

        public Task<ImageValidationResult> ValidateImageAsync(Stream stream, string originalExtension, long maxSizeBytes = 0)
        {
            if (maxSizeBytes <= 0)
            {
                maxSizeBytes = MaxImageSizeBytes;
            }

            // 1. Extension validation
            var extension = originalExtension.ToLowerInvariant();
            if (!extension.StartsWith('.'))
            {
                extension = $".{extension}";
            }

            if (!AllowedExtensions.Contains(extension))
            {
                return Task.FromResult(ImageValidationResult.Failure($"Extension '{extension}' not allowed. Supported: {string.Join(", ", AllowedExtensions)}"));
            }

            // 2. Size validation
            if (stream.Length > maxSizeBytes)
            {
                return Task.FromResult(ImageValidationResult.Failure($"Image size {stream.Length} bytes exceeds maximum {maxSizeBytes} bytes"));
            }

            stream.Position = 0;

            // 3. Magic byte validation using FileSignatures
            FileFormat? format = formatInspector.DetermineFileFormat(stream);
            if (format is not Image)
            {
                return Task.FromResult(ImageValidationResult.Failure("File does not appear to be a valid image (failed magic byte validation)"));
            }

            // 4. Use detected format for extension (prevents extension spoofing)
            var correctExtension = $".{format.Extension}";

            stream.Position = 0;
            return Task.FromResult(ImageValidationResult.Success(stream, correctExtension));
        }

        public async Task<ImageValidationResult> DecodeAndValidateBase64ImageAsync(string base64Content, string originalFileName, long maxSizeBytes = 0)
        {
            if (maxSizeBytes <= 0)
            {
                maxSizeBytes = MaxImageSizeBytes;
            }

            if (string.IsNullOrWhiteSpace(base64Content))
            {
                return ImageValidationResult.Failure("Base64 content is empty");
            }

            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(base64Content);
            }
            catch (FormatException)
            {
                return ImageValidationResult.Failure("Invalid base64 content");
            }

            if (bytes.Length > maxSizeBytes)
            {
                return ImageValidationResult.Failure($"Decoded image exceeds limit: {bytes.Length} bytes");
            }

            var stream = new MemoryStream(bytes);
            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

            return await ValidateImageAsync(stream, extension, maxSizeBytes).ConfigureAwait(false);
        }

        public async Task<ImageValidationResult> DownloadAndValidateImageAsync(Uri imageUrl, long maxSizeBytes = 0, CancellationToken cancellationToken = default)
        {
            if (maxSizeBytes <= 0)
            {
                maxSizeBytes = MaxImageSizeBytes;
            }

            if (!imageUrl.IsAbsoluteUri || (imageUrl.Scheme != Uri.UriSchemeHttp && imageUrl.Scheme != Uri.UriSchemeHttps))
            {
                return ImageValidationResult.Failure("Invalid or non-HTTP image URL");
            }

            try
            {
                HttpClient client = httpClientFactory.CreateClient();

                using HttpResponseMessage response = await client.GetAsync(
                    imageUrl,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken).ConfigureAwait(false);

                response.EnsureSuccessStatusCode();

                if (response.Content.Headers.ContentLength > maxSizeBytes)
                {
                    return ImageValidationResult.Failure($"Remote image too large: {response.Content.Headers.ContentLength} bytes");
                }

                var memStream = new MemoryStream();
                await using Stream downloadStream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
                await downloadStream.CopyWithLimitAsync(memStream, maxSizeBytes, cancellationToken).ConfigureAwait(false);
                memStream.Position = 0;

                var extension = Path.GetExtension(imageUrl.AbsolutePath).ToLowerInvariant();
                return await ValidateImageAsync(memStream, extension, maxSizeBytes).ConfigureAwait(false);
            }
            catch (InvalidDataException)
            {
                return ImageValidationResult.Failure("Remote image exceeded size limit during download");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error downloading image from {Url}", imageUrl);
                return ImageValidationResult.Failure("Failed to download image");
            }
        }

        public Task<MediaSaveResult> SaveToMediaLibraryAsync(Stream imageStream, string mediaName, string extension, IMedia? parentFolder = null)
        {
            try
            {
                // Sanitize media name
                var safeName = SanitizeAltText(mediaName, $"image-{Guid.NewGuid():N}"[..15], maxLength: 100);

                // Create safe filename
                var safeFileName = CreateSafeFileName(extension);

                // Determine parent folder
                var parentId = parentFolder?.Id ?? Constants.System.Root;

                // Create media item
                IMedia media = mediaService.CreateMedia(safeName, parentId, Constants.Conventions.MediaTypes.Image);
                media.SetValue(
                    mediaFileManager,
                    mediaUrlGenerators,
                    shortStringHelper,
                    contentTypeBaseServiceProvider,
                    Constants.Conventions.Media.File,
                    safeFileName,
                    imageStream);

                Attempt<OperationResult?> saveResult = mediaService.Save(media);
                if (!saveResult.Success)
                {
                    return Task.FromResult(MediaSaveResult.Failed($"Failed to save media item: {safeName}"));
                }

                var udi = Udi.Create(Constants.UdiEntityType.Media, media.Key).ToString();

                return Task.FromResult(MediaSaveResult.Succeeded(media, udi));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving image to media library");
                return Task.FromResult(MediaSaveResult.Failed($"Unexpected error: {ex.Message}"));
            }
        }

        public Task<string> SaveToFileSystemAsync(Stream imageStream, string extension)
        {
            try
            {
                var rndId = Guid.NewGuid().ToString("N");
                var safeFileName = CreateSafeFileName(extension);
                var fileUrl = $"articulate/{rndId}/{safeFileName}";

                imageStream.Position = 0;
                mediaFileManager.FileSystem.AddFile(fileUrl, imageStream);

                var fileSystemUrl = mediaFileManager.FileSystem.GetUrl(fileUrl);
                var absoluteUrl = absoluteUrlBuilder.ToAbsoluteUrl(fileSystemUrl).ToString();

                return Task.FromResult(absoluteUrl);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving image to file system");
                return Task.FromResult(string.Empty);
            }
        }

        public string CreateSafeFileName(string extension)
        {
            var rndId = Guid.NewGuid().ToString("N");
            return $"{rndId}{extension}".ToSafeFileName(shortStringHelper);
        }

        public string SanitizeAltText(string? altText, string fallback = "image", int maxLength = 200)
        {
            if (string.IsNullOrWhiteSpace(altText))
            {
                return fallback;
            }

            var sanitized = altText.Trim();

            // 1. Limit length
            if (sanitized.Length > maxLength)
            {
                sanitized = sanitized[..maxLength];
            }

            // 2. Remove path separators and dangerous filename characters
            sanitized = Regex.Replace(sanitized, @"[/\\:\*\?""<>\|]", "_");

            // 3. Remove control characters (0x00-0x1F, 0x7F)
            sanitized = Regex.Replace(sanitized, @"[\x00-\x1F\x7F]", string.Empty);

            // 4. Prevent directory traversal
            sanitized = sanitized.Replace("..", "_");

            // 5. Remove leading/trailing dots and spaces (problematic on Windows)
            sanitized = sanitized.Trim('.', ' ');

            // 6. Final safety check
            if (string.IsNullOrWhiteSpace(sanitized))
            {
                return fallback;
            }

            return sanitized;
        }
    }
}
