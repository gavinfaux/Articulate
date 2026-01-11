#nullable enable
using System.Reflection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Cache;
using static Articulate.ArticulateConstants;

namespace Articulate.Services
{
    /// <summary>
    /// Repository for retrieving and managing Articulate themes.
    /// </summary>
    public sealed class ArticulateThemeRepository(
        IWebHostEnvironment hostingEnvironment,
        ILogger<ArticulateThemeRepository> logger,
        AppCaches appCaches)
        : IArticulateThemeRepository
    {
        private const string AllThemesCacheKey = "Articulate_AllThemes";
        private const string EmbeddedResourceRoot = "Articulate.Theme://";

        /// <inheritdoc/>
        async Task IArticulateThemeRepository.CopyThemeAsync(string themeName, string newThemeName)
        {
            var userThemesPath =
                Path.GetFullPath(Path.Combine(hostingEnvironment.ContentRootPath, Paths.UserThemesRoot));
            var destinationPhysicalPath = Path.GetFullPath(Path.Combine(userThemesPath, newThemeName));

            if (!destinationPhysicalPath.StartsWith(userThemesPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException(@"Invalid theme name", nameof(newThemeName));
            }

            Assembly articulateAssembly = GetWebAssembly();

            // User theme names must be unique
            if (Directory.Exists(destinationPhysicalPath))
            {
                throw new IOException($"A user theme with the name '{newThemeName}' already exists.");
            }

            var themeResources = GetThemeResourceNames(articulateAssembly, themeName).ToList();

            if (themeResources.Count == 0)
            {
                throw new DirectoryNotFoundException(
                    $"The source theme '{themeName}' could not be found as an embedded resource.");
            }

            try
            {
                _ = Directory.CreateDirectory(destinationPhysicalPath);

                var cutOffIndex = EmbeddedResourceRoot.Length + themeName.Length + 1;
                foreach (var resourceName in themeResources)
                {
                    var relativePath = resourceName[cutOffIndex..];
                    var cleanPath = relativePath
                        .Replace('\\', Path.DirectorySeparatorChar) // Turn Windows slashes into Current OS slashes
                        .Replace('/', Path.DirectorySeparatorChar); // Turn Web/Linux slashes into Current OS slashes

                    var destinationFilePath = Path.Combine(destinationPhysicalPath, cleanPath);
                    await ExtractResourceToFileAsync(articulateAssembly, resourceName, destinationFilePath);
                }

                appCaches.RuntimeCache.ClearByKey(AllThemesCacheKey);
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Error copying embedded theme '{SourceTheme}' to '{DestinationTheme}'.",
                    themeName,
                    newThemeName);
                throw;
            }
        }

        private IEnumerable<string> GetThemeResourceNames(Assembly assembly, string themeName)
        {
            char[] separators = ['/', '\\'];
            return assembly.GetManifestResourceNames()
                .Where(resource =>
                {
                    // A. Must start with the root prefix
                    if (!resource.StartsWith(EmbeddedResourceRoot, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    // Get the path relative to "Articulate.Theme://"
                    // e.g. "Vapor/assets/css/style.css" OR "Vaporwave/assets/css/style.css"
                    var relativePath = resource[EmbeddedResourceRoot.Length..];

                    // B. THE SEPARATOR GUARD
                    // We check if the relative path starts with "Vapor/" or "Vapor\"
                    // This fails for "Vaporwave/" because the character after 'r' is 'w', not '/'
                    return separators.Any(sep =>
                        relativePath.StartsWith($"{themeName}{sep}", StringComparison.OrdinalIgnoreCase));
                });
        }

        private async Task ExtractResourceToFileAsync(
            Assembly assembly,
            string resourceName,
            string destinationFilePath)
        {
            if (Path.GetDirectoryName(destinationFilePath) is { } directoryPath)
            {
                _ = Directory.CreateDirectory(directoryPath);
            }
            else
            {
                logger.LogError(
                    "Could not determine a valid directory path from '{DestinationFilePath}' for '{ResourceName}'. Skipping file creation.",
                    destinationFilePath,
                    resourceName);
                return;
            }

            await using Stream? stream = assembly.GetManifestResourceStream(resourceName);
            if (stream is null)
            {
                logger.LogError(
                    "Could not find resource stream for '{ResourceName}'. Skipping file creation.",
                    resourceName);
                return;
            }

            await using var fileStream = new FileStream(destinationFilePath, FileMode.Create);
            await stream.CopyToAsync(fileStream);
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<string>?> GetAllThemesAsync() =>
            await appCaches.RuntimeCache.GetCacheItemAsync(
                AllThemesCacheKey,
                async () =>
                {
                    Task<IEnumerable<string>> defaultThemesTask = GetDefaultThemesAsync();
                    Task<IEnumerable<string>> userThemesTask = GetUserThemesAsync();

                    IEnumerable<string>[] results =
                        await Task.WhenAll(defaultThemesTask, userThemesTask);
                    return results[0].Union(results[1]).OrderBy(name => name);
                },
                TimeSpan.FromSeconds(30));

        private static Assembly GetWebAssembly()
        {
            // 1. Try to find Articulate.Web if already loaded
            Assembly? assembly = AppDomain.CurrentDomain.GetAssemblies()
                .FirstOrDefault(x => x.GetName().Name == "Articulate.Web");

            // 2. Safety check
            return assembly ?? throw new InvalidOperationException(
                "Could not find 'Articulate.Web' assembly. Ensure the Articulate package is installed correctly.");
        }

        /// <inheritdoc/>
        public Task<IEnumerable<string>> GetDefaultThemesAsync() => Task.FromResult(DefaultThemes.AllThemeNames);

        private static Task<IEnumerable<string>> GetThemesFromPhysicalPathAsync(string physicalPath) =>
            Task.Run(() => Directory.Exists(physicalPath)
                ? new DirectoryInfo(physicalPath).GetDirectories().Select(d => d.Name)
                : []);

        private Task<IEnumerable<string>> GetUserThemesAsync()
        {
            var physicalPath = Path.Combine(hostingEnvironment.ContentRootPath, Paths.UserThemesRoot);
            return GetThemesFromPhysicalPathAsync(physicalPath);
        }
    }
}
