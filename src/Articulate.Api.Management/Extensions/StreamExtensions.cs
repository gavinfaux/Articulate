#nullable enable
using System.Diagnostics.CodeAnalysis;

namespace Articulate.Api.Management.Extensions;

internal static class StreamExtensions
{
    private const int DefaultBufferSize = 81920;

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
        byte[] buffer = new byte[DefaultBufferSize];
        int bytesRead;
        while ((bytesRead = await source.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken).ConfigureAwait(false)) > 0)
        {
            totalRead += bytesRead;
            if (totalRead > maxBytes)
            {
                ThrowFileTooLarge(totalRead, maxBytes);
            }

            await destination.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken).ConfigureAwait(false);
        }
    }

    [DoesNotReturn]
    private static void ThrowFileTooLarge(long totalRead, long maxBytes) =>
        throw new InvalidDataException($"Stream exceeded the maximum allowed size of {maxBytes} bytes (read {totalRead} bytes).");
}
