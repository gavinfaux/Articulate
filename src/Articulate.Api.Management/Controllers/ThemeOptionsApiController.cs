#nullable enable
using Articulate.Api.Management.Attributes;
using Articulate.Api.Management.Models;
using Articulate.Services;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Web.Common.Authorization;

namespace Articulate.Api.Management.Controllers
{
    /// <summary>
    /// Provides API endpoints for managing Articulate themes, including copying a theme and retrieving default themes.
    /// </summary>
    /// <summary>
    /// Provides API endpoints for managing Articulate themes, including operations for copying a theme to a new name and retrieving default themes.
    /// </summary>
    [ManagementApi(Constants.ManagementApi.ThemeOptions)]
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/theme")]
    [MapToApi(Constants.ManagementApi.Name)]
    public class ThemeOptionsApiController(
        IArticulateThemeRepository themeRepository,
        ILogger<ThemeOptionsApiController> logger) : ManagementApiControllerBase
    {
        /// <summary>
        /// Copies a theme to a new theme name.
        /// </summary>
        /// <param name="model">The model containing the theme name to copy and the new theme name.</param>
        /// <returns>The new theme name.</returns>
        /// <response code="200">The theme was successfully copied to the new theme name.</response>
        /// <response code="404">The theme name specified in the model does not exist.</response>
        /// <response code="409">The new theme name specified in the model already exists.</response>
        /// <response code="500">An unexpected error occurred during the theme copy operation.</response>
        [HttpPost("copy")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Copy(ThemeCopyModel model)
        {
            try
            {
                await themeRepository.CopyThemeAsync(model.ThemeName, model.NewThemeName).ConfigureAwait(false);
                return Ok(model.NewThemeName);
            }
            catch (DirectoryNotFoundException ex)
            {
                return NotFound(new ProblemDetails { Title = "Theme Not Found", Detail = ex.Message });
            }
            catch (IOException ex)
            {
                return Conflict(new ProblemDetails { Title = "Duplicate Theme Name", Detail = ex.Message });
            }
            catch (Exception e)
            {
                logger.LogError(e, "An unexpected error occurred during the theme copy operation.");
                return Problem(
                    "An unexpected error occurred during the theme copy operation.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Retrieves the list of default Articulate themes.
        /// </summary>
        /// <remarks>
        /// This endpoint returns the names of all default themes available in the system.
        /// </remarks>
        /// <returns>
        /// A list of default theme names as strings.
        /// </returns>
        /// <response code="200">Returns the list of default theme names.</response>
        /// <response code="500">An unexpected error occurred while retrieving default themes.</response>
        [HttpGet("default")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDefaultThemes()
        {
            try
            {
                IEnumerable<string> themes = await themeRepository.GetDefaultThemesAsync().ConfigureAwait(false);
                return Ok(themes);
            }
            catch (Exception e)
            {
                logger.LogError(e, "An unexpected error occurred while retrieving default themes.");
                return Problem(
                    "An error occurred while retrieving default themes.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }
        }
    }
}
