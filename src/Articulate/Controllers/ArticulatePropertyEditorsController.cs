using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Core.Extensions;

namespace Articulate.Controllers
{
    public class ArticulatePropertyEditorsController : ManagementApiControllerBase
    {
        private readonly IHostEnvironment _hostingEnvironment;

        public ArticulatePropertyEditorsController(IHostEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        public IEnumerable<string> GetThemes()
        {
            var defaultThemeDir = _hostingEnvironment.MapPathContentRoot(PathHelper.VirtualThemePath);
            var defaultThemes = Directory.GetDirectories(defaultThemeDir).Select(x => new DirectoryInfo(x).Name);

            var userThemeDir = _hostingEnvironment.MapPathContentRoot(PathHelper.UserVirtualThemePath);
            var userThemes = Directory.Exists(userThemeDir)
                ? Directory.GetDirectories(userThemeDir).Select(x => new DirectoryInfo(x).Name)
                : Enumerable.Empty<string>();

            return userThemes.Union(defaultThemes);
        }
    }
}
