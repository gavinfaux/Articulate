using System;
using System.IO;
using System.Threading.Tasks;
using Articulate.ImportExport;
using Articulate.Models.ManagmentApi;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace Articulate.Controllers.ManagementApi
{
    /// <summary>
    /// Provides import and export of Articulate blog data using BlogML and Disqus formats.
    /// </summary>
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/blogml")]
    [ApiExplorerSettings(GroupName = "BlogML")]
    [MapToApi(ArticulateConstants.ApiName)]
    public class ArticulateBlogMlController(
        BlogMlExporter blogMlExporter,
        BlogMlImporter blogMlImporter,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        ArticulateTempFileSystem articulateTempFileSystem,
        ILogger<ArticulateBlogMlController> logger)
        : ManagementApiControllerBase
    {
        /// <summary>
        /// Begins the BlogML import process by accepting an uploaded XML file, storing it temporarily, and returning a temporary file name along with the detected post count.
        /// This endpoint must be called before performing a blog export using the articulate/blog/import endpoint.
        /// </summary>
        /// <param name="importFile">The file to import, must be an XML file in BlogML format.</param>
        /// <remarks>
        /// The name specified in the form's element or FormData must match the name of the parameter in the controller's action, e.g. <![CDATA[&lt;input type="file" name="importFile"&gt;]]>
        /// </remarks>
        /// <response code="200">Returns the temporary file name and post count.</response>
        /// <response code="415">The request is not a valid form file, file is missing or the file is not XML.</response>
        /// <response code="500">Upload failed due to a server error.</response>
        [HttpPost("import-file")]
        [ProducesResponseType<ImportFileResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status415UnsupportedMediaType)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> PostInitialize(IFormFile importFile)
        {
            try
            {
                if (importFile == null || !Path.GetExtension(importFile.FileName.Trim("\"").ToLowerInvariant()).InvariantEquals(".xml"))
                {
                    const string warningMessage = "The request was not a valid form file or the file was not XML";
                    logger.LogWarning(warningMessage);
                    return StatusCode(StatusCodes.Status415UnsupportedMediaType, new ProblemDetails { Title = "Invalid request", Detail = warningMessage, Status = StatusCodes.Status415UnsupportedMediaType });
                }

                var fileName = Path.GetRandomFileName();
                using (var stream = new MemoryStream())
                {
                    await Request.Form.Files[0].CopyToAsync(stream);
                    articulateTempFileSystem.AddFile(fileName, stream);
                }

                var count = blogMlImporter.GetPostCount(fileName);

                return Ok(new ImportFileResponse
                {
                    PostCount = count,
                    TemporaryFileName = fileName
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Export failed with errors");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Server error",
                    Detail = ex.Message,
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Exports blog data as a BlogML XML file.
        /// </summary>
        /// <param name="model">The export options including the Articulate node ID and image export settings.</param>
        /// <returns>A file stream containing the BlogML XML file.</returns>
        /// <response code="200">Returns the BlogML XML file as an octet-stream. The filename in the Content-Disposition header will be in the format: articulate-export-yyyyMMddHHmmss.xml.</response>
        /// <response code="500">Export failed due to a server error.</response>
        [HttpPost("export")]
        [ProducesResponseType(typeof(byte[]), StatusCodes.Status200OK, "application/octet-stream")]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> PostExportBlogMl(ExportModel model)
        {
            try
            {

                blogMlExporter.Export(model.ArticulateBlogNode, model.ExportImagesAsBase64);
                var downloadFileName = $"articulate-export-{DateTime.UtcNow:yyyyMMddHHmmss}.xml";
                Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{downloadFileName}\"");
                Response.ContentType = "application/octet-stream";

                await using (var fileStream = articulateTempFileSystem.OpenFile("BlogMlExport.xml"))
                {
                    await fileStream.CopyToAsync(Response.Body);
                    await Response.Body.FlushAsync();
                }

                articulateTempFileSystem.DeleteFile("BlogMlExport.xml");
                return new EmptyResult();
            }
            catch (InvalidOperationException ex)
            {
                logger.LogError(ex, "Export failed with errors");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails
                {
                    Title = "Bad Request",
                    Detail = ex.Message,
                    Status = StatusCodes.Status503ServiceUnavailable

                });

            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Export failed with errors");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Server error",
                    Detail = ex.Message,
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Imports blog data from a previously uploaded BlogML XML file.
        /// This endpoint should be called after initializing the import with the articulate/blog/import/begin endpoint.
        /// </summary>
        /// <param name="model">The import options including the temporary file name, Articulate node ID, and import settings.</param>
        /// <returns>An object containing import statistics and the download URL for the Disqus export, if applicable.</returns>
        /// <response code="200">Returns import statistics and the download URL for the comment export file for upload to Disqus, if applicable.</response>
        /// <response code="400">The requested Articulate node ID could not be found or is not a valid Articulate node.</response>
        /// <response code="404">The requested temporary file could not be found.</response>
        /// <response code="500">Import failed due to a server error.</response>
        [HttpPost("import")]
        [ProducesResponseType<ImportResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ImportResponse>> PostImportBlogMl(ImportModel model)
        {
            if (!articulateTempFileSystem.FileExists(model.TempFile))
            {
                return StatusCode(StatusCodes.Status404NotFound, new ProblemDetails
                {
                    Title = "File Not Found",
                    Detail = $"The temporary file {model.TempFile} could not be found.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            // this should never happen since Authorize the attribute applied to ManagementApi?!
            // also don't add a ProducesResponseType(StatusCodes.Status401Unauthorized) to ManagementApi since already added, cos Authorize attribute ;)
            if (backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser == null)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new ProblemDetails
                {
                    Title = "Not Authorized",
                    Detail = "The current user is not authenticated or could not be found.",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            ImportResponse result;

            try
            {
                result = await blogMlImporter.Import(
                    backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.Id,
                    model.TempFile,
                    model.ArticulateBlogNode,
                    model.Overwrite,
                    model.RegexMatch,
                    model.RegexReplace,
                    model.Publish,
                    model.ExportDisqusXml,
                    model.ImportFirstImage);

                //cleanup
                articulateTempFileSystem.DeleteFile(model.TempFile);

                if (!result.Completed)
                {
                    logger.LogError("Import did not signal completion, review previous log entries for more information");
                    return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                    {
                        Title = "Server error",
                        Detail = "Import failed, see back office logs for details",
                        Status = StatusCodes.Status500InternalServerError
                    });
                }

            }
            catch (FileNotFoundException ex)
            {
                logger.LogError(ex, "Importing failed with errors");
                return StatusCode(StatusCodes.Status404NotFound, new ProblemDetails
                {
                    Title = $"The temporary file {model.TempFile} could not be found.",
                    Detail = ex.Message,
                    Status = StatusCodes.Status404NotFound
                });
            }
            catch (InvalidOperationException ex)
            {
                logger.LogError(ex, "Importing failed with errors");
                return StatusCode(StatusCodes.Status400BadRequest, new ProblemDetails
                {
                    Title = "Bad Request",
                    Detail = ex.Message
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Importing failed with errors");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Server error",
                    Detail = ex.Message
                });
            }

            return Ok(result);
        }

        /// <summary>
        /// Downloads the exported Disqus comment XML file, if one was generated by the BlogML import.
        /// This endpoint should be called after importing the BlogML file with the articulate/blog/import endpoint.
        /// </summary>
        /// <returns>A file stream containing the Disqus comments XML file extracted from the BlogML import XML file.</returns>
        /// <response code="200">Returns the Disqus comment XML file as an octet-stream. The filename in the Content-Disposition header will be in the format: articulate-disqus-comments-yyyyMMddHHmmss.xml.</response>
        /// <response code="404">The Disqus XML export file could not be found.</response>
        [HttpGet("export/disqus")]
        [ProducesResponseType(typeof(byte[]), StatusCodes.Status200OK, "application/octet-stream")]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetDisqusExport()
        {
            if (!articulateTempFileSystem.FileExists("DisqusXmlExport.xml"))
            {
                var message = "Disqus comments export file not found.";
                logger.LogWarning(message);
                return NotFound(new ProblemDetails { Title = "File not found.", Detail = message, Status = StatusCodes.Status404NotFound });
            }

            var downloadFileName = $"articulate-disqus-comments-{DateTime.UtcNow:yyyyMMddHHmmss}.xml";
            Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{downloadFileName}\"");
            Response.ContentType = "application/octet-stream";

            await using (var fileStream = articulateTempFileSystem.OpenFile("DisqusXmlExport.xml"))
            {
                await fileStream.CopyToAsync(Response.Body);
                await Response.Body.FlushAsync();
            }

            articulateTempFileSystem.DeleteFile("DisqusXmlExport.xml");
            return new EmptyResult();
        }

    }
}
