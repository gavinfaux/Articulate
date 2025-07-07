using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Articulate.Models.ManagmentApi;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Extensions;
using Umbraco.Cms.Web.Common.Authorization;

namespace Articulate.Controllers.ManagementApi
{
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/themes")]
    [MapToApi(ArticulateConstants.ApiName)]
    [ApiExplorerSettings(GroupName = "Themes")]
    public class ArticulateThemesController(IHostEnvironment hostingEnvironment, ILogger<ArticulateThemesController> logger) : ManagementApiControllerBase
    {
        [HttpPost("copy")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> PostCopyTheme(ThemeCopyModel model)
        {
            if (string.IsNullOrWhiteSpace(model.NewThemeName) || model.NewThemeName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
            {
                return BadRequest(new ProblemDetails { Title = "Invalid Theme Name", Detail = "The new theme name contains invalid characters." });
            }

            var userThemesPath = hostingEnvironment.MapPathContentRoot(PathHelper.UserVirtualThemePath);
            var destinationPhysicalPath = Path.Combine(userThemesPath, model.NewThemeName);

            if (Directory.Exists(destinationPhysicalPath))
            {
                return Conflict(new ProblemDetails { Title = "Duplicate Theme Name", Detail = $"A theme with the name '{model.NewThemeName}' already exists." });
            }

            var defaultThemesPath = hostingEnvironment.MapPathContentRoot(PathHelper.VirtualThemePath);
            var sourcePhysicalPath = Path.Combine(defaultThemesPath, model.ThemeName);

            if (!Directory.Exists(sourcePhysicalPath))
            {
                sourcePhysicalPath = Path.Combine(userThemesPath, model.ThemeName);
                if (!Directory.Exists(sourcePhysicalPath))
                {
                    return NotFound(new ProblemDetails { Title = "Theme Not Found", Detail = $"The source theme '{model.ThemeName}' could not be found." });
                }
            }

            try
            {
                await CopyDirectoryAsync(sourcePhysicalPath, destinationPhysicalPath);
                return Ok(model.NewThemeName);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An unexpected error occurred while copying theme '{SourceTheme}' to '{DestinationTheme}'.", model.ThemeName, model.NewThemeName);
                return Problem("An unexpected error occurred during the theme copy operation.", statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpGet("default")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public IActionResult GetDefaultThemes()
        {
            try
            {
                var defaultThemePath = hostingEnvironment.MapPathContentRoot(PathHelper.VirtualThemePath);
                var defaultThemes = Directory.Exists(defaultThemePath)
                    ? new DirectoryInfo(defaultThemePath).GetDirectories().Select(d => d.Name).OrderBy(name => name)
                    : Enumerable.Empty<string>();

                return Ok(defaultThemes);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to retrieve default themes.");
                return Problem("An error occurred while retrieving default themes.", statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        private async Task CopyDirectoryAsync(string sourcePath, string destinationPath)
        {
            var sourceInfo = new DirectoryInfo(sourcePath);

            foreach (var file in sourceInfo.GetFiles())
            {
                var destinationFile = Path.Combine(destinationPath, file.Name);
                await using var sourceStream = file.OpenRead();
                await using var destinationStream = new FileStream(destinationFile, FileMode.CreateNew, FileAccess.Write);
                await sourceStream.CopyToAsync(destinationStream);
            }

            foreach (var dir in sourceInfo.GetDirectories())
            {
                var destinationDir = Path.Combine(destinationPath, dir.Name);
                Directory.CreateDirectory(destinationDir);
                await CopyDirectoryAsync(dir.FullName, destinationDir);
            }
        }
    }
}
