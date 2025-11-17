#nullable enable
using Microsoft.Extensions.Options;

namespace Articulate.Options
{
    internal sealed class ArticulateOptionsValidator : IValidateOptions<ArticulateOptions>
    {
        private static readonly HashSet<string> SupportedProviders = new(StringComparer.OrdinalIgnoreCase)
        {
            "disqus",
            "giscus",
        };

        public ValidateOptionsResult Validate(string? name, ArticulateOptions options)
        {
            if (options is null)
            {
                return ValidateOptionsResult.Fail("Articulate options cannot be null.");
            }

            var errors = new List<string>();

            if (options.GenerateExcerpt is null)
            {
                errors.Add("Articulate: GenerateExcerpt delegate must not be null.");
            }

            if (!string.IsNullOrWhiteSpace(options.DefaultCommentsProvider))
            {
                ValidateCommentsProvider(options, options.DefaultCommentsProvider, errors);
            }

            return errors.Count == 0 ? ValidateOptionsResult.Success : ValidateOptionsResult.Fail(errors);
        }

        private static void ValidateCommentsProvider(ArticulateOptions options, string provider, IList<string> errors)
        {
            string normalized = provider.Trim().ToLowerInvariant();

            if (!SupportedProviders.Contains(normalized))
            {
                errors.Add("Articulate:DefaultCommentsProvider must be one of 'disqus','giscus'.");
                return;
            }

            switch (normalized)
            {
                case "disqus":
                    if (string.IsNullOrWhiteSpace(options.Disqus.Shortname))
                    {
                        errors.Add("Articulate:Disqus:Shortname is required when the Disqus provider is selected.");
                    }

                    break;
                case "giscus":
                    EnsureGiscusField(options.Giscus.Repo, nameof(options.Giscus.Repo), errors);
                    EnsureGiscusField(options.Giscus.RepoId, nameof(options.Giscus.RepoId), errors);
                    EnsureGiscusField(options.Giscus.Category, nameof(options.Giscus.Category), errors);
                    EnsureGiscusField(options.Giscus.CategoryId, nameof(options.Giscus.CategoryId), errors);
                    break;
            }
        }

        private static void EnsureGiscusField(string? value, string fieldName, IList<string> errors)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                errors.Add($"Articulate:Giscus:{fieldName} is required when the Giscus provider is selected.");
            }
        }
    }
}
