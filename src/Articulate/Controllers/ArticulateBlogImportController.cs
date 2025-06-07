using System.Net;
using Articulate.ImportExport;
using Articulate.Models;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace Articulate.Controllers
{

    [ApiVersion("1.0")]
    [Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [VersionedApiBackOfficeRoute("articulate/blog")]
    [ApiExplorerSettings(GroupName = "Articulate")]
    public class ArticulateBlogImportController : ManagementApiControllerBase
    {

        public enum ArticulateBlogImportOperationStatus
        {
            InvalidRequest
        }

        private readonly BlogMlImporter _blogMlImporter;
        private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;
        private readonly ArticulateTempFileSystem _articulateTempFileSystem;
        private readonly BlogMlExporter _blogMlExporter;
        private readonly LinkGenerator _linkGenerator;
        private readonly ILogger<ArticulateBlogImportController> _logger;

        [Obsolete]
        public ArticulateBlogImportController(BlogMlExporter blogMlExporter,
            BlogMlImporter blogMlImporter,
            IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
            ArticulateTempFileSystem articulateTempFileSystem,
            LinkGenerator linkGenerator)
        {
            _blogMlImporter = blogMlImporter;
            _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
            _articulateTempFileSystem = articulateTempFileSystem;
            _blogMlExporter = blogMlExporter;
            _linkGenerator = linkGenerator;
        }

        [HttpPost("post/init")]
        [ProducesResponseType<PostResponseModel>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status415UnsupportedMediaType)]
        public IActionResult PostInitialize()
        {
            if ((!Request.HasFormContentType && !Request.Form.Files.Any()) || !Path.GetExtension(Request.Form.Files[0].FileName.Trim('\"')).InvariantEquals(".xml"))
            {
                _logger.LogWarning("Not a form post, no files provided; or first file was not an XML file");
                return OperationStatusResult(ArticulateBlogImportOperationStatus.InvalidRequest, builder => StatusCode(StatusCodes.Status415UnsupportedMediaType, builder.WithTitle("Invalid request").WithDetail("The request must be a form upload, and the first file must be an XML file.").Build()));
            }

            var fileName = Path.GetRandomFileName();
            using (var stream = new MemoryStream())
            {
                Request.Form.Files[0].CopyTo(stream);
                _articulateTempFileSystem.AddFile(fileName, stream);
            }

            var count = _blogMlImporter.GetPostCount(fileName);

            return Ok(new PostResponseModel
            {
                PostCount = count,
                TemporaryFileName = fileName
            }
            );
        }

        [HttpPost("post/export")]
        [ProducesResponseType<ImportModel>(StatusCodes.Status200OK)]
        public IActionResult PostExportBlogMl(ExportBlogMlModel model)
        {
            _blogMlExporter.Export(model.ArticulateNodeId, model.ExportImagesAsBase64);
            var downloadUrl = _linkGenerator.GetPathByAction(
                action: nameof(GetBlogMlExport),
                controller: "ArticulateBlogImport", // Controller name without "Controller" suffix
                values: null, // or route values if needed
                httpContext: HttpContext // optional, for absolute URLs use GetUriByAction
            );
            return Ok(new ImportModel
            {
                DownloadUrl = downloadUrl ?? string.Empty
            });
        }

        [HttpGet("export")]
        [ProducesResponseType<FileResult>(StatusCodes.Status200OK)]
        public IActionResult GetBlogMlExport()
        {
            var fileStream = _articulateTempFileSystem.OpenFile("BlogMlExport.xml");
            return Ok(File(fileStream, "application/octet-stream", "BlogMlExport.xml"));
        }

        [HttpPost("post/import")]
        [ProducesResponseType<ImportModel>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ImportModel>> PostImportBlogMl(ImportBlogMlModel model)
        {
            // ManagementApiControllerBase [ApiController] attribute will automatically validate the model

            //there should only be one file so we'll just use the first one

            var successful = _backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser != null && await _blogMlImporter.Import(
                _backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.Id,
                model.TempFile,
                model.ArticulateNodeId,
                model.Overwrite,
                model.RegexMatch,
                model.RegexReplace,
                model.Publish,
                model.ExportDisqusXml,
                model.ImportFirstImage);

            //cleanup
            _articulateTempFileSystem.DeleteFile(model.TempFile);

            if (!successful)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Server error",
                    Detail = "Import failed, see back office logs for details"
                });
            }

            var downloadUrl = _linkGenerator.GetPathByAction(
                action: nameof(GetDisqusExport),
                controller: "ArticulateBlogImport", // Controller name without "Controller" suffix
                values: null, // or route values if needed
                httpContext: HttpContext // optional, for absolute URLs use GetUriByAction
            );
            return Ok(Task.FromResult(new ImportModel { DownloadUrl = downloadUrl ?? string.Empty }));
        }

        [HttpGet("export/disqus")]
        [ProducesResponseType<FileStreamResult>(StatusCodes.Status200OK)]
        public IActionResult GetDisqusExport()
        {
            //save to Temp folder (base path)
            var fileStream = _articulateTempFileSystem.OpenFile("DisqusXmlExport.xml");
            return Ok(File(fileStream, "application/octet-stream", "DisqusXmlExport.xml"));
        }
    }
}
