#nullable enable
using Articulate.Api.Management.Attributes;
using Articulate.Api.Management.Extensions;
using Articulate.Api.Management.Models;
using Articulate.ImportExport;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Authorization;

namespace Articulate.Api.Management.Controllers
{
    /// <summary>
    /// Provides import and export of Articulate blog data using BlogML and Disqus formats.
    /// </summary>
    [ManagementApi(Constants.ManagementApi.BlogMl)]
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [ManagementApiRoute("blogml")]
    [MapToApi(Constants.ManagementApi.Name)]
    public class BlogMlApiController(
        BlogMlExporter blogMlExporter,
        BlogMlImporter blogMlImporter,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        ArticulateTempFileSystem articulateTempFileSystem,
        ILogger<BlogMlApiController> logger,
        IOptionsMonitor<RuntimeSettings> runtimeSettings)
        : ManagementApiControllerBase
    {
        private const long DefaultMaxImportFileBytes = 50 * 1024 * 1024; // 50 MB safety fallback

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
        public async Task<IActionResult> PostInitialize(IFormFile? importFile)
        {
            if (importFile is null)
            {
                return Problem(
                    title: "Invalid File",
                    detail: "The request must include a BlogML XML file.",
                    statusCode: StatusCodes.Status415UnsupportedMediaType);
            }

            if (!Path.GetExtension(importFile.FileName.Trim('\"')).InvariantEquals(".xml"))
            {
                return Problem(
                    title: "Invalid File",
                    detail: "Only BlogML .xml files are accepted.",
                    statusCode: StatusCodes.Status415UnsupportedMediaType);
            }

            long maxImportFileBytes = GetMaxImportFileBytes();

            if (importFile.Length <= 0)
            {
                return Problem(
                    title: "File Size Invalid",
                    detail: "The uploaded file is empty or invalid.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            if (importFile.Length > maxImportFileBytes)
            {
                return Problem(
                    title: "File Too Large",
                    detail: $"BlogML imports must be between 1 byte and {maxImportFileBytes / (1024d * 1024d):F1} MB.",
                    statusCode: StatusCodes.Status413PayloadTooLarge);
            }
            try
            {
                var fileName = Path.GetRandomFileName();
                await using Stream sourceStream = importFile.OpenReadStream();
                using var buffer = new MemoryStream(capacity: (int)Math.Min(importFile.Length, Math.Min(maxImportFileBytes, int.MaxValue)));
                await sourceStream.CopyWithLimitAsync(buffer, maxImportFileBytes, HttpContext.RequestAborted).ConfigureAwait(false);
                buffer.Position = 0;
                articulateTempFileSystem.AddFile(fileName, buffer);

                var count = blogMlImporter.GetPostCount(fileName);
                return Ok(new ImportFileResponse { PostCount = count, TemporaryFileName = fileName });
            }
            catch (InvalidDataException)
            {
                return Problem(
                    title: "File Too Large",
                    detail: $"BlogML imports must not exceed {maxImportFileBytes / (1024d * 1024d):F1} MB.",
                    statusCode: StatusCodes.Status413PayloadTooLarge);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An unexpected error occurred during file initialization for import.");
                return StatusCode(StatusCodes.Status500InternalServerError, $"An unexpected error occurred during file initialization for import: {ex.Message}");
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
                await blogMlExporter.ExportAsync(model.ArticulateBlogNode, exportFileName, model.ExportImagesAsBase64)
                    .ConfigureAwait(false);
                var downloadFileName = $"articulate-export-{DateTime.UtcNow:yyyyMMddHHmmss}.xml";

                Stream fileStream = articulateTempFileSystem.OpenFile(exportFileName);

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
                logger.LogError(ex, "Export failed due to an invalid operation, likely a missing or invalid blog node.");
                return Problem(title: "Service Unavailable", detail: ex.Message, statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An unexpected error occurred during BlogML export.");
                return StatusCode(StatusCodes.Status500InternalServerError, $"An unexpected error occurred during BlogML export: {ex.Message}");
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
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> PostImportBlogMl(ImportModel model)
        {
            IUser? currentUser = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;
            if (currentUser is null)
            {
                return Problem(title: "Unauthorized", detail: "Could not determine the current user.", statusCode: StatusCodes.Status401Unauthorized);
            }

            try
            {
                ImportResponseDto dto = await blogMlImporter.ImportAsync(
                    currentUser.Id,
                    model.TempFile,
                    model.ArticulateBlogNode,
                    model.Overwrite,
                    model.RegexMatch,
                    model.RegexReplace,
                    model.Publish,
                    model.ExportDisqusXml,
                    model.ImportFirstImage).ConfigureAwait(false);

                var result = new ImportResponse(dto);

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
                logger.LogError(ex, "Importing failed due to an unexpected error.");
                return StatusCode(StatusCodes.Status500InternalServerError, $"An unexpected error occurred during import: {ex.Message}");
            }
            finally
            {
                if (!string.IsNullOrEmpty(model.TempFile) && articulateTempFileSystem.FileExists(model.TempFile))
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
                return Problem(title: "File Not Found", detail: "Disqus comments export file not found.", statusCode: StatusCodes.Status404NotFound);
            }

            var downloadFileName = $"articulate-disqus-comments-{DateTime.UtcNow:yyyyMMddHHmmss}.xml";
            Stream fileStream = articulateTempFileSystem.OpenFile(disqusExportFile);

            Response.OnCompleted(() =>
            {
                fileStream.Dispose();
                articulateTempFileSystem.DeleteFile(disqusExportFile);
                return Task.CompletedTask;
            });

            Response.Headers.Append("Content-Disposition", $"attachment; filename*=UTF-8''{downloadFileName}");
            return File(fileStream, "application/octet-stream");
        }

        private long GetMaxImportFileBytes()
        {
            long? maxRequestLengthKb = runtimeSettings.CurrentValue.MaxRequestLength;
            if (maxRequestLengthKb is null or <= 0)
            {
                return DefaultMaxImportFileBytes;
            }

            try
            {
                checked
                {
                    return maxRequestLengthKb.Value * 1024L;
                }
            }
            catch (OverflowException)
            {
                return DefaultMaxImportFileBytes;
            }
        }
    }
}
