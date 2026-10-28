#nullable enable
using Articulate.ImportExport;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Media;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Serialization;

namespace Articulate.Tests.ImportExport
{
    [TestFixture]
    internal class BlogMlExporterTests
    {
        [Test]
        public void GetPostDate_returns_publishedDate_when_set()
        {
            var publishedDate = new DateTime(2014, 3, 21, 0, 56, 0);
            Mock<IContent> post = new();
            post.Setup(x => x.GetValue<DateTime>("publishedDate", null, null, false)).Returns(publishedDate);
            post.SetupGet(x => x.CreateDate).Returns(new DateTime(2023, 11, 2, 15, 50, 9));

            Assert.That(BlogMlExporter.GetPostDate(post.Object), Is.EqualTo(publishedDate));
        }

        [Test]
        public void GetPostDate_falls_back_to_CreateDate_when_publishedDate_is_not_set()
        {
            var createDate = new DateTime(2023, 11, 2, 15, 50, 9);
            Mock<IContent> post = new();
            post.Setup(x => x.GetValue<DateTime>("publishedDate", null, null, false)).Returns(default(DateTime));
            post.SetupGet(x => x.CreateDate).Returns(createDate);

            Assert.That(BlogMlExporter.GetPostDate(post.Object), Is.EqualTo(createDate));
        }

        [Test]
        public void GetRichTextHtml_resolves_links_and_images_to_absolute_urls_without_editor_markup()
        {
            var pageKey = Guid.Parse("e58d2999-c1d5-4197-a59c-3dd4c9192322");
            var imageKey = Guid.Parse("de9a3ae1-7694-425d-abaa-70b1f89b762d");
            const string json = "{\"markup\":\"...\",\"blocks\":null}";
            const string markup =
                "<p><a href=\"/{localLink:e58d2999-c1d5-4197-a59c-3dd4c9192322}\" type=\"document\">Latte</a>" +
                "<img data-udi=\"umb://media/de9a3ae17694425dabaa70b1f89b762d\" rel=\"1234\" src=\"?width=500\" alt=\"Post1\"></p>" +
                "<umb-rte-block data-content-key=\"0a1b2c3d-0000-0000-0000-000000000000\"><!--Umbraco-Block--></umb-rte-block>";

            Mock<IJsonSerializer> jsonSerializer = new();
            jsonSerializer
                .Setup(x => x.Deserialize<RichTextEditorValue>(json))
                .Returns(new RichTextEditorValue { Markup = markup });

            Mock<IPublishedUrlProvider> urlProvider = new();
            urlProvider
                .Setup(x => x.GetUrl(pageKey, UrlMode.Absolute, It.IsAny<string?>(), It.IsAny<Uri?>()))
                .Returns("https://example.com/latte/");
            urlProvider
                .Setup(x => x.GetMediaUrl(imageKey, UrlMode.Absolute, It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<Uri?>()))
                .Returns("https://example.com/media/abc/post1.jpg");

            Mock<IImageUrlTokenGenerator> tokenGenerator = new();
            tokenGenerator.Setup(x => x.RefreshSignature(It.IsAny<string>())).Returns((string url) => url);

            var html = BlogMlExporter.GetRichTextHtml(
                json, jsonSerializer.Object, urlProvider.Object, tokenGenerator.Object, NullLogger.Instance);

            Assert.That(html, Does.Contain("<a href=\"https://example.com/latte/\">Latte</a>"));
            Assert.That(html, Does.Contain("<img src=\"https://example.com/media/abc/post1.jpg?width=500\" alt=\"Post1\">"));
            Assert.That(html, Does.Not.Contain("umb-rte-block"));
        }
    }
}
