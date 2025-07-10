using System;
using System.IO;
using System.Threading.Tasks;
using Articulate.ImportExport;
using Articulate.Models.ManagementApi;
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
    [ManagementApi(ArticulateEnum.ManagementApi.BlogML)]
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/blogml")]
    [MapToApi(ArticulateConstants.ManagementApi.Name)]
    public class BlogMlController(
        BlogMlExporter blogMlExporter,
        BlogMlImporter blogMlImporter,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        ArticulateTempFileSystem articulateTempFileSystem,
        ILogger<BlogMlController> logger)
        : ManagementApiControllerBase
    {
        /// <summary>
        /// Begins the BlogML import process by accepting an uploaded XML file.
        /// </summary>
        /// <param name="importFile">The file to import, must be an XML file in BlogML format.</param>
        /// <remarks>The name specified in the form's element or FormData must match the name of the parameter, e.g., <![CDATA[<input type="file" name="importFile">]]></remarks>
        /// <response code="200">Returns the temporary file name and post count.</response>
        /// <response code="415">The request is not a valid form file, file is missing, or the file is not XML.</response>
        /// <response code="500">Upload failed due to a server error.</response>
        [HttpPost("import-file")]
        [ProducesResponseType<ImportFileResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status415UnsupportedMediaType)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ImportFileResponse>> PostInitialize(IFormFile importFile)
        {
            if (importFile is null || !Path.GetExtension(importFile.FileName.Trim('\"')).InvariantEquals(".xml"))
            {
                return Problem(
                    title: "Invalid File",
                    detail: "The request must contain a valid XML file.",
                    statusCode: StatusCodes.Status415UnsupportedMediaType);
            }

            try
            {
                var fileName = Path.GetRandomFileName();
                await using (var stream = new MemoryStream())
                {
                    await importFile.CopyToAsync(stream);
                    articulateTempFileSystem.AddFile(fileName, stream);
                }

                var count = blogMlImporter.GetPostCount(fileName);
                return Ok(new ImportFileResponse { PostCount = count, TemporaryFileName = fileName });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An unexpected error occurred during file initialization for import.");
                return Problem(
                    title: "Server Error",
                    detail: "An unexpected error occurred. Please check the logs.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Exports blog data as a BlogML XML file.
        /// </summary>
        /// <param name="model">The export options including the Articulate node ID and image export settings.</param>
        /// <response code="200">Returns the BlogML XML file as a downloadable stream.</response>
        /// <response code="500">Export failed due to a server error.</response>
        /// <response code="503">The service is unavailable or the blog node is invalid.</response>
        [HttpPost("export")]
        [Produces("application/octet-stream", Type = typeof(FileContentResult))]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> PostExportBlogMl(ExportModel model)
        {
            const string exportFileName = "BlogMlExport.xml";
            try
            {
                await blogMlExporter.ExportAsync(model.ArticulateBlogNode, exportFileName, model.ExportImagesAsBase64);
                var downloadFileName = $"articulate-export-{DateTime.UtcNow:yyyyMMddHHmmss}.xml";

                var fileStream = articulateTempFileSystem.OpenFile(exportFileName);

                Response.OnCompleted(() =>
                {
                    fileStream.Dispose();
                    articulateTempFileSystem.DeleteFile(exportFileName);
                    return Task.CompletedTask;
                });

                Response.Headers.Append("Content-Disposition", $"attachment; filename*=UTF-8''{downloadFileName}");
                return File(fileStream, "application/octet-stream");
            }
            catch (InvalidOperationException ex)
            {
                logger.LogError(ex,
                    "Export failed due to an invalid operation, likely a missing or invalid blog node.");
                return Problem(title: "Service Unavailable", detail: ex.Message,
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An unexpected error occurred during BlogML export.");
                return Problem(title: "Server Error", detail: "An unexpected error occurred. Please check the logs.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Imports blog data from a previously uploaded BlogML XML file.
        /// </summary>
        /// <param name="model">The import options including the temporary file name, Articulate node ID, and import settings.</param>
        /// <response code="200">Returns import statistics.</response>
        /// <response code="400">The requested Articulate node ID could not be found or is not a valid Articulate node.</response>
        /// <response code="404">The requested temporary file could not be found.</response>
        /// <response code="500">Import failed due to a server error.</response>
        [HttpPost("import")]
        [ProducesResponseType<ImportResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ImportResponse>> PostImportBlogMl(ImportModel model)
        {
            var currentUser = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;

            try
            {
                var result = await blogMlImporter.Import(
                    currentUser!.Id,
                    model.TempFile,
                    model.ArticulateBlogNode,
                    model.Overwrite,
                    model.RegexMatch,
                    model.RegexReplace,
                    model.Publish,
                    model.ExportDisqusXml,
                    model.ImportFirstImage);

                return Ok(result);
            }
            catch (FileNotFoundException ex)
            {
                logger.LogError(ex, "Importing failed because a file was not found.");
                return Problem(title: "File Not Found", detail: ex.Message, statusCode: StatusCodes.Status404NotFound);
            }
            catch (InvalidOperationException ex)
            {
                logger.LogError(ex, "Importing failed due to an invalid operation.");
                return Problem(title: "Bad Request", detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An unexpected error occurred during import.");
                return Problem(title: "Server Error", detail: "An unexpected error occurred. Please check the logs.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }
            finally
            {
                if (articulateTempFileSystem.FileExists(model.TempFile))
                {
                    articulateTempFileSystem.DeleteFile(model.TempFile);
                }
            }
        }

        /// <summary>
        /// Downloads the exported Disqus comment XML file.
        /// </summary>
        /// <response code="200">Returns the Disqus comment XML file as a downloadable stream.</response>
        /// <response code="404">The Disqus XML export file could not be found.</response>
        [HttpGet("export/disqus")]
        [Produces("application/octet-stream", Type = typeof(FileContentResult))]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public IActionResult GetDisqusExport()
        {
            const string disqusExportFile = "DisqusXmlExport.xml";
            if (!articulateTempFileSystem.FileExists(disqusExportFile))
            {
                return Problem(title: "File Not Found", detail: "Disqus comments export file not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var downloadFileName = $"articulate-disqus-comments-{DateTime.UtcNow:yyyyMMddHHmmss}.xml";
            var fileStream = articulateTempFileSystem.OpenFile(disqusExportFile);

            Response.OnCompleted(() =>
            {
                fileStream.Dispose();
                articulateTempFileSystem.DeleteFile(disqusExportFile);
                return Task.CompletedTask;
            });

            Response.Headers.Append("Content-Disposition", $"attachment; filename*=UTF-8''{downloadFileName}");
            return File(fileStream, "application/octet-stream");
        }
    }
}
