using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Articulate.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Extensions;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace Articulate.Services
{

    public class ArticulateThemeRepository(
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedValueFallback publishedValueFallback,
        IWebHostEnvironment hostingEnvironment,
        ILogger<ArticulateThemeRepository> logger)
        : IArticulateThemeRepository
    {

        public async Task CopyThemeAsync(string themeName, string newThemeName)
        {
            var userThemesPath = hostingEnvironment.MapPathContentRoot(PathHelper.UserVirtualThemePath);
            var destinationPhysicalPath = Path.Combine(userThemesPath, newThemeName);

            if (Directory.Exists(destinationPhysicalPath))
            {
                throw new IOException("A theme with the specified name already exists.");
            }

            var defaultThemesPath = hostingEnvironment.MapPathContentRoot(PathHelper.VirtualThemePath);
            var sourcePhysicalPath = Path.Combine(defaultThemesPath, themeName);

            if (!Directory.Exists(sourcePhysicalPath))
            {
                sourcePhysicalPath = Path.Combine(userThemesPath, themeName);
                if (!Directory.Exists(sourcePhysicalPath))
                {
                    throw new DirectoryNotFoundException("The source theme could not be found.");
                }
            }

            try
            {
                await CopyDirectoryAsync(sourcePhysicalPath, destinationPhysicalPath);
            }
            catch (Exception ex)
            {
                logger.LogError(ex,
                    "An unexpected error occurred while copying theme '{SourceTheme}' to '{DestinationTheme}'.",
                    themeName, newThemeName);
                throw;
            }
        }

        public Task<IEnumerable<string>> GetDefaultThemesAsync()
        {
            var defaultThemePath = hostingEnvironment.MapPathContentRoot(PathHelper.VirtualThemePath);

            return Task.Run(() =>
            {
                return Directory.Exists(defaultThemePath)
                    ? new DirectoryInfo(defaultThemePath).GetDirectories().Select(d => d.Name).OrderBy(name => name)
                    : Enumerable.Empty<string>();
            });
        }

        public Task<IEnumerable<string>> GetUserThemesAsync()
        {
            var userThemePath = hostingEnvironment.MapPathContentRoot(PathHelper.UserVirtualThemePath);
            return Task.Run(() =>
            {
                return Directory.Exists(userThemePath)
                    ? new DirectoryInfo(userThemePath).GetDirectories().Select(d => d.Name).OrderBy(name => name)
                    : Enumerable.Empty<string>();
            });
        }

        public async Task<IEnumerable<string>> GetAllThemesAsync()
        {
            var defaultThemesTask = GetDefaultThemesAsync();
            var userThemesTask = GetUserThemesAsync();

            var results = await Task.WhenAll(defaultThemesTask, userThemesTask);

            var defaultThemes = results[0];
            var userThemes = results[1];

            return defaultThemes.Union(userThemes).OrderBy(name => name);
        }

        private static async Task CopyDirectoryAsync(string sourcePath, string destinationPath)
        {
            var sourceInfo = new DirectoryInfo(sourcePath);
            Directory.CreateDirectory(destinationPath);

            foreach (var file in sourceInfo.GetFiles())
            {
                var destinationFile = Path.Combine(destinationPath, file.Name);
                await using var sourceStream = file.OpenRead();
                await using var destinationStream =
                    new FileStream(destinationFile, FileMode.CreateNew, FileAccess.Write);
                await sourceStream.CopyToAsync(destinationStream);
            }

            foreach (var dir in sourceInfo.GetDirectories())
            {
                var destinationDir = Path.Combine(destinationPath, dir.Name);
                await CopyDirectoryAsync(dir.FullName, destinationDir);
            }
        }
    }

}
