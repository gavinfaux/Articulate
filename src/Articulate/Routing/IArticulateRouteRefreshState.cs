
namespace Articulate.Routing
{
    public interface IArticulateRouteRefreshState
    {
        public long MarkDirty();

        public long CurrentVersion { get; }
    }
}
