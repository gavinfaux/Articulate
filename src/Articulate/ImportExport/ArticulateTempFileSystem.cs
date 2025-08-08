#nullable enable
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.IO;

namespace Articulate.ImportExport
{
    public class ArticulateTempFileSystem(
        IIOHelper ioHelper,
        IHostingEnvironment hostingEnvironment,
        ILogger<ArticulateTempFileSystem> logger)
        : PhysicalFileSystem(ioHelper, hostingEnvironment, logger, "temp/articulate", Guid.NewGuid().ToString());
}
