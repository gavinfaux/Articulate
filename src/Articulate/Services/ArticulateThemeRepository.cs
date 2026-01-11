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
            var userThemesPath = Path.GetFullPath(
                Path.Combine(hostingEnvironment.ContentRootPath, Paths.UserThemesRoot));
            var themeRootDestination = Path.GetFullPath(
                Path.Combine(userThemesPath, newThemeName));

            if (!themeRootDestination.StartsWith(userThemesPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Invalid theme name", nameof(newThemeName));
            }

            Assembly articulateAssembly = GetWebAssembly();

            // Check if theme already exists
            if (Directory.Exists(themeRootDestination))
            {
                throw new IOException($"A user theme with the name '{newThemeName}' already exists.");
            }

            // Separate resources by type
            var viewResources = GetThemeResourcesByType(articulateAssembly, themeName, "Views").ToList();
            var assetResources = GetThemeResourcesByType(articulateAssembly, themeName, "assets").ToList();

            if (viewResources.Count == 0 && assetResources.Count == 0)
            {
                throw new DirectoryNotFoundException(
                    $"The source theme '{themeName}' could not be found as an embedded resource.");
            }

            try
            {
                // Extract Views to Views/ArticulateThemes/{newThemeName}/ (flat, no nested Views folder)
                _ = Directory.CreateDirectory(themeRootDestination);
                await ExtractResourcesAsync(articulateAssembly, viewResources, themeRootDestination, themeName, stripViewsPrefix: true);

                logger.LogInformation(
                    "Copied views for theme '{NewThemeName}' from '{SourceTheme}' to {ViewsPath}",
                    newThemeName,
                    themeName,
                    Path.Combine("Views", "ArticulateThemes", newThemeName));

                // Extract Assets to wwwroot/App_Plugins/Articulate/Themes/{newThemeName}/assets/
                if (assetResources.Count > 0)
                {
                    var assetsDestination = Path.Combine(
                        hostingEnvironment.WebRootPath,
                        "App_Plugins",
                        "Articulate",
                        "Themes",
                        newThemeName,
                        "assets");

                    _ = Directory.CreateDirectory(assetsDestination);
                    await ExtractResourcesAsync(articulateAssembly, assetResources, assetsDestination, themeName, stripViewsPrefix: false);

                    logger.LogInformation(
                        "Copied assets for theme '{NewThemeName}' to {AssetsPath}",
                        newThemeName,
                        Path.Combine("wwwroot", "App_Plugins", "Articulate", "Themes", newThemeName, "assets"));
                }

                // Create helpful README
                await CreateThemeReadmeAsync(themeRootDestination, themeName, newThemeName);

                appCaches.RuntimeCache.ClearByKey(AllThemesCacheKey);
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Error copying embedded theme '{SourceTheme}' to '{DestinationTheme}'",
                    themeName,
                    newThemeName);
                throw;
            }
        }

        private static IEnumerable<string> GetThemeResourcesByType(
            Assembly assembly,
            string themeName,
            string resourceType)
        {
            char[] separators = ['/', '\\'];
            var prefix = $"{EmbeddedResourceRoot}Themes/{themeName}/";

            return assembly.GetManifestResourceNames()
                .Where(resource =>
                {
                    if (!resource.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    var relativePath = resource[prefix.Length..];
                    return separators.Any(sep =>
                        relativePath.StartsWith($"{resourceType}{sep}", StringComparison.OrdinalIgnoreCase));
                });
        }

        private async Task ExtractResourcesAsync(
            Assembly assembly,
            List<string> resources,
            string destinationBase,
            string themeName,
            bool stripViewsPrefix)
        {
            var prefixToRemove = $"{EmbeddedResourceRoot}Themes/{themeName}/";

            foreach (var resourceName in resources)
            {
                var relativePath = resourceName[prefixToRemove.Length..];

                // Strip "Views/" prefix so views land flat in theme root
                if (stripViewsPrefix)
                {
                    relativePath = relativePath
                        .Replace("Views/", string.Empty)
                        .Replace("Views\\", string.Empty);
                }

                var cleanPath = relativePath
                    .Replace('\\', Path.DirectorySeparatorChar)
                    .Replace('/', Path.DirectorySeparatorChar);

                var destinationFilePath = Path.Combine(destinationBase, cleanPath);
                await ExtractResourceToFileAsync(assembly, resourceName, destinationFilePath);
            }
        }

        private static async Task CreateThemeReadmeAsync(string themeRoot, string sourceTheme, string newTheme)
        {
            var readme = $"""
                          # Articulate Theme: {newTheme}

                          Created by copying '{sourceTheme}' theme.

                          ## Folder Structure

                          **Views:** `Views/ArticulateThemes/{newTheme}/`
                          Edit .cshtml files here to customize your theme layout.

                          **Assets:** `wwwroot/App_Plugins/Articulate/Themes/{newTheme}/assets/`
                          CSS, JavaScript, images, and other static files.

                          ## Quick Start

                          1. Edit `Master.cshtml` - Main layout template
                          2. Edit `Post.cshtml` - Individual blog post template
                          3. Customize CSS in `wwwroot/.../assets/css/`

                          ## Documentation

                          - Theme Guide: https://github.com/Shazwazza/Articulate/wiki/Themes
                          - View Models: https://github.com/Shazwazza/Articulate/wiki/Theme-View-Models
                          """;

            var readmePath = Path.Combine(themeRoot, "README.md");
            await File.WriteAllTextAsync(readmePath, readme);
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
