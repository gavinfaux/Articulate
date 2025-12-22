//#nullable enable
//namespace Articulate.Validators;

///// <summary>
///// Validates image files by inspecting magic bytes (file signatures).
///// Prevents extension spoofing attacks where malicious files are renamed to appear as images.
///// </summary>
///// <remarks>
///// References:
///// - https://en.wikipedia.org/wiki/List_of_file_signatures
///// - https://filesig.search.org
///// - https://github.com/neilharvey/FileSignatures
///// </remarks>
//public static class ImageMagicByteValidator
//{

//    // replace with https://www.nuget.org/packages/FileSignatures ?
//    private static ReadOnlySpan<byte> JpegExif => [0xFF, 0xE1];

//    private static ReadOnlySpan<byte> Jpeg => [0xFF, 0xD8];

//    private static ReadOnlySpan<byte> Tiff => [0x2A, 0x00];

//    private static ReadOnlySpan<byte> Png => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

//    private static ReadOnlySpan<byte> Gif => [0x47, 0x49, 0x46, 0x38];

//    private static ReadOnlySpan<byte> Bmp => [0x42, 0x4D];

//    private static ReadOnlySpan<byte> WebP => [0x57, 0x45, 0x42, 0x50];

//    private static ReadOnlySpan<byte> Ico => [0x00, 0x00, 0x01, 0x00];

//    public enum ImageFormat
//    {
//        Unknown,
//        Bmp,
//        Gif,
//        Ico,
//        Jpeg,
//        JpegExif,
//        Png,
//        Tiff,
//        WebP,
//    }

//    /// <summary>
//    /// Validates that the stream contains a valid image by checking magic bytes.
//    /// Stream position will be reset to original position after validation.
//    /// </summary>
//    /// <param name="stream">The stream to validate. Must be seekable.</param>
//    /// <returns>The detected image format, or Unknown if not a valid image.</returns>
//    public static ImageFormat DetectFormat(Stream stream)
//    {
//        ArgumentNullException.ThrowIfNull(stream);

//        if (!stream.CanSeek)
//        {
//            throw new ArgumentException("Stream must be seekable for magic byte validation", nameof(stream));
//        }

//        var originalPosition = stream.Position;
//        try
//        {
//            stream.Position = 0;

//            // Read first 8 bytes (max needed for PNG)
//            Span<byte> header = stackalloc byte[8];
//            var bytesRead = stream.Read(header);

//            if (bytesRead < 3)
//            {
//                return ImageFormat.Unknown; // Too small
//            }

//            // Check PNG (needs 8 bytes)
//            if (bytesRead >= 8 && header.SequenceEqual(PngMagic))
//            {
//                return ImageFormat.Png;
//            }

//            // Check JPEG (needs 3 bytes)
//            if (header[..3].SequenceEqual(JpegMagic))
//            {
//                return ImageFormat.Jpeg;
//            }

//            // Check GIF (needs 6 bytes)
//            if (bytesRead >= 6 && (header[..6].SequenceEqual(Gif87Magic) || header[..6].SequenceEqual(Gif89Magic)))
//            {
//                return ImageFormat.Gif;
//            }

//            return ImageFormat.Unknown;
//        }
//        finally
//        {
//            stream.Position = originalPosition;
//        }
//    }

//    /// <summary>
//    /// Validates that the file extension matches the actual file content (magic bytes).
//    /// Prevents extension spoofing (e.g., evil.exe renamed to evil.jpg).
//    /// </summary>
//    /// <param name="stream">The stream to validate.</param>
//    /// <param name="fileExtension">The claimed file extension (e.g., ".jpg" or "jpg").</param>
//    /// <returns>True if extension matches content; false if mismatch detected.</returns>
//    public static bool ValidateExtensionMatchesContent(Stream stream, string fileExtension)
//    {
//        if (string.IsNullOrEmpty(fileExtension))
//        {
//            return false; // No extension provided, can't validate match
//        }

//        ImageFormat detectedFormat = DetectFormat(stream);
//        var normalizedExt = fileExtension.TrimStart('.').ToLowerInvariant();

//        return detectedFormat switch
//        {
//            ImageFormat.Jpeg => normalizedExt is "jpg" or "jpeg",
//            ImageFormat.Png => normalizedExt == "png",
//            ImageFormat.Gif => normalizedExt == "gif",
//            ImageFormat.Unknown => false,
//            _ => false
//        };
//    }
//    /// <summary>
//    /// Gets the correct file extension for the detected image format.
//    /// </summary>
//    /// <param name="stream">The stream to analyze.</param>
//    /// <returns>The correct extension (e.g., ".jpg"), or null if format is unknown.</returns>
//    public static string? GetCorrectExtension(Stream stream)
//    {
//        return DetectFormat(stream) switch
//        {
//            ImageFormat.Jpeg => ".jpg",
//            ImageFormat.Png => ".png",
//            ImageFormat.Gif => ".gif",
//            _ => null
//        };
//    }
//}
