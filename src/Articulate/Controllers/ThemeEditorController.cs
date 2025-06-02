using Articulate.Models;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Extensions;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace Articulate.Controllers
{
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/theme-editor")]
    [ApiExplorerSettings(GroupName = "Articulate")]
    public class ThemeEditorController(IHostEnvironment hostingEnvironment) : ManagementApiControllerBase
    {
        public enum ThemeEditorOperationStatus
        {
            NotFound,
            DuplicateValue
        }

        [HttpPost]
        [ProducesResponseType<Theme>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
        public IActionResult PostCopyTheme([FromBody] PostCopyThemeModel model)
        {
            // ManagementApiControllerBase [ApiController] attribute will automatically validate the model

            var themeFolderDirectories = GetThemeDirectories();

            var sourceTheme = themeFolderDirectories.FirstOrDefault(x => x.Name.InvariantEquals(model.ThemeName));
            if (sourceTheme == null)
            {
                return OperationStatusResult(ThemeEditorOperationStatus.NotFound, builder => NotFound(builder.WithTitle("Theme directory not found").Build()));
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
                return OperationStatusResult(ThemeEditorOperationStatus.DuplicateValue, builder => BadRequest(builder.WithTitle("Theme name is already used").WithDetail("The theme name must be unique").Build()));

            }
            try 
            {
                CopyDirectory(sourceTheme, new DirectoryInfo(Path.Combine(articulateUserThemesDirectory, model.NewThemeName)));
            }
            catch (InvalidOperationException)
            {
                return OperationStatusResult(ThemeEditorOperationStatus.DuplicateValue, builder => BadRequest(builder.WithTitle("Theme name is already used").WithDetail("The theme name must be unique").Build()));
            }

            return Ok(new Theme
            {
                Name = model.NewThemeName,
                Path = "-1," + model.NewThemeName

            });
        }

        private List<Theme> AllThemes()
        {
            var themeFolderDirectories = GetThemeDirectories();

            var themes = themeFolderDirectories
                .Select(x => new Theme
                {
                    Name = x.Name
                });

            return [.. themes];
        }

        [HttpGet]
        [ProducesResponseType<List<Theme>>(StatusCodes.Status200OK)]
        public IActionResult GetThemes()
            =>  Ok(
                AllThemes()

            );

        private DirectoryInfo[] GetThemeDirectories()
        {
            var themeFolder = hostingEnvironment.MapPathContentRoot(PathHelper.VirtualThemePath);
            var themeFolderDirectories = new DirectoryInfo(Path.Combine(themeFolder)).GetDirectories();
            return themeFolderDirectories;
        }

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
