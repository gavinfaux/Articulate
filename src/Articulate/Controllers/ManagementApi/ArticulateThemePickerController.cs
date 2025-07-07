using System.Collections.Generic;
using System.IO;
using System.Linq;
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
    // NOTE: ManagementApiControllerBase [ApiController] attribute will automatically validate the model
    // [ApiController] attribute also infers [FromBody] for model binding

    /// <summary>
    /// Provides API endpoints for copying an Articulate default theme to a new theme name to allow customisation.
    /// </summary>
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/editors/theme-picker")]
    [MapToApi(ArticulateConstants.ApiName)]
    [ApiExplorerSettings(GroupName = "Theme Picker")]
    public class ArticulateThemePickerController(IHostEnvironment hostingEnvironment, ILogger<ArticulateThemePickerController> logger) : ManagementApiControllerBase
    {

        /// <summary>
        /// Gets the list of all available Articulate themes, both default and user-defined.
        /// </summary>
        /// <remarks>
        /// This endpoint returns the names of all available themes, including both default and user-defined themes.
        /// </remarks>
        /// <returns>
        /// A list of theme names as strings.
        /// </returns>
        /// <response code="200">Returns the list of all available theme names.</response>
        [HttpGet("themes")]
        [ProducesResponseType<IEnumerable<string>>(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<string>> GetAllThemes()
        {
            var defaultThemeDir = hostingEnvironment.MapPathContentRoot(PathHelper.VirtualThemePath);
            var defaultThemes = Directory.GetDirectories(defaultThemeDir).Select(x => new DirectoryInfo(x).Name);

            var userThemeDir = hostingEnvironment.MapPathContentRoot(PathHelper.UserVirtualThemePath);
            var userThemes = Directory.Exists(userThemeDir)
                ? Directory.GetDirectories(userThemeDir).Select(x => new DirectoryInfo(x).Name)
                : [];

            return Ok(userThemes.Union(defaultThemes));
        }


    }
}
