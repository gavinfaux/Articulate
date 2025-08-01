#nullable enable
using System.Reflection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Extensions;

namespace Articulate.Services
{
    public class ArticulateThemeRepository : IArticulateThemeRepository
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly ILogger<ArticulateThemeRepository> _logger;
        private readonly AppCaches _appCaches;
        private const string AllThemesCacheKey = "Articulate_AllThemes";
        private readonly Assembly _articulateAssembly;
        private const string EmbeddedResourceRoot = "Articulate.Themes/";

        public ArticulateThemeRepository(
            IWebHostEnvironment hostingEnvironment,
            ILogger<ArticulateThemeRepository> logger,
            AppCaches appCaches)
        {
            _hostingEnvironment = hostingEnvironment;
            _logger = logger;
            _appCaches = appCaches;
            _articulateAssembly = typeof(ArticulateThemeRepository).Assembly;
        }

        public async Task CopyThemeAsync(string themeName, string newThemeName)
        {
            var userThemesPath = _hostingEnvironment.MapPathContentRoot(PathHelper.UserVirtualThemePath);
            var destinationPhysicalPath = Path.Combine(userThemesPath, newThemeName);

            // User theme names must be unique
            if (Directory.Exists(destinationPhysicalPath))
            {
                throw new IOException($"A user theme with the name '{newThemeName}' already exists.");
            }

            var resourcePathPrefix = $"{EmbeddedResourceRoot}{themeName}/";
            var themeResources = _articulateAssembly.GetManifestResourceNames()
                .Where(x => x.StartsWith(resourcePathPrefix))
                .ToList();

            if (!themeResources.Any())
            {
                throw new DirectoryNotFoundException($"The source theme '{themeName}' could not be found as an embedded resource.");
            }

            try
            {
                Directory.CreateDirectory(destinationPhysicalPath);

                foreach (var resourceName in themeResources)
                {
                    // "Articulate.Themes/VAPOR/Assets/css/theme.css"
                    // becomes "Assets/css/theme.css"
                    var relativePath = resourceName[resourcePathPrefix.Length..];

                    // Replace the forward slashes from the resource name with the correct directory separator for the current operating system (e.g., \ on Windows).
                    var finalRelativePath = relativePath.Replace('/', Path.DirectorySeparatorChar);

                    var destinationFilePath = Path.Combine(destinationPhysicalPath, finalRelativePath);

                    if (Path.GetDirectoryName(destinationFilePath) is { } directoryPath)
                    {
                        Directory.CreateDirectory(directoryPath);
                    }
                    else
                    {
                        _logger.LogError("Could not determine a valid directory path from '{destinationFilePath}' for '{ResourceName}'. Skipping file creation.", destinationFilePath, resourceName);
                        continue;
                    }

                    await using Stream? stream = _articulateAssembly.GetManifestResourceStream(resourceName);
                    if (stream is null)
                    {
                        _logger.LogError("Could not find resource stream for '{ResourceName}'. Skipping file creation.", resourceName);
                        continue;
                    }

                    await using var fileStream = new FileStream(destinationFilePath, FileMode.Create);
                    await stream.CopyToAsync(fileStream);
                }

                _appCaches.RuntimeCache.ClearByKey(AllThemesCacheKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error copying embedded theme '{SourceTheme}' to '{DestinationTheme}'.", themeName, newThemeName);
                throw;
            }
        }

        public Task<IEnumerable<string>> GetDefaultThemesAsync() => Task.Run(() => DefaultThemes.AllThemeNames);


        public Task<IEnumerable<string>> GetUserThemesAsync() => Task.Run(() => GetThemesFromPathAsync(PathHelper.UserVirtualThemePath));

        public async Task<IEnumerable<string>?> GetAllThemesAsync()
        {
            return await _appCaches.RuntimeCache.GetCacheItemAsync(
                AllThemesCacheKey,
                async () =>
                {
                    Task<IEnumerable<string>> defaultThemesTask = GetDefaultThemesAsync();
                    Task<IEnumerable<string>> userThemesTask = GetUserThemesAsync();

                    IEnumerable<string>[] results = await Task.WhenAll(defaultThemesTask, userThemesTask);
                    return results[0].Union(results[1]).OrderBy(name => name);
                },
                TimeSpan.FromSeconds(30)).ConfigureAwait(false);
        }

        private Task<IEnumerable<string>> GetThemesFromPathAsync(string virtualPath)
        {
            var physicalPath = _hostingEnvironment.MapPathContentRoot(virtualPath);
            return Task.Run(() =>
            {
                return Directory.Exists(physicalPath)
                    ? new DirectoryInfo(physicalPath).GetDirectories().Select(d => d.Name)
                    : [];
            });
        }
    }
}
