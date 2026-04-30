#nullable enable

namespace Articulate.Controllers
{
    /// <summary>
    /// A read-only stream wrapper that throws <see cref="InvalidOperationException"/> once
    /// more than <c>maxBytes</c> bytes have been read from the inner stream.
    /// </summary>
    internal sealed class SizeLimitedStream(Stream inner, long maxBytes) : Stream
    {
        private long _bytesRead;

        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            int bytesRead = inner.Read(buffer, offset, count);
            ThrowIfLimitExceeded(bytesRead);
            return bytesRead;
        }

        public override async Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
        {
            int bytesRead = await inner.ReadAsync(buffer, offset, count, cancellationToken);
            ThrowIfLimitExceeded(bytesRead);
            return bytesRead;
        }

        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            int bytesRead = await inner.ReadAsync(buffer, cancellationToken);
            ThrowIfLimitExceeded(bytesRead);
            return bytesRead;
        }

        private void ThrowIfLimitExceeded(int bytesJustRead)
        {
            _bytesRead += bytesJustRead;
            if (_bytesRead > maxBytes)
            {
                throw new InvalidOperationException(
                    $"Request body exceeded the configured limit of {maxBytes} bytes");
            }
        }

        public override void Flush() { }
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    }
}
