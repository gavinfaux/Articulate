#nullable enable
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Articulate.Services
{
    public sealed class ArticulateImportMediaService(
        ILogger<ArticulateImportMediaService> logger,
        IMediaService mediaService,
        MediaFileManager mediaFileManager,
        IShortStringHelper shortStringHelper,
        MediaUrlGeneratorCollection mediaUrlGenerators,
        IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
        IAbsoluteUrlBuilder absoluteUrlBuilder,
        IHttpClientFactory httpClientFactory)
        : IArticulateImportMediaService
    {
        // Hardcoded allowed extensions (TODO: future: make configurable)
        private static readonly string[] _allowedExtensions = ["png", "jpg", "jpeg", "gif"];

        /// <summary>
        /// Gets the MIME type for an image based on its file extension.
        /// </summary>
        public static string GetMimeTypeFromExtension(string filePathOrExtension)
        {
            // TODO: future: consider magic-bytes checks to determine MIME type and better security (e.g. https://github.com/neilharvey/FileSignatures)
            var ext = Path.GetExtension(filePathOrExtension).Trim('.').ToLowerInvariant();
            if (string.IsNullOrEmpty(ext))
            {
                ext = filePathOrExtension.Trim('.').ToLowerInvariant();
            }

            return ext switch
            {
                "jpg" or "jpeg" => "image/jpeg",
                "png" => "image/png",
                "gif" => "image/gif",
                _ => string.Empty
            };
        }

        public ValueTask<ImportMediaValidationResult> ValidateImageAsync(
            Stream stream,
            string originalExtension)
        {
            var extension = originalExtension.ToLowerInvariant();
            if (!extension.StartsWith('.'))
            {
                extension = $".{extension}";
            }

            // Extension validation
            string[] allowedExtensions = _allowedExtensions
                .Select(ext => ext.StartsWith(".") ? ext.ToLowerInvariant() : $".{ext.ToLowerInvariant()}")
                .ToArray();

            if (!allowedExtensions.Contains(extension))
            {
                return ValueTask.FromResult(ImportMediaValidationResult.Failure(
                    $"Extension '{extension}' not allowed. Supported: {string.Join(", ", allowedExtensions)}"));
            }

            // Derive MIME type from extension
            var mimeType = GetMimeTypeFromExtension(extension);

            stream.Position = 0;
            return ValueTask.FromResult(ImportMediaValidationResult.Success(stream, extension, mimeType));
        }

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

            return await ValidateImageAsync(stream, extension);
        }

        // Security Note: This method downloads from external URLs for BlogML migration.
        // SSRF risk is accepted currently because:
        // 1. BlogML import is admin-only (requires authentication)
        // 2. Migration requires downloading from old blog domains
        public async Task<ImportMediaValidationResult> DownloadAndValidateImageAsync(
            Uri imageUrl,
            CancellationToken cancellationToken = default)
        {
            if (!IsValidImageUrl(imageUrl))
            {
                return ImportMediaValidationResult.Failure("Invalid or non-HTTP image URL");
            }

            try
            {
                using HttpClient client = httpClientFactory.CreateClient();
                using HttpResponseMessage response = await client.GetAsync(
                    imageUrl,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    return ImportMediaValidationResult.Failure($"HTTP error: {response.StatusCode}");
                }

                // Download directly to memory stream
                var memoryStream = new MemoryStream();
                await using Stream httpStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                await httpStream.CopyToAsync(memoryStream, cancellationToken);

                // Rewind and validate
                memoryStream.Position = 0;
                string extension = Path.GetExtension(imageUrl.AbsolutePath).ToLowerInvariant();
                ImportMediaValidationResult result = await ValidateImageAsync(memoryStream, extension);

                if (!result.IsValid)
                {
                    await memoryStream.DisposeAsync();
                    return result;
                }

                // Return the memory stream (caller owns it now)
                memoryStream.Position = 0;
                return ImportMediaValidationResult.Success(memoryStream, result.CorrectExtension!, result.MimeType!);
            }
            catch (HttpRequestException ex)
            {
                return ImportMediaValidationResult.Failure($"Failed to download image: {ex.Message}");
            }
            catch (TaskCanceledException)
            {
                return ImportMediaValidationResult.Failure("Image download timed out");
            }
        }

        private static bool IsValidImageUrl(Uri imageUrl) =>
            imageUrl.IsAbsoluteUri &&
            (imageUrl.Scheme == Uri.UriSchemeHttp || imageUrl.Scheme == Uri.UriSchemeHttps);

        public Task<ImportMediaSaveResult> SaveToMediaLibraryAsync(
            Stream imageStream,
            string mediaName,
            string extension,
            IMedia? parentFolder = null)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(mediaName))
                {
                    throw new ArgumentException("Media name cannot be empty", nameof(mediaName));
                }

                // Filename for physical file - use Umbraco's ToSafeFileName for filesystem safety
                // Strip extension from input mediaName first to avoid doubling up (e.g., image.png -> image-png.png)
                var cleanMediaName = Path.GetFileNameWithoutExtension(mediaName);
                if (string.IsNullOrWhiteSpace(cleanMediaName))
                {
                    cleanMediaName = "image";
                }

                var safeFileName = $"{cleanMediaName.ToSafeFileName(shortStringHelper)}{extension}";

                // Display name for Umbraco backoffice - use ToFriendlyName for consistency with core
                // ToFriendlyName strips extensions, replaces _/- with spaces, and applies Title Case
                var displayName = safeFileName.ToFriendlyName();
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    displayName = "Image";
                }

                if (displayName.Length > 100)
                {
                    displayName = displayName[..100];
                }

                // Determine parent folder
                var parentId = parentFolder?.Id ?? Constants.System.Root;

                // Create media item with user-friendly display name
                IMedia media = mediaService.CreateMedia(displayName, parentId, Constants.Conventions.MediaTypes.Image);
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
                    return Task.FromResult(ImportMediaSaveResult.Failed($"Failed to save media item: {displayName}"));
                }

                var udi = Udi.Create(Constants.UdiEntityType.Media, media.Key).ToString();

                return Task.FromResult(ImportMediaSaveResult.Succeeded(media, udi));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving image to media library");
                return Task.FromResult(ImportMediaSaveResult.Failed($"Unexpected error: {ex.Message}"));
            }
        }

        public Task<string> SaveToFileSystemAsync(Stream imageStream, string extension, string? originalFileName = null)
        {
            try
            {
                // Use 8-char GUID folder for file isolation (similar to Umbraco media pattern)
                var uniqueFolder = Guid.NewGuid().ToString("N")[..8];
                string safeFileName;

                if (!string.IsNullOrWhiteSpace(originalFileName))
                {
                    // Sanitize the original filename
                    var fileNameWithoutExt = Path.GetFileNameWithoutExtension(originalFileName);
                    var sanitized = fileNameWithoutExt.ToSafeFileName(shortStringHelper);
                    safeFileName = $"{sanitized}{extension}";
                }
                else
                {
                    // Fallback to GUID if no original filename provided
                    safeFileName = CreateSafeFileName(extension);
                }

                var fileUrl = $"articulate/{uniqueFolder}/{safeFileName}";

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
    }
}
