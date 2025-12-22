#nullable enable
using System.Text.RegularExpressions;

namespace Articulate.Validators;

/// <summary>
/// Sanitizes user-provided alt text to prevent security issues.
/// Removes path traversal attempts, control characters, and dangerous special characters.
/// </summary>
public static partial class AltTextSanitizer
{
    private const int DefaultMaxLength = 200;

    /// <summary>
    /// Sanitizes alt text for safe use in filenames and media names.
    /// </summary>
    /// <param name="altText">The user-provided alt text.</param>
    /// <param name="fallback">Fallback value if alt text is empty/invalid. Defaults to "image".</param>
    /// <param name="maxLength">Maximum allowed length. Default: 200 characters.</param>
    /// <returns>Sanitized alt text safe for use in filenames and media names.</returns>
    public static string Sanitize(string? altText, string fallback = "image", int maxLength = DefaultMaxLength)
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
        // Windows: \ / : * ? " < > |
        // Unix: /
        sanitized = PathSeparatorRegex().Replace(sanitized, "_");

        // 3. Remove control characters (0x00-0x1F, 0x7F)
        sanitized = ControlCharRegex().Replace(sanitized, string.Empty);

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

    [GeneratedRegex(@"[/\\:\*\?""<>\|]")]
    private static partial Regex PathSeparatorRegex();

    [GeneratedRegex(@"[\x00-\x1F\x7F]")]
    private static partial Regex ControlCharRegex();
}
