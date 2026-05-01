#nullable enable
using Articulate.Routing;
using NUnit.Framework;

namespace Articulate.Tests.Routing
{
    [TestFixture]
    public class ArticulateRouteRefreshStateTests
    {
        [Test]
        public void IsDirty_is_true_by_default()
        {
            ArticulateRouteRefreshState sut = new();

            Assert.That(sut.IsDirty, Is.True);
        }

        [Test]
        public void MarkClean_sets_state_to_clean()
        {
            ArticulateRouteRefreshState sut = new();

            sut.MarkClean();

            Assert.That(sut.IsDirty, Is.False);
        }

        [Test]
        public void MarkDirty_sets_state_back_to_dirty()
        {
            ArticulateRouteRefreshState sut = new();
            sut.MarkClean();

            sut.MarkDirty();

            Assert.That(sut.IsDirty, Is.True);
        }
    }
}
