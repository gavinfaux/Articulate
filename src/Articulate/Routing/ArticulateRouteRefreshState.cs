#nullable enable
using Microsoft.Extensions.Primitives;

namespace Articulate.Routing
{
    internal sealed class ArticulateRouteRefreshState : IArticulateRouteRefreshState
    {
        private long _currentVersion = 1;
        private CancellationTokenSource _changeTokenSource = new();

        public long CurrentVersion => Interlocked.Read(ref _currentVersion);

        public long MarkDirty()
        {
            var version = Interlocked.Increment(ref _currentVersion);
            CancellationTokenSource previous = Interlocked.Exchange(ref _changeTokenSource, new CancellationTokenSource());
            // Not disposed: a concurrent GetChangeToken may still read its Token.
            previous.Cancel();
            return version;
        }

        public IChangeToken GetChangeToken() => new CancellationChangeToken(Volatile.Read(ref _changeTokenSource).Token);
    }
}
