
namespace Articulate.Routing
{
    public interface IArticulateRouteRefreshState
    {
        public void MarkDirty();

        public bool IsDirty { get; }

        public void MarkClean();
    }
}
