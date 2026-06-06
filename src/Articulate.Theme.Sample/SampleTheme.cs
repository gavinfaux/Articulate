using Articulate;
using Articulate.Services;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Articulate.Theme.Sample
{
    public static class SampleTheme
    {
        public const string PackageName = "Simple";
        public const string ThemeKey = "Sample";
    }

    public sealed class SampleThemeDescriptorProvider : IArticulateThemeDescriptorProvider
    {
        public IEnumerable<string> GetThemeKeys()
        {
            yield return SampleTheme.ThemeKey;
        }
    }

    public sealed class SampleThemeAutoPublishContributor : IAutoPublishContributor
    {
        public IEnumerable<AutoPublishTarget> GetTargets()
        {
            yield return new AutoPublishTarget(SampleTheme.PackageName, ArticulateConstants.ContentType.Articulate);
        }
    }

    public sealed class SampleThemeComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            _ = builder.Services.AddSingleton<IArticulateThemeDescriptorProvider, SampleThemeDescriptorProvider>();
            _ = builder.Services.AddSingleton<IAutoPublishContributor, SampleThemeAutoPublishContributor>();
        }
    }
}
