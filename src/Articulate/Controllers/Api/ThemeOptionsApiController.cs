#nullable enable
using Articulate.Attributes;
using Articulate.Models.Api;
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

namespace Articulate.Controllers.Api
{
    [ManagementApi(ArticulateConstants.ManagementApi.ThemeOptions)]
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/theme")]
    [MapToApi(ArticulateConstants.ManagementApi.Name)]
    public class ThemeOptionsApiController(IArticulateThemeRepository themeRepository, ILogger<ThemeOptionsApiController> logger) : ManagementApiControllerBase
    {
        [HttpPost("copy")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Copy(ThemeCopyModel model)
        {
            if (string.IsNullOrWhiteSpace(model.ThemeName) || string.IsNullOrWhiteSpace(model.NewThemeName))
            {
                if (string.IsNullOrWhiteSpace(model.ThemeName))
                {
                    ModelState.AddModelError(nameof(model.ThemeName), "The name of the theme to copy is required.");
                }
                if (string.IsNullOrWhiteSpace(model.NewThemeName))
                {
                    ModelState.AddModelError(nameof(model.NewThemeName), "The name of the new theme is required.");
                }
                return ValidationProblem(ModelState);
            }

            try
            {
                await themeRepository.CopyThemeAsync(model.ThemeName, model.NewThemeName);
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

        [HttpGet("default")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDefaultThemes()
        {
            try
            {
                IEnumerable<string> themes = await themeRepository.GetDefaultThemesAsync();
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
