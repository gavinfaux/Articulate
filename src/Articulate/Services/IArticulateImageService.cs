#nullable enable
using Umbraco.Cms.Core.Models;

namespace Articulate.Services
{
    /// <summary>
    /// Service for processing and validating images across Articulate features (BlogML import, MetaWeblog, Markdown editor).
    /// Centralizes image validation, processing, and storage logic to follow DRY principles.
    /// </summary>
    public interface IArticulateImageService
    {
        /// <summary>
        /// Validates an image stream (magic bytes, extension matching).
        /// </summary>
        public Task<ImageValidationResult> ValidateImageAsync(Stream stream, string originalExtension, long maxSizeBytes);

        /// <summary>
        /// Decodes and validates a base64-encoded image.
        /// </summary>
        public Task<ImageValidationResult> DecodeAndValidateBase64ImageAsync(string base64Content, string originalFileName, long maxSizeBytes);

        /// <summary>
        /// Downloads and validates an image from an external URL.
        /// </summary>
        public Task<ImageValidationResult> DownloadAndValidateImageAsync(Uri imageUrl, long maxSizeBytes, CancellationToken cancellationToken = default);

        /// <summary>
        /// Saves a validated image to the Umbraco media library.
        /// </summary>
        public Task<MediaSaveResult> SaveToMediaLibraryAsync(Stream imageStream, string mediaName, string extension, IMedia? parentFolder = null);

        /// <summary>
        /// Saves a validated image to the Articulate file system (articulate/{guid}/{filename}).
        /// </summary>
        /// <returns>
        /// Returns the absolute URL to the saved image.
        /// </returns>
        public Task<string> SaveToFileSystemAsync(Stream imageStream, string extension);

        /// <summary>
        /// Creates a safe, unique filename with the given extension.
        /// </summary>
        public string CreateSafeFileName(string extension);

        /// <summary>
        /// Sanitizes alt text for safe use in filenames and media names, preventing XSS and path traversal.
        /// </summary>
        public string SanitizeAltText(string? altText, string fallback = "image", int maxLength = 200);
    }

    public class ImageValidationResult
    {
        public bool IsValid { get; init; }
        /// <summary>
        /// The validated image stream. Caller is responsible for disposing this stream.
        /// </summary>
        public Stream? ValidatedStream { get; init; }
        public string? CorrectExtension { get; init; }
        public string? ErrorMessage { get; init; }

        public static ImageValidationResult Success(Stream stream, string correctExtension) =>
            new() { IsValid = true, ValidatedStream = stream, CorrectExtension = correctExtension };

        public static ImageValidationResult Failure(string errorMessage) =>
            new() { IsValid = false, ErrorMessage = errorMessage };
    }

    public class MediaSaveResult
    {
        public bool Success { get; init; }
        public IMedia? Media { get; init; }
        public string? MediaUdi { get; init; }
        public string? ErrorMessage { get; init; }

        public static MediaSaveResult Succeeded(IMedia media, string mediaUdi) =>
            new() { Success = true, Media = media, MediaUdi = mediaUdi };

        public static MediaSaveResult Failed(string errorMessage) =>
            new() { Success = false, ErrorMessage = errorMessage };
    }
}
