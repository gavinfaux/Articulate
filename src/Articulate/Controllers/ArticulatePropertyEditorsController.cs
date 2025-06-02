using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Extensions;
using Umbraco.Cms.Web.Common.Authorization;

namespace Articulate.Controllers
{
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/themes")]
    [ApiExplorerSettings(GroupName = "Articulate")]
    public class ArticulatePropertyEditorsController(IHostEnvironment hostingEnvironment) : ManagementApiControllerBase
    {
        [HttpGet]
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
