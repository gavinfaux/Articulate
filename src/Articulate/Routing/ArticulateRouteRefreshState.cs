#nullable enable
namespace Articulate.Routing
{
    internal sealed class ArticulateRouteRefreshState : IArticulateRouteRefreshState
    {
        private long _currentVersion = 1;

        public long CurrentVersion => Interlocked.Read(ref _currentVersion);

        public long MarkDirty() => Interlocked.Increment(ref _currentVersion);
    }
}
