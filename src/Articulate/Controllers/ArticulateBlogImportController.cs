using System.Net;
using Articulate.ImportExport;
using Articulate.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Api.Common.ViewModels.Pagination;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Security;
using Umbraco.Extensions;
using static Umbraco.Cms.Core.Constants;

namespace Articulate.Controllers
{
    [VersionedApiBackOfficeRoute("articulate/blogml")]
    [ApiExplorerSettings(GroupName = "Articulate API")]
    public class ArticulateBlogImportController : ManagementApiControllerBase
    {
        private readonly BlogMlImporter _blogMlImporter;
        private readonly UmbracoApiControllerTypeCollection _umbracoApiControllerTypeCollection;
        private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;
        private readonly ArticulateTempFileSystem _articulateTempFileSystem;
        private readonly IHostEnvironment _hostingEnvironment;
        private readonly BlogMlExporter _blogMlExporter;
        private readonly LinkGenerator _linkGenerator;

        public ArticulateBlogImportController(
            IHostEnvironment hostingEnvironment,
            BlogMlExporter blogMlExporter,
            BlogMlImporter blogMlImporter,
            UmbracoApiControllerTypeCollection umbracoApiControllerTypeCollection,
            IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
            ArticulateTempFileSystem articulateTempFileSystem,
            LinkGenerator linkGenerator)
        {
            _blogMlImporter = blogMlImporter;
            _umbracoApiControllerTypeCollection = umbracoApiControllerTypeCollection;
            _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
            _articulateTempFileSystem = articulateTempFileSystem;
            _hostingEnvironment = hostingEnvironment;
            _blogMlExporter = blogMlExporter;
            _linkGenerator = linkGenerator;
        }

        [DisableRequestSizeLimit]
        [HttpPost]
        public ActionResult PostInitialize()
        {
            if (!Request.HasFormContentType && !Request.Form.Files.Any())
            {
                return StatusCode((int)HttpStatusCode.UnsupportedMediaType);
            }

            if (!Path.GetExtension(Request.Form.Files[0].FileName.Trim('\"')).InvariantEquals(".xml"))
            {
                return StatusCode((int)HttpStatusCode.UnsupportedMediaType);
            }

            var fileName = Path.GetRandomFileName();
            using (var stream = new MemoryStream())
            {                
                Request.Form.Files[0].CopyTo(stream);
                _articulateTempFileSystem.AddFile(fileName, stream);
            }

            var count = _blogMlImporter.GetPostCount(fileName);

            return this.Ok(new
            {
                count = count,
                tempFile = fileName
            });
        }

        public ImportModel PostExportBlogMl(ExportBlogMlModel model)
        {
            _blogMlExporter.Export(model.ArticulateNodeId, model.ExportImagesAsBase64);
            var downloadUrl = _linkGenerator.GetPathByAction(
                action: nameof(GetBlogMlExport),
                controller: "ArticulateBlogImport", // Controller name without "Controller" suffix
                values: null, // or route values if needed
                httpContext: this.HttpContext // optional, for absolute URLs use GetUriByAction
            );
            return new ImportModel
            {
                DownloadUrl = downloadUrl
            };
        }

        [HttpGet]
        public IActionResult GetBlogMlExport()
        {
            var fileStream = _articulateTempFileSystem.OpenFile("BlogMlExport.xml");
            return File(fileStream, "application/octet-stream", "BlogMlExport.xml");
        }

        [HttpPost]
        public async Task<ActionResult<ImportModel>> PostImportBlogMl(ImportBlogMlModel model)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            //there should only be one file so we'll just use the first one

            var successful = await _blogMlImporter.Import(
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
                return Problem("Importing failed, see umbraco log for details");
            }

            var downloadUrl = _linkGenerator.GetPathByAction(
                action: nameof(GetDisqusExport),
                controller: "ArticulateBlogImport", // Controller name without "Controller" suffix
                values: null, // or route values if needed
                httpContext: this.HttpContext // optional, for absolute URLs use GetUriByAction
            );
            return new ImportModel
            {
                DownloadUrl = downloadUrl
            };
        }

        [HttpGet]
        public IActionResult GetDisqusExport()
        {
            //save to Temp folder (base path)
            var fileStream = _articulateTempFileSystem.OpenFile("DisqusXmlExport.xml");
            return File(fileStream, "application/octet-stream", "DisqusXmlExport.xml");
        }
    }
}
