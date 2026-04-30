#nullable enable
using System.Net;
using System.Net.Http.Headers;
using Articulate.Options;
using Articulate.Services;
using FileSignatures;
using FileSignatures.Formats;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Microsoft.Extensions.Options;

namespace Articulate.Tests.Services
{
    [TestFixture]
    public class ArticulateImportMediaServiceTests
    {
        private const string OneByOnePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=";

        [Test]
        public async Task ValidateImageAsync_returns_failure_when_extension_is_blocked_by_upload_settings()
        {
            ArticulateImportMediaService sut = CreateSut(new ContentSettings
            {
                AllowedUploadedFileExtensions = new HashSet<string>(),
                DisallowedUploadedFileExtensions = new HashSet<string> { ".png" },
                Imaging = new ContentImagingSettings { ImageFileTypes = new HashSet<string> { "png" } }
            });

            await using MemoryStream stream = new(Convert.FromBase64String(OneByOnePngBase64));

            ImportMediaValidationResult result = await sut.ValidateImageAsync(stream, "png");

            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Is.EqualTo("Extension '.png' is blocked by Umbraco upload settings"));
        }

        [Test]
        public async Task ValidateImageAsync_returns_failure_when_extension_is_not_in_allowed_image_types()
        {
            ArticulateImportMediaService sut = CreateSut(new ContentSettings
            {
                AllowedUploadedFileExtensions = new HashSet<string> { ".webp" },
                DisallowedUploadedFileExtensions = new HashSet<string>(),
                Imaging = new ContentImagingSettings { ImageFileTypes = new HashSet<string> { "png", "jpg" } }
            });

            await using MemoryStream stream = new();

            ImportMediaValidationResult result = await sut.ValidateImageAsync(stream, ".webp");

            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Does.StartWith("Extension '.webp' not allowed."));
        }

        [Test]
        public async Task ValidateImageAsync_returns_failure_when_stream_is_not_seekable()
        {
            ArticulateImportMediaService sut = CreateSut();
            await using NonSeekableReadStream stream = new(Convert.FromBase64String(OneByOnePngBase64));

            ImportMediaValidationResult result = await sut.ValidateImageAsync(stream, ".png");

            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Is.EqualTo("Image stream must be seekable"));
        }

        [Test]
        public async Task DecodeAndValidateBase64ImageAsync_returns_failure_for_empty_content()
        {
            ArticulateImportMediaService sut = CreateSut();

            ImportMediaValidationResult result = await sut.DecodeAndValidateBase64ImageAsync(string.Empty, "image.png");

            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Is.EqualTo("Base64 content is empty"));
        }

        [Test]
        public async Task DecodeAndValidateBase64ImageAsync_returns_failure_for_invalid_base64()
        {
            ArticulateImportMediaService sut = CreateSut();

            ImportMediaValidationResult result = await sut.DecodeAndValidateBase64ImageAsync("not-base64", "image.png");

            Assert.That(result.IsValid, Is.False);
            Assert.That(result.ErrorMessage, Is.EqualTo("Invalid base64 content"));
        }

        [Test]
        public async Task DecodeAndValidateBase64ImageAsync_returns_success_for_valid_png()
        {
            ArticulateImportMediaService sut = CreateSut();

            ImportMediaValidationResult result = await sut.DecodeAndValidateBase64ImageAsync(OneByOnePngBase64, "image.png");

            Assert.That(result.IsValid, Is.True);
            Assert.That(result.CorrectExtension, Is.EqualTo(".png"));
            Assert.That(result.MimeType, Is.EqualTo("image/png"));
            Assert.That(result.ValidatedStream, Is.Not.Null);
            Assert.That(result.ValidatedStream!.CanSeek, Is.True);
            await result.ValidatedStream.DisposeAsync();
        }

        [Test]
        public void CreatePinnedHttpHandler_disables_proxy_routing()
        [Test]
        public void CreatePinnedHttpHandler_disables_proxying()
        {
            using SocketsHttpHandler handler = ArticulateImportMediaService.CreatePinnedHttpHandler();

            Assert.That(handler.UseProxy, Is.False);
        }

        [Test]
        public void CreatePinnedHttpClient_does_not_copy_ambient_default_headers()
        {
            using var templateClient = new HttpClient();
            templateClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "secret");
            templateClient.DefaultRequestHeaders.TryAddWithoutValidation("Cookie", "session=secret");
            templateClient.DefaultRequestHeaders.TryAddWithoutValidation("Proxy-Authorization", "Basic secret");
            templateClient.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "image/*");
            templateClient.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "Articulate-Test");
            templateClient.DefaultRequestHeaders.TryAddWithoutValidation("X-Articulate-Import", "configured");

            using HttpClient client = ArticulateImportMediaService.CreatePinnedHttpClient(templateClient);

            Assert.That(client.DefaultRequestHeaders.Authorization, Is.Null);
            Assert.That(client.DefaultRequestHeaders.Contains("Cookie"), Is.False);
            Assert.That(client.DefaultRequestHeaders.Contains("Proxy-Authorization"), Is.False);
            Assert.That(client.DefaultRequestHeaders.Contains("Accept"), Is.False);
            Assert.That(client.DefaultRequestHeaders.Contains("User-Agent"), Is.False);
            Assert.That(client.DefaultRequestHeaders.Contains("X-Articulate-Import"), Is.False);
        }

        private static ArticulateImportMediaService CreateSut(
            ContentSettings? contentSettings = null,
            ArticulateOptions? articulateOptions = null)
        {
            ContentSettings effectiveContentSettings = contentSettings ?? new ContentSettings
            {
                AllowedUploadedFileExtensions = new HashSet<string> { ".png", ".jpg", ".jpeg" },
                DisallowedUploadedFileExtensions = new HashSet<string>(),
                Imaging = new ContentImagingSettings { ImageFileTypes = new HashSet<string> { "png", "jpg", "jpeg" } }
            };

            Lazy<ICoreScopeProvider> coreScopeProvider = new(Mock.Of<ICoreScopeProvider>);
            Mock<IServiceProvider> serviceProvider = new();
            serviceProvider
                .Setup(x => x.GetService(typeof(Lazy<ICoreScopeProvider>)))
                .Returns(coreScopeProvider);
            StaticServiceProvider.Instance = serviceProvider.Object;

#pragma warning disable CS0618
            MediaFileManager mediaFileManager = new(
                Mock.Of<IFileSystem>(),
                Mock.Of<IMediaPathScheme>(),
                NullLogger<MediaFileManager>.Instance,
                Mock.Of<IShortStringHelper>(),
                serviceProvider.Object);
#pragma warning restore CS0618

            return new ArticulateImportMediaService(
                NullLogger<ArticulateImportMediaService>.Instance,
                Mock.Of<IMediaService>(),
                mediaFileManager,
                Mock.Of<IShortStringHelper>(),
                new MediaUrlGeneratorCollection(() => []),
                Mock.Of<IContentTypeBaseServiceProvider>(),
                Mock.Of<IAbsoluteUrlBuilder>(),
                Mock.Of<IHttpClientFactory>(),
                new FileFormatInspector([new Png(), new Jpeg()]),
                CreateOptionsMonitor(effectiveContentSettings),
                CreateOptionsMonitor(new RuntimeSettings { Mode = RuntimeMode.BackofficeDevelopment }),
                CreateOptionsMonitor(articulateOptions ?? new ArticulateOptions()));
        }

        private static IOptionsMonitor<T> CreateOptionsMonitor<T>(T currentValue)
            where T : class
        {
            Mock<IOptionsMonitor<T>> optionsMonitor = new();
            optionsMonitor.SetupGet(x => x.CurrentValue).Returns(currentValue);
            return optionsMonitor.Object;
        }

        private sealed class NonSeekableReadStream(byte[] bytes) : MemoryStream(bytes)
        {
            public override bool CanSeek => false;
        }
    }
}
