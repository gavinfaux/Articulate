#nullable enable
using System.Text;
using Articulate.Attributes;
using Articulate.MetaWeblog;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;
using WilderMinds.MetaWeblog;

namespace Articulate.Controllers;

/// <summary>
/// Custom controller to handle the webblog endpoints so that we can wire
/// up the articulate start node for the IMetaWeblogProvider data source.
/// </summary>
/// <remarks>
/// The nuget package we use https://github.com/shawnwildermuth/MetaWeblog has
/// middleware but that just supports one endpoint, we are basically wrapping that
/// with our own multi-tenanted version.
/// </remarks>
[ArticulateDynamicRoute]
public class MetaWeblogController(
    ILogger<MetaWeblogController> logger,
    ICompositeViewEngine compositeViewEngine,
    IUmbracoContextAccessor umbracoContextAccessor,
    IServiceProvider serviceProvider)
    : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
{
    [HttpPost]
    public async Task<ActionResult> IndexAsync(int id)
    {
        if (id <= 0)
        {
            return Problem("Invalid root node id");
        }

        // create the provider using the start node
        ArticulateMetaWeblogProvider provider = ActivatorUtilities.CreateInstance<ArticulateMetaWeblogProvider>(
            serviceProvider,
            id);

        // create the service using the provider
        MetaWeblogService service = ActivatorUtilities.CreateInstance<MetaWeblogService>(serviceProvider, provider);

        string rawContent;
        using (var reader = new StreamReader(Request.Body))
        {
            rawContent = await reader.ReadToEndAsync().ConfigureAwait(false);
        }

        try
        {
            var result = await service.InvokeAsync(rawContent).ConfigureAwait(false);
            return Content(result, "text/xml", Encoding.UTF8);
        }
        catch (NullReferenceException ex)
        {
            logger.LogError("A NullReferenceException occurred processing a metaWeblog request. Raw Content: {RawXml}", rawContent);

            logger.LogError(ex, "NullReferenceException details for metaWeblog call:");

            return StatusCode(500, "An error occurred while processing the request.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An unexpected exception occurred in metaWeblog service.");
            return StatusCode(500, "An error occurred while processing the request.");
        }
    }
}
