#nullable enable
using Articulate.Controllers.Api;
using Articulate.Models.Api;
using Articulate.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using static Articulate.Tests.ImportExport.BlogMlImportFixture;

namespace Articulate.Tests.ImportExport;

[TestFixture]
public class BlogMlImportErrorTests
{
    [TestCase(true)]
    [TestCase(false)]
    public async Task Import_endpoint_shows_only_controlled_archive_error_details(bool deliberateArchiveError)
    {
        using var fixture = new BlogMlImportFixture();
        var sourceKey = Guid.NewGuid();
        fixture.WritePosts(Post("p1", archiveKey: sourceKey, archiveName: "News"));
        fixture.EntityService.Setup(x => x.Exists(sourceKey)).Returns(true);
        if (!deliberateArchiveError)
        {
            fixture.ContentService.Setup(x => x.GetById(fixture.Root.Key)).Throws(new InvalidOperationException("private database information"));
        }

        var security = new Mock<IBackOfficeSecurityAccessor>();
        security.Setup(x => x.BackOfficeSecurity!.CurrentUser).Returns(Mock.Of<IUser>(x => x.Id == 7));
        var controller = new BlogMlApiController(
            null!,
            fixture.Importer,
            security.Object,
            fixture.TempFiles,
            Mock.Of<IOptionsMonitor<ArticulateOptions>>(),
            Mock.Of<IOptionsMonitor<RuntimeSettings>>(),
            NullLogger<BlogMlApiController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        IActionResult response = await controller.PostImportBlogMl(new ImportModel { ArticulateBlogNode = fixture.Root.Key, TempFile = "import.xml" });
        Assert.That(response, Is.TypeOf<ObjectResult>());
        var result = (ObjectResult)response;
        Assert.That(result.StatusCode, Is.EqualTo(400));
        Assert.That(result.Value, Is.TypeOf<ProblemDetails>());
        var problem = (ProblemDetails)result.Value!;
        Assert.That(problem.Detail, Does.Not.Contain("private database information"));
        Assert.That(problem.Detail, deliberateArchiveError
            ? Does.Contain("archive key").And.Contain("selected blog")
            : Is.EqualTo("The BlogML import request was invalid or the selected Articulate node could not be used."));
        Assert.That(fixture.TempFiles.FileExists("import.xml"), Is.False);
    }
}
