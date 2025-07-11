using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Articulate.Attributes;
using Articulate.Models.ManagementApi;
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

namespace Articulate.Controllers.ManagementApi
{
    [ManagementApi(ArticulateEnum.ManagementApi.ThemeOptions)]
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/theme")]
    [MapToApi(ArticulateConstants.ManagementApi.Name)]
    public class ThemeOptionsController(IThemeService themeService, ILogger<ThemeOptionsController> logger) : ManagementApiControllerBase
    {
        [HttpPost("copy")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Copy(ThemeCopyModel model)
        {
            try
            {
                await themeService.CopyThemeAsync(model.ThemeName, model.NewThemeName);
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
        public IActionResult GetDefaultThemes()
        {
            try
            {
                var themes = themeService.GetDefaultThemes();
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
