using System.Collections.Generic;
using System.IO;
using System.Linq;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Extensions;
using Umbraco.Cms.Web.Common.Authorization;

namespace Articulate.Controllers
{
    /// <summary>
    /// Provides API endpoints for Articulate property editors, such as retrieving available themes.
    /// </summary>
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/editors")]
    [ApiExplorerSettings(GroupName = "Articulate")]
    [MapToApi("articulate-api")]
    public class ArticulatePropertyEditorsController(IHostEnvironment hostingEnvironment) : ManagementApiControllerBase
    {
        /// <summary>
        /// Gets the list of available Articulate themes, consumed by Articulate Theme Picker property editor.
        /// </summary>
        /// <remarks>
        /// This endpoint returns the names of all available themes, including both default and user-defined themes.
        /// </remarks>
        /// <returns>
        /// A collection of theme names as strings.
        /// </returns>
        /// <response code="200">Returns the list of available theme names.</response>
        [HttpGet("themes")]
        [ProducesResponseType<IEnumerable<string>>(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<string>> GetThemes()
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
