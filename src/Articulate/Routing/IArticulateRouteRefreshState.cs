
using Microsoft.Extensions.Primitives;

namespace Articulate.Routing
{
    public interface IArticulateRouteRefreshState
    {
        public long MarkDirty();

        public long CurrentVersion { get; }

        /// <summary>Gets a token that fires on the next <see cref="MarkDirty"/>.</summary>
        /// <remarks>Added in 7.1/8.1; the default keeps earlier custom implementations compiling but stops startup with this message.</remarks>
        public IChangeToken GetChangeToken() => throw new NotSupportedException(
            $"{GetType().FullName} must implement {nameof(IArticulateRouteRefreshState)}.{nameof(GetChangeToken)} so Articulate can refresh its routes.");
    }
}
