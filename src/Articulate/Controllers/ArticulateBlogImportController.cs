using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Articulate.ImportExport;
using Articulate.Models;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
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
    /// <summary>
    /// Provides API endpoints for importing and exporting Articulate blog data using BlogML and Disqus formats.
    /// </summary>
    /// <remarks>
    /// This controller allows initialization, import, and export of blog data, as well as retrieval of Articulate information required for feature.
    /// </remarks>
    /// <example>
    /// Use this controller to upload BlogML files, export blog data, or retrieve ArticulateArchive document type UDI.
    /// </example>
    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/blog")]
    [ApiExplorerSettings(GroupName = "Articulate")]
    [MapToApi("articulate-api")]
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
            public string TemporaryFileName { get; set; }

            /// <summary>
            /// Gets or sets the number of posts detected in the BlogML file.
            /// </summary>
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
        /// This endpoint must be called before performing a blog export using `import`.
        /// /// </summary>
        /// <remarks>
        /// The request must be a form upload, and the first file must be an XML file.
        /// </remarks>
        /// <response code="200">Returns the temporary file name and post count.</response>
        /// <response code="415">The request was not a valid form upload or the file was not XML.</response>
        [HttpPost("import/begin")]
        [ProducesResponseType<PostResponseModel>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status415UnsupportedMediaType)]
        public IActionResult PostInitialize()
        {
            if ((!Request.HasFormContentType && !Request.Form.Files.Any()) || !Path.GetExtension(Request.Form.Files[0].FileName.Trim('\"')).InvariantEquals(".xml"))
            {
                logger.LogWarning("Not a form post, no files provided; or first file was not an XML file");
                return OperationStatusResult(ArticulateBlogImportOperationStatus.InvalidRequest, builder => StatusCode(StatusCodes.Status415UnsupportedMediaType, builder.WithTitle("Invalid request").WithDetail("The request must be a form upload, and the first file must be an XML file.").Build()));
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
        /// This endpoint must be called to generate the export before downloading it using the download endpoint.
        /// </summary>
        /// <param name="model">The export options including the Articulate node ID and image export settings.</param>
        /// <returns>An <see cref="ImportModel"/> containing the download URL for the exported file.</returns>
        /// <response code="200">Returns the download URL for the exported BlogML file.</response>
        [HttpPost("export")]
        [ProducesResponseType<ImportModel>(StatusCodes.Status200OK)]
        public IActionResult PostExportBlogMl([FromBody, BindRequired] ExportBlogMlModel model)
        {
            blogMlExporter.Export(model.ArticulateNodeId, model.ExportImagesAsBase64);
            var downloadUrl = linkGenerator.GetPathByAction(
                action: nameof(GetBlogMlExport),
                controller: "ArticulateBlogImport",
                values: null,
                httpContext: HttpContext
            );
            return Ok(new ImportModel
            {
                DownloadUrl = downloadUrl ?? string.Empty
            });
        }

        /// <summary>
        /// Downloads the exported BlogML XML file.
        /// The export endpoint must be called first to generate the file before downloading.
        /// </summary>
        /// <returns>The exported BlogML file as a stream.</returns>
        /// <response code="200">Returns the BlogML XML file.</response>
        [HttpGet("download")]
        [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK, "application/xml")]
        public IActionResult GetBlogMlExport()
        {
            var fileStream = articulateTempFileSystem.OpenFile("BlogMlExport.xml");
            return Ok(File(fileStream, "application/octet-stream", "BlogMlExport.xml"));
        }

        /// <summary>
        /// Imports blog data from a previously uploaded BlogML XML file.
        /// This endpoint should be called after initializing the import with `import/begin`.
        /// </summary>
        /// <param name="model">The import options including the temporary file name, Articulate node ID, and import settings.</param>
        /// <returns>An <see cref="ImportModel"/> containing the download URL for the Disqus export, if applicable.</returns>
        /// <response code="200">Returns the download URL for the Disqus export file.</response>
        /// <response code="500">Import failed due to a server error.</response>
        [HttpPost("import")]
        [ProducesResponseType<ImportModel>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ImportModel>> PostImportBlogMl([FromBody, BindRequired] ImportBlogMlModel model)
        {
            // ManagementApiControllerBase [ApiController] attribute will automatically validate the model

            var successful = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser != null && await blogMlImporter.Import(
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

            if (!successful)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Server error",
                    Detail = "Import failed, see back office logs for details"
                });
            }

            var downloadUrl = linkGenerator.GetPathByAction(
                action: nameof(GetDisqusExport),
                controller: "ArticulateBlogImport",
                values: null,
                httpContext: HttpContext
            );
            return Ok(Task.FromResult(new ImportModel { DownloadUrl = downloadUrl ?? string.Empty }));
        }

        /// <summary>
        /// Downloads the exported Disqus XML file.
        /// </summary>
        /// <returns>The exported Disqus XML file as a stream.</returns>
        /// <response code="200">Returns the Disqus XML file.</response>
        [HttpGet("export/disqus")]
        [ProducesResponseType<FileStreamResult>(StatusCodes.Status200OK)]
        public IActionResult GetDisqusExport()
        {
            var fileStream = articulateTempFileSystem.OpenFile("DisqusXmlExport.xml");
            return Ok(File(fileStream, "application/octet-stream", "DisqusXmlExport.xml"));
        }

        /// <summary>
        /// Gets the UDI (Unique Document Identifier) for the Articulate Archive content type.
        /// This endpoint is used to retrieve the UDI for the back office import and export features.
        /// </summary>
        /// <returns>The UDI as a string.</returns>
        /// <response code="200">Returns the UDI string.</response>
        /// <response code="404">The Articulate archive content type was not found.</response>
        [HttpGet("archive/udi")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult ArticulateArchiveUdi()
        {
            var contentType = contentTypeService.Get(ArticulateConstants.ArticulateArchiveContentTypeAlias);
            if (contentType == null)
            {
                var message = $"Content type '{ArticulateConstants.ArticulateArchiveContentTypeAlias}' not found.";
                logger.LogWarning(message);
                return OperationStatusResult(ArticulateBlogImportOperationStatus.NotFound, builder => NotFound(builder.WithTitle(message).WithDetail("See back office logs for details.").Build()));
            }

            return Ok(contentType.GetUdi().ToString());
        }
    }
}
