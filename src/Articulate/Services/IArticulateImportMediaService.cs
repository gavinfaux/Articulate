#nullable enable
using Umbraco.Cms.Core.Models;

namespace Articulate.Services
{
    /// <summary>
    /// Service for processing and validating images across Articulate features (BlogML import, MetaWeblog, Markdown editor).
    /// Centralizes image validation, processing, and storage logic.
    /// </summary>
    public interface IArticulateImportMediaService
    {
        /// <summary>
        /// Validates an image stream (extension matching only, consider magic bytes and file size checks in the future).
        /// </summary>
        public ValueTask<ImportMediaValidationResult> ValidateImageAsync(Stream stream, string originalExtension);

        /// <summary>
        /// Decodes and validates a base64-encoded image.
        /// </summary>
        public Task<ImportMediaValidationResult> DecodeAndValidateBase64ImageAsync(string base64Content, string originalFileName);

        /// <summary>
        /// Downloads and validates an image from an external URL.
        /// </summary>
        public Task<ImportMediaValidationResult> DownloadAndValidateImageAsync(Uri imageUrl, CancellationToken cancellationToken = default);

        /// <summary>
        /// Saves a validated image to the Umbraco media library.
        /// </summary>
        public Task<ImportMediaSaveResult> SaveToMediaLibraryAsync(Stream imageStream, string mediaName, string extension, IMedia? parentFolder = null);

        /// <summary>
        /// Saves a validated image to the Articulate file system (articulate/{guid}/{filename}).
        /// </summary>
        /// <returns>
        /// Returns the absolute URL to the saved image.
        /// </returns>
        public Task<string> SaveToFileSystemAsync(Stream imageStream, string extension, string? originalFileName = null);

        /// <summary>
        /// Creates a safe, unique filename with the given extension.
        /// </summary>
        public string CreateSafeFileName(string extension);
    }

    public class ImportMediaValidationResult
    {
        public bool IsValid { get; init; }

        /// <summary>
        /// The validated image stream. Caller is responsible for disposing this stream.
        /// </summary>
        public Stream? ValidatedStream { get; init; }
        public string? CorrectExtension { get; init; }

        /// <summary>
        /// The MIME type based on file extension (e.g., "image/jpeg", "image/png").
        /// </summary>
        public string? MimeType { get; init; }
        public string? ErrorMessage { get; init; }

        public static ImportMediaValidationResult Success(Stream stream, string correctExtension, string mimeType) =>
            new() { IsValid = true, ValidatedStream = stream, CorrectExtension = correctExtension, MimeType = mimeType };

        public static ImportMediaValidationResult Failure(string errorMessage) =>
            new() { IsValid = false, ErrorMessage = errorMessage };
    }

    public class ImportMediaSaveResult
    {
        public bool Success { get; init; }
        public IMedia? Media { get; init; }
        public string? MediaUdi { get; init; }
        public string? ErrorMessage { get; init; }

        public static ImportMediaSaveResult Succeeded(IMedia media, string mediaUdi) =>
            new() { Success = true, Media = media, MediaUdi = mediaUdi };

        public static ImportMediaSaveResult Failed(string errorMessage) =>
            new() { Success = false, ErrorMessage = errorMessage };
    }
}
