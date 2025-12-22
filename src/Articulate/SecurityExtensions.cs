#nullable enable
namespace Articulate
{
    /// <summary>
    /// Security-focused extension methods for validating and sanitizing user-supplied URLs and strings
    /// to prevent XSS, CSS injection, and other security vulnerabilities.
    /// </summary>
    /// <remarks>
    /// <para>
    /// These methods provide defense-in-depth security by validating and sanitizing URLs at the model layer,
    /// ensuring that views receive safe data. They handle both absolute URLs (http/https) and relative URLs
    /// (/, ~/media/, etc.) which are common in Umbraco applications.
    /// </para>
    /// <para>
    /// Key security features:
    /// - Whitelist-only approach (rejects dangerous protocols like javascript:, data:, vbscript:)
    /// - CSS context-aware escaping to prevent CSS injection attacks
    /// - Compatible with Umbraco's GetCropUrl() and other URL generation methods
    /// - Graceful handling of null/empty values
    /// </para>
    /// </remarks>
    public static class SecurityExtensions
    {
        /// <summary>
        /// Validates a URL for use in href or src attributes, ensuring only safe protocols.
        /// </summary>
        /// <param name="url">The URL to validate. Can be absolute (http://...) or relative (/media/...).</param>
        /// <returns>
        /// The original URL if valid and safe; <c>null</c> if the URL is null, empty, or uses a dangerous protocol.
        /// </returns>
        /// <remarks>
        /// <para><strong>Allowed URL formats:</strong></para>
        /// <list type="bullet">
        /// <item><description>Relative URLs: <c>/</c>, <c>/media/image.jpg</c>, <c>~/content/</c></description></item>
        /// <item><description>Fragment identifiers: <c>#section</c></description></item>
        /// <item><description>Absolute URLs with http or https: <c>http://example.com</c>, <c>https://example.com</c></description></item>
        /// </list>
        /// <para><strong>Rejected (returns null):</strong></para>
        /// <list type="bullet">
        /// <item><description><c>javascript:alert('XSS')</c></description></item>
        /// <item><description><c>data:text/html,&lt;script&gt;alert('XSS')&lt;/script&gt;</c></description></item>
        /// <item><description><c>vbscript:msgbox</c></description></item>
        /// <item><description><c>file:///etc/passwd</c></description></item>
        /// </list>
        /// <para><strong>Usage in views:</strong></para>
        /// <code>
        /// @if (Model.AuthorUrl is not null)
        /// {
        ///     &lt;a href="@Model.AuthorUrl"&gt;Visit Author&lt;/a&gt;
        /// }
        /// </code>
        /// </remarks>
        /// <example>
        /// <code>
        /// // Safe URLs are returned as-is
        /// "/media/image.jpg".ToSafeHrefUrl();  // Returns: "/media/image.jpg"
        /// "https://example.com".ToSafeHrefUrl(); // Returns: "https://example.com"
        ///
        /// // Dangerous URLs return null
        /// "javascript:alert('XSS')".ToSafeHrefUrl(); // Returns: null
        /// "data:text/html,&lt;script&gt;".ToSafeHrefUrl(); // Returns: null
        /// </code>
        /// </example>
        public static string? ToSafeHrefUrl(this string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return null;
            }

            // Relative URLs are safe (/, /media/..., ~/...)
            if (url.StartsWith('/') || url.StartsWith('~'))
            {
                return url;
            }

            // Fragment-only URLs are safe (#section)
            if (url.StartsWith('#'))
            {
                return url;
            }

            // Try to parse as absolute URI
            if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri))
            {
                // Could be a relative URL without leading slash - allow it
                // This handles cases like "page.html" or "../page.html"
                return url;
            }

            // Only allow http and https schemes for absolute URLs
            if (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            {
                return url;
            }

            // Reject dangerous protocols: javascript:, data:, vbscript:, file:, etc.
            return null;
        }

        /// <summary>
        /// Escapes a URL for safe use in CSS <c>url()</c> functions within inline style attributes.
        /// Validates the URL protocol and applies CSS-specific character escaping.
        /// </summary>
        /// <param name="url">The URL to validate and escape for CSS context. Can be absolute or relative.</param>
        /// <returns>
        /// The CSS-escaped URL if valid and safe; <c>null</c> if the URL is invalid or uses a dangerous protocol.
        /// </returns>
        /// <remarks>
        /// <para>
        /// This method performs two critical security operations:
        /// </para>
        /// <list type="number">
        /// <item><description><strong>URL Validation:</strong> Ensures only http, https, and relative URLs are allowed</description></item>
        /// <item><description><strong>CSS Escaping:</strong> Escapes characters that could break out of CSS context (quotes, parentheses, newlines, etc.)</description></item>
        /// </list>
        /// <para><strong>Characters escaped:</strong></para>
        /// <list type="bullet">
        /// <item><description>Backslash <c>\</c> → <c>\\</c></description></item>
        /// <item><description>Single quote <c>'</c> → <c>\'</c></description></item>
        /// <item><description>Double quote <c>"</c> → <c>\"</c></description></item>
        /// <item><description>Newline <c>\n</c> → <c>\\n</c></description></item>
        /// <item><description>Parentheses <c>(</c> and <c>)</c> → <c>\(</c> and <c>\)</c></description></item>
        /// <item><description>Null character <c>\0</c> → removed</description></item>
        /// </list>
        /// <para><strong>Usage in views:</strong></para>
        /// <code>
        /// @if (Model.BlogBannerCss is not null)
        /// {
        ///     &lt;div style="background-image: url('@Model.BlogBannerCss');"&gt;&lt;/div&gt;
        /// }
        /// </code>
        /// <para><strong>Security note:</strong> Always use this method for URLs in inline styles. Regular href/src URLs
        /// should use <see cref="ToSafeHrefUrl"/> instead.</para>
        /// </remarks>
        /// <example>
        /// <code>
        /// // Umbraco media URL with CSS escaping
        /// "/media/banner.jpg".ToSafeCssUrl();
        /// // Returns: "/media/banner.jpg" (validated and escaped)
        ///
        /// // URL with special characters
        /// "/media/file(1).jpg".ToSafeCssUrl();
        /// // Returns: "/media/file\\(1\\).jpg"
        ///
        /// // Dangerous protocol rejected
        /// "javascript:alert('XSS')".ToSafeCssUrl(); // Returns: null
        /// </code>
        /// </example>
        public static string? ToSafeCssUrl(this string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return null;
            }

            // First validate the URL is safe
            // Allow both absolute (http/https) and relative URLs
            if (!Uri.TryCreate(url, UriKind.RelativeOrAbsolute, out Uri? uri))
            {
                return null;
            }

            // For absolute URIs, only allow http and https
            if (uri.IsAbsoluteUri && uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            {
                return null;
            }

            // CSS escape: replace characters that could break out of CSS context
            return url
                .Replace("\\", "\\\\")    // Backslash must be escaped first
                .Replace("'", "\\'")      // Single quote
                .Replace("\"", "\\\"")    // Double quote
                .Replace("\n", "\\n")     // Newline
                .Replace("\r", "\\r")     // Carriage return
                .Replace("\0", string.Empty)  // Null character (remove entirely)
                .Replace("(", "\\(")      // Left parenthesis
                .Replace(")", "\\)");     // Right parenthesis
        }

        /// <summary>
        /// Validates if a string is a well-formed URL with a safe protocol.
        /// </summary>
        /// <param name="url">The URL to validate. Can be absolute or relative.</param>
        /// <returns>
        /// <c>true</c> if the URL is valid and uses a safe protocol (http, https, or relative path);
        /// <c>false</c> if the URL is null, empty, malformed, or uses a dangerous protocol.
        /// </returns>
        /// <remarks>
        /// <para>
        /// This is a convenience method for boolean checks. Internally delegates to <see cref="ToSafeHrefUrl"/>.
        /// </para>
        /// </remarks>
        /// <example>
        /// <code>
        /// if ("/media/image.jpg".IsSafeUrl())
        /// {
        ///     // URL is safe to use
        /// }
        ///
        /// if (!"javascript:alert('XSS')".IsSafeUrl())
        /// {
        ///     // URL is dangerous
        /// }
        /// </code>
        /// </example>
        public static bool IsSafeUrl(this string? url)
        {
            return url.ToSafeHrefUrl() != null;
        }

        /// <summary>
        /// Gets a safe URL for href or src attributes, returning an empty string if the URL is invalid.
        /// </summary>
        /// <param name="url">The URL to validate. Can be absolute or relative.</param>
        /// <returns>
        /// The original URL if valid and safe; empty string if the URL is null, empty, or uses a dangerous protocol.
        /// </returns>
        /// <remarks>
        /// <para>
        /// This method is useful when you need a non-null return value for direct binding in attributes
        /// where an empty href is acceptable (e.g., <c>&lt;a href=""&gt;</c>).
        /// </para>
        /// <para>
        /// For most cases, prefer using <see cref="ToSafeHrefUrl"/> with null-checks in views
        /// to avoid rendering empty/broken links.
        /// </para>
        /// </remarks>
        /// <example>
        /// <code>
        /// // Always returns a string (never null)
        /// &lt;a href="@Model.AuthorUrl.ToSafeHrefUrlOrEmpty()"&gt;Author&lt;/a&gt;
        /// </code>
        /// </example>
        public static string ToSafeHrefUrlOrEmpty(this string? url)
        {
            return url.ToSafeHrefUrl() ?? string.Empty;
        }

        /// <summary>
        /// Gets a safe CSS-escaped URL or returns <c>null</c> if invalid.
        /// </summary>
        /// <param name="url">The URL to validate and escape for CSS context.</param>
        /// <returns>
        /// The CSS-escaped URL if valid and safe; <c>null</c> if the URL is invalid or uses a dangerous protocol.
        /// </returns>
        /// <remarks>
        /// <para>
        /// This is an alias for <see cref="ToSafeCssUrl"/> provided for naming consistency.
        /// Use this for background-image and other CSS url() contexts.
        /// </para>
        /// </remarks>
        public static string? ToSafeCssUrlOrNull(this string? url)
        {
            return url.ToSafeCssUrl();
        }
    }
}
