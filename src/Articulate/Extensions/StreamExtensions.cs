#nullable enable
using System.Diagnostics.CodeAnalysis;

namespace Articulate.Extensions;

internal static class StreamExtensions
{
    private const int DefaultBufferSize = 81920;

    /// <summary>
    /// Copies data from source to destination with a maximum byte limit.
    /// Throws <see cref="InvalidDataException"/> if the source stream exceeds the limit.
    /// </summary>
    /// <param name="source">The source stream to copy from.</param>
    /// <param name="destination">The destination stream to copy to.</param>
    /// <param name="maxBytes">Maximum number of bytes to copy. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <exception cref="ArgumentNullException">If source or destination is null.</exception>
    /// <exception cref="ArgumentOutOfRangeException">If maxBytes is less than or equal to zero.</exception>
    /// <exception cref="InvalidDataException">If the source stream exceeds maxBytes.</exception>
    public static async Task CopyWithLimitAsync(
        this Stream source,
        Stream destination,
        long maxBytes,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source, nameof(source));
        ArgumentNullException.ThrowIfNull(destination, nameof(destination));

        if (maxBytes <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxBytes), "Maximum bytes must be greater than zero.");
        }

        var totalRead = 0L;

        // Optimize buffer size: don't allocate more than we'll ever need
        var bufferSize = (int)Math.Min(maxBytes, DefaultBufferSize);
        byte[] buffer = new byte[bufferSize];

        int bytesRead;
        while ((bytesRead = await source.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)) > 0)
        {
            // Check for overflow using checked arithmetic
            long newTotal;
            try
            {
                checked
                {
                    newTotal = totalRead + bytesRead;
                }
            }
            catch (OverflowException)
            {
                // Treat overflow as exceeding the limit
                ThrowFileTooLarge(long.MaxValue, maxBytes);
                return; // Unreachable, but helps static analysis
            }

            if (newTotal > maxBytes)
            {
                ThrowFileTooLarge(newTotal, maxBytes);
            }

            totalRead = newTotal;

            await destination.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
        }
    }

    [DoesNotReturn]
    private static void ThrowFileTooLarge(long attemptedTotal, long maxBytes) =>
        throw new InvalidDataException(
            $"Stream exceeded the maximum allowed size of {maxBytes} bytes (attempted to read {attemptedTotal} bytes).");
}
