using System;
using Articulate.Models;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Articulate.ImportExport;
using Umbraco.Extensions;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Api.Management.Controllers;

namespace Articulate.Controllers
{
    [ApiController]
    [Route("/umbraco/api/articulate/import")]
    public class ArticulateBlogImportController : ManagementApiControllerBase
    {
        private readonly BlogMlImporter _blogMlImporter;
        private readonly UmbracoApiControllerTypeCollection _umbracoApiControllerTypeCollection;
        private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;
        private readonly ArticulateTempFileSystem _articulateTempFileSystem;
        private readonly IHostEnvironment _hostingEnvironment;
        private readonly BlogMlExporter _blogMlExporter;

        public ArticulateBlogImportController(
            IHostEnvironment hostingEnvironment,
            BlogMlExporter blogMlExporter,
            BlogMlImporter blogMlImporter,
            UmbracoApiControllerTypeCollection umbracoApiControllerTypeCollection,
            IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
            ArticulateTempFileSystem articulateTempFileSystem)
        {
            _blogMlImporter = blogMlImporter;
            _umbracoApiControllerTypeCollection = umbracoApiControllerTypeCollection;
            _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
            _articulateTempFileSystem = articulateTempFileSystem;
            _hostingEnvironment = hostingEnvironment;
            _blogMlExporter = blogMlExporter;
        }

        [HttpPost]
        [DisableRequestSizeLimit]
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

        [HttpPost("PostExportBlogMl")]
        public ImportModel PostExportBlogMl(ExportBlogMlModel model)
        {
            _blogMlExporter.Export(model.ArticulateNodeId, model.ExportImagesAsBase64);

            return new ImportModel
            {
//                DownloadUrl = Url.GetUmbracoApiService<ArticulateBlogImportController>(_umbracoApiControllerTypeCollection, "GetBlogMlExport")
                DownloadUrl = string.Empty
            };
        }

        [HttpGet("GetBlogMlExport")]
        public IActionResult GetBlogMlExport()
        {
            var fileStream = _articulateTempFileSystem.OpenFile("BlogMlExport.xml");
            return File(fileStream, "application/octet-stream", "BlogMlExport.xml");
        }

        [HttpPost("PostImportBlogMl")]
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

            return new ImportModel
            {
                //DownloadUrl = Url.GetUmbracoApiService<ArticulateBlogImportController>(_umbracoApiControllerTypeCollection, "GetDisqusExport")
                 DownloadUrl = string.Empty
            };
        }

        [HttpGet("GetDisqusExport")]
        public IActionResult GetDisqusExport()
        {
            //save to Temp folder (base path)
            var fileStream = _articulateTempFileSystem.OpenFile("DisqusXmlExport.xml");
            return File(fileStream, "application/octet-stream", "DisqusXmlExport.xml");
        }
    }
}
