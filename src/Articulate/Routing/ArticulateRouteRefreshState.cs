#nullable enable
namespace Articulate.Routing
{
    internal sealed class ArticulateRouteRefreshState : IArticulateRouteRefreshState
    {
        private int _isDirty = 1;

        public bool IsDirty => Volatile.Read(ref _isDirty) == 1;

        public void MarkDirty() => Interlocked.Exchange(ref _isDirty, 1);

        public void MarkClean() => Interlocked.Exchange(ref _isDirty, 0);
    }
}
