using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Articulate.Models;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Extensions;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace Articulate.Controllers
{
    /// <summary>
    /// Provides API endpoints for managing Articulate themes, including listing and copying default themes.
    /// </summary>
    /// <example>
    /// Use this controller to retrieve available default themes or to copy an existing theme to a new name.
    /// </example>
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/themes")]
    [MapToApi("articulate-api")]
    [ApiExplorerSettings(GroupName = "Articulate")]
    public class ThemeEditorController(IHostEnvironment hostingEnvironment, ILogger<ThemeEditorController> logger) : ManagementApiControllerBase
    {
        /// <summary>
        /// Represents the possible operation statuses for theme editing actions.
        /// </summary>
        /// <example>NotFound</example>
        public enum ThemeEditorOperationStatus
        {
            /// <summary>
            /// The requested theme was not found.
            /// </summary>
            NotFound,
            /// <summary>
            /// The new theme name is already in use.
            /// </summary>
            DuplicateThemeName
        }

        /// <summary>
        /// Copies an existing theme to a new theme with a specified name.
        /// </summary>
        /// <remarks>
        /// This endpoint creates a copy of an existing theme under a new name. The new theme name must be unique.
        /// </remarks>
        /// <param name="model">The model containing the source theme name and the new theme name.</param>
        /// <response code="200">Returns the name of the newly created theme.</response>
        /// <response code="400">The new theme name is already in use or the request is invalid.</response>
        /// <response code="404">The source theme was not found.</response>
        /// <response code="500">An internal server error occurred while copying the theme.</response>
        [HttpPost("copy")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        public IActionResult PostCopyTheme([FromBody, BindRequired] PostCopyThemeModel model)
        {
            // ManagementApiControllerBase [ApiController] attribute will automatically validate the model

            var themeFolderDirectories = GetThemeDirectories();

            var sourceTheme = themeFolderDirectories.FirstOrDefault(x => x.Name.InvariantEquals(model.ThemeName));
            if (sourceTheme == null)
            {
                logger.LogError("Theme directory not found: {ThemeName}", model.ThemeName);
                return OperationStatusResult(ThemeEditorOperationStatus.NotFound, builder => NotFound(builder.WithTitle("Server error").WithDetail($"{model.ThemeName} not found.").Build()));
            }

            var articulateUserThemesDirectory = hostingEnvironment.MapPathContentRoot(PathHelper.UserVirtualThemePath);
            if (!Directory.Exists(articulateUserThemesDirectory))
            {
                _ = Directory.CreateDirectory(articulateUserThemesDirectory);
            }

            var articulateUserThemesDirectories = new DirectoryInfo(articulateUserThemesDirectory).GetDirectories();

            var destTheme = articulateUserThemesDirectories.FirstOrDefault(x => x.Name.InvariantEquals(model.NewThemeName));

            if (destTheme != null)
            {
                logger.LogWarning("Theme name is already is use: {ThemeName}", model.ThemeName);
                return OperationStatusResult(ThemeEditorOperationStatus.DuplicateThemeName, builder => BadRequest(builder.WithTitle($"Theme {model.ThemeName} is already used").WithDetail("The theme name must be unique.").Build()));
            }

            try 
            {
                CopyDirectory(sourceTheme, new DirectoryInfo(Path.Combine(articulateUserThemesDirectory, model.NewThemeName)));
            }
            catch (InvalidOperationException e)
            {
                if (e.Message == "Theme already exists")
                {
                    logger.LogWarning(e,"Theme name is already is use: {ThemeName}", model.NewThemeName);
                    return OperationStatusResult(ThemeEditorOperationStatus.DuplicateThemeName, builder => BadRequest(builder.WithTitle($"Theme {model.ThemeName} is already used").WithDetail("The theme name must be unique.").Build()));
                }

                throw;
            }

            return Ok(model.NewThemeName);
        }

        /// <summary>
        /// Retrieves the list of available default Articulate themes.
        /// </summary>
        /// <remarks>
        /// This endpoint returns the names of default themes available for Articulate.
        /// </remarks>
        /// <returns>
        /// A list of theme names as strings.
        /// </returns>
        /// <response code="200">Returns the list of available theme names.</response>
        [HttpGet("all")]
        [ProducesResponseType<List<string>>(StatusCodes.Status200OK)]
        public IActionResult GetThemes()
            =>  Ok(
                AllThemes()
            );

        /// <summary>
        /// Gets all default theme directory names.
        /// </summary>
        /// <returns>A list of theme names.</returns>
        private List<string> AllThemes()
        {
            var themeFolderDirectories = GetThemeDirectories();

            var themes = themeFolderDirectories
                .Select(x => x.Name);

            return [.. themes];
        }

        /// <summary>
        /// Gets the directories for default themes.
        /// </summary>
        /// <returns>An array of <see cref="DirectoryInfo"/> objects representing theme directories.</returns>
        private DirectoryInfo[] GetThemeDirectories()
        {
            var themeFolder = hostingEnvironment.MapPathContentRoot(PathHelper.VirtualThemePath);
            var themeFolderDirectories = new DirectoryInfo(Path.Combine(themeFolder)).GetDirectories();
            return themeFolderDirectories;
        }

        /// <summary>
        /// Recursively copies the contents of a source directory to a destination directory.
        /// </summary>
        /// <param name="source">The source directory.</param>
        /// <param name="destination">The destination directory.</param>
        /// <exception cref="InvalidOperationException">Thrown if the destination directory already exists.</exception>
        private static void CopyDirectory(DirectoryInfo source, DirectoryInfo destination)
        {
            if (destination.Exists)
            {
                throw new InvalidOperationException("Theme already exists");
            }

            destination.Create();

            // Copy all files.
            var files = source.GetFiles();
            foreach (var file in files)
            {
                _ = file.CopyTo(Path.Combine(destination.FullName, file.Name));
            }

            // Process subdirectories.
            var dirs = source.GetDirectories();
            foreach (var dir in dirs)
            {
                // Get destination directory.
                var destinationDir = Path.Combine(destination.FullName, dir.Name);

                // Call CopyDirectory() recursively.
                CopyDirectory(dir, new DirectoryInfo(destinationDir));
            }
        }
    }
}
