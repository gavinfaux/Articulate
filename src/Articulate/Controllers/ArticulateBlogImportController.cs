using System;
using System.IO;
using System.Threading.Tasks;
using Articulate.ImportExport;
using Articulate.Models;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace Articulate.Controllers
{
    // NOTE: ManagementApiControllerBase [ApiController] attribute will automatically validate the model
    // [ApiController] attribute also infers [FromBody] for model binding

    /// <summary>
    /// Provides API endpoints for importing and exporting Articulate blog data using BlogML and Disqus formats.
    /// </summary>
    /// <remarks>
    /// This controller allows initialization, import, and export of blog data, as well as retrieval of Articulate information required for feature.
    /// </remarks>
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/blog")]
    [ApiExplorerSettings(GroupName = ArticulateConstants.ApiGroupName)]
    [MapToApi(ArticulateConstants.ApiName)]
    public class ArticulateBlogImportController(
        BlogMlExporter blogMlExporter,
        BlogMlImporter blogMlImporter,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        ArticulateTempFileSystem articulateTempFileSystem,
        LinkGenerator linkGenerator,
        ILogger<ArticulateBlogImportController> logger,
        IContentTypeService contentTypeService)
        : ManagementApiControllerBase
    {
        /// <summary>
        /// Represents the response model for the BlogML post initialization.
        /// </summary>
        public class PostResponseModel
        {
            /// <summary>
            /// Gets or sets the temporary file name used for the uploaded BlogML file.
            /// </summary>
            /// <example>n4v8p7c1.7gk</example>
            public string TemporaryFileName { get; set; }

            /// <summary>
            /// Gets or sets the number of posts detected in the BlogML file.
            /// </summary>
            /// <example>42</example>
            public int PostCount { get; set; }
        }

        /// <summary>
        /// Represents possible operation statuses for blog import actions.
        /// </summary>
        /// <example>InvalidRequest</example>
        public enum ArticulateBlogImportOperationStatus
        {
            /// <summary>
            /// The request was invalid.
            /// </summary>
            InvalidRequest,
            /// <summary>
            /// The requested resource was not found.
            /// </summary>
            NotFound
        }

        /// <summary>
        /// Begins the BlogML import process by accepting an uploaded XML file, storing it temporarily, and returning a temporary file name along with the detected post count.
        /// This endpoint must be called before performing a blog export using the articulate/blog/import endpoint.
        /// </summary>
        /// <param name="importFile">The file to import, must be an XML file in BlogML format.</param>
        /// <remarks>
        /// The name specified in the form's element or FormData must match the name of the parameter in the controller's action, e.g. <![CDATA[&lt;input type="file" name="importFile"&gt;]]>
        /// </remarks>
        /// <response code="200">Returns the temporary file name and post count.</response>
        /// <response code="415">The request was not a valid form file or the file was not XML.</response>
        [HttpPost("import/begin")]
        [ProducesResponseType<PostResponseModel>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status415UnsupportedMediaType)]
        public IActionResult PostInitialize(IFormFile importFile)
        {
            if (importFile == null || !Path.GetExtension(importFile.FileName.Trim("\"").ToLowerInvariant()).InvariantEquals(".xml"))
            {
                logger.LogWarning("The request was not a valid form file or the file was not XML");
                return OperationStatusResult(ArticulateBlogImportOperationStatus.InvalidRequest, builder => StatusCode(StatusCodes.Status415UnsupportedMediaType, builder.WithTitle("Invalid request").WithDetail("The request was not a valid form file or the file was not XML.").Build()));
            }

            var fileName = Path.GetRandomFileName();
            using (var stream = new MemoryStream())
            {
                Request.Form.Files[0].CopyTo(stream);
                articulateTempFileSystem.AddFile(fileName, stream);
            }

            var count = blogMlImporter.GetPostCount(fileName);

            return Ok(new PostResponseModel
            {
                PostCount = count,
                TemporaryFileName = fileName
            });
        }

        /// <summary>
        /// Exports blog data as a BlogML XML file.
        /// </summary>
        /// <param name="model">The export options including the Articulate node ID and image export settings.</param>
        /// <returns>A file stream containing the BlogML XML file.</returns>
        /// <response code="200">Returns the BlogML XML file as an octet-stream. The filename in the Content-Disposition header will be in the format: articulate-export-yyyyMMddHHmmss.xml.</response>
        [HttpPost("export")]
        [ProducesResponseType(typeof(byte[]), StatusCodes.Status200OK, "application/octet-stream")]
        public async Task<IActionResult> PostExportBlogMl(ExportBlogMlModel model)
        {
            blogMlExporter.Export(model.ArticulateNodeId, model.ExportImagesAsBase64);
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

        /// <summary>
        /// Imports blog data from a previously uploaded BlogML XML file.
        /// This endpoint should be called after initializing the import with the articulate/blog/import/begin endpoint.
        /// </summary>
        /// <param name="model">The import options including the temporary file name, Articulate node ID, and import settings.</param>
        /// <returns>An <see cref="ImportModel"/> containing import statistics and the download URL for the Disqus export, if applicable.</returns>
        /// <response code="200">Returns import statistics and the download URL for the comment export file for upload to Disqus, if applicable.</response>
        /// <response code="400">The requested Articulate node ID could not be found or is not a valid Articulate node.</response>
        /// <response code="404">The requested temporary file could not be found.</response>
        /// <response code="500">Import failed due to a server error.</response>
        [HttpPost("import")]
        [ProducesResponseType<ImportModel>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ImportModel>> PostImportBlogMl(ImportBlogMlModel model)
        {
            if (!articulateTempFileSystem.FileExists(model.TempFile))
            {
                return StatusCode(StatusCodes.Status404NotFound, new ProblemDetails
                {
                    Title = "File Not Found",
                    Detail = $"The temporary file {model.TempFile} could not be found."
                });
            }

            // this should never happen since Authorize attribute is applied to ManagementApi?!
            // also don't add as a ProducesResponseType attribute since Swagger already adds, cos Authorize attribute ;)
            if (backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser == null)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new ProblemDetails
                {
                    Title = "Not Authorized",
                    Detail = "The current user is not authenticated or could not be found."
                });
            }

            ImportModel result;

            try
            {
                result = await blogMlImporter.Import(
                    backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.Id,
                    model.TempFile,
                    model.ArticulateNodeId,
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
                        Detail = "Import failed, see back office logs for details"
                    });
                }

            }
            catch (FileNotFoundException ex)
            {
                logger.LogWarning(ex, "Importing failed with errors");
                return StatusCode(StatusCodes.Status404NotFound, new ProblemDetails
                {
                    Title = "File Not Found",
                    Detail = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarning(ex, "Importing failed with errors");
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
        [HttpGet("export/disqus")]
        [ProducesResponseType(typeof(byte[]), StatusCodes.Status200OK, "application/octet-stream")]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetDisqusExport()
        {
            if (!articulateTempFileSystem.FileExists("DisqusXmlExport.xml"))
            {
                var message = $"Disqus comments export file not found.";
                logger.LogWarning(message);
                return OperationStatusResult(ArticulateBlogImportOperationStatus.NotFound, builder => NotFound(builder.WithTitle(message).Build()));
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

        /// <summary>
        /// Gets the Guid for the Articulate content type.
        /// This endpoint is used to retrieve the Guid for the back office import and export features.
        /// </summary>
        /// <returns>The UDI as a string.</returns>
        /// <response code="200">The Guid as a string, example: ce9e1f75-6428-46b1-8711-84829b9b3d1c</response>
        /// <response code="404">The Articulate archive content type was not found.</response>
        [HttpGet("articulate/guid")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult ArticulateContentTypeGuid()
        {
            var contentType = contentTypeService.Get(ArticulateConstants.ArticulateContentTypeAlias);
            if (contentType == null)
            {
                var message = $"Content type '{ArticulateConstants.ArticulateContentTypeAlias}' not found.";
                logger.LogWarning(message);
                return OperationStatusResult(ArticulateBlogImportOperationStatus.NotFound, builder => NotFound(builder.WithTitle(message).WithDetail("See back office logs for details.").Build()));
            }

            return Ok(contentType.Key.ToString());
        }
    }
}
