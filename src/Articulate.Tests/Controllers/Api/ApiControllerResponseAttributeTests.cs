#nullable enable
using System.Reflection;
using Articulate.Controllers.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;

namespace Articulate.Tests.Controllers.Api
{
    [TestFixture]
    public class ApiControllerResponseAttributeTests
    {
        [Test]
        public void BlogMl_post_initialize_declares_bad_request_response_for_empty_upload()
        {
            MethodInfo method = typeof(BlogMlApiController).GetMethod(nameof(BlogMlApiController.PostInitialize))!;

            bool hasBadRequestResponse = method.GetCustomAttributes<ProducesResponseTypeAttribute>()
                .Any(attribute => attribute.StatusCode == StatusCodes.Status400BadRequest);

            Assert.That(hasBadRequestResponse, Is.True);
        }

        [Test]
        public void Markdown_editor_create_post_declares_internal_server_error_response()
        {
            MethodInfo method = typeof(MarkdownEditorApiController).GetMethod(nameof(MarkdownEditorApiController.CreatePost))!;

            bool hasServerErrorResponse = method.GetCustomAttributes<ProducesResponseTypeAttribute>()
                .Any(attribute => attribute.StatusCode == StatusCodes.Status500InternalServerError);

            Assert.That(hasServerErrorResponse, Is.True);
        }

    }
}
