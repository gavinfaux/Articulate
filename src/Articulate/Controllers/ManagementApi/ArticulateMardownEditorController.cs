using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Articulate.Models.ManagmentApi;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace Articulate.Controllers.ManagementApi
{
    // NOTE: ManagementApiControllerBase [ApiController] attribute will automatically validate the model
    // [ApiController] attribute also infers [FromBody] for model binding

    /// <summary>
    /// Controller for handling the a-new markdown editor endpoint for creating blog posts
    /// </summary>
    [ApiVersion("1.0")]
    [Authorize(AuthorizationPolicies.ContentPermissionByResource)]
    [Authorize(AuthorizationPolicies.MediaPermissionByResource)]
    [MapToApi(ArticulateConstants.ApiName)]
    [VersionedApiBackOfficeRoute("articulate/editors/markdown")]
    [ApiExplorerSettings(GroupName = "Markdown Editor")]
    public class ArticulateMardownEditorController : ManagementApiControllerBase
    {

        private readonly ServiceContext _services;
        private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;
        private readonly UmbracoHelper _umbracoHelper;
        private readonly MediaFileManager _mediaFileManager;
        private readonly PropertyEditorCollection _propertyEditors;
        private readonly IJsonSerializer _jsonSerializer;
        private readonly GlobalSettings _globalSettings;
        private readonly IHostingEnvironment _hostingEnvironment;
        private readonly IMediaService _mediaService;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly Lazy<IMedia> _articulateRootMediaFolder;
        private readonly ILogger<ArticulateMardownEditorController> _logger;

        public ArticulateMardownEditorController(
            ServiceContext services,
            IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
            UmbracoHelper umbracoHelper,
            MediaFileManager mediaFileManager,
            PropertyEditorCollection propertyEditors,
            IJsonSerializer jsonSerializer,
            IOptions<GlobalSettings> globalSettings,
            IHostingEnvironment hostingEnvironment, IMediaService mediaService,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider, IShortStringHelper shortStringHelper,
            ILogger<ArticulateMardownEditorController> logger)
        {
            _services = services;
            _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
            _umbracoHelper = umbracoHelper;
            _mediaFileManager = mediaFileManager;
            _propertyEditors = propertyEditors;
            _jsonSerializer = jsonSerializer;
            _globalSettings = globalSettings.Value;
            _hostingEnvironment = hostingEnvironment;
            _mediaService = mediaService;
            _mediaUrlGenerators = mediaUrlGenerators;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _shortStringHelper = shortStringHelper;
            _logger = logger;
            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
            {
                var root = _mediaService.GetRootMedia().FirstOrDefault(x => x.Name == "Articulate" && x.ContentType.Alias.InvariantEquals(Constants.Conventions.MediaTypes.Folder));
                return root ?? _mediaService.CreateMediaWithIdentity("Articulate", Constants.System.Root, Constants.Conventions.MediaTypes.Folder);
            });
        }

        public class ParseImageResponse
        {
            public string BodyText { get; set; }
            public string FirstImage { get; set; }
        }

        [HttpPost("post")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(CreatePostResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status422UnprocessableEntity)]
        public IActionResult CreatePost(
            [FromForm(Name = "json")] string jsonModel,
            IFormFileCollection files)
        {
            if (string.IsNullOrWhiteSpace(jsonModel))
            {
                return Problem("The 'json' form part is missing or empty.", statusCode: StatusCodes.Status400BadRequest);
            }

            MardownEditorModel model;
            try
            {
                model = JsonSerializer.Deserialize<MardownEditorModel>(jsonModel);
                if (model is null)
                {
                    return Problem("The provided JSON model is invalid.", statusCode: StatusCodes.Status400BadRequest);
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning("JSON deserialization failed: {Message}", ex.Message);
                return Problem($"JSON deserialization failed: {ex.Message}", statusCode: StatusCodes.Status400BadRequest);
            }

            if (model.ArticulateNodeId is null)
            {
                ModelState.AddModelError(nameof(model.ArticulateNodeId), "The ArticulateNodeId field is required.");
                return ValidationProblem(ModelState);
            }

            var articulateNode = _services.ContentService.GetById(model.ArticulateNodeId.Value);
            if (articulateNode == null)
            {
                return Problem($"No Articulate node found with the specified id: {model.ArticulateNodeId.Value}", statusCode: StatusCodes.Status404NotFound);
            }

            var extractFirstImageAsProperty = articulateNode.HasProperty("extractFirstImage")
                                              && articulateNode.GetValue<bool>("extractFirstImage");

            var archive = _services.ContentService.GetPagedChildren(model.ArticulateNodeId.Value, 0, 1, out _)
                .FirstOrDefault(x => x.ContentType.Alias.InvariantEquals(ArticulateConstants.ArticulateArchive));
            if (archive == null)
            {
                return Problem("No Articulate Archive node found for the specified id.", statusCode: StatusCodes.Status404NotFound);
            }

            var requiredPermissions = new[] { ActionNew.ActionLetter, ActionPublish.ActionLetter };
            if (!CheckPermissions(_backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser, archive, requiredPermissions, _services.UserService))
            {
                return Forbid();
            }

            var parsedImageResponse = ParseImages(model.Body, files, extractFirstImageAsProperty);

            model.Body = parsedImageResponse.BodyText;

            var contentType = _services.ContentTypeService.Get("ArticulateMarkdown");
            if (contentType == null)
            {
                var error = "Server configuration error: The 'ArticulateMarkdown' content type was not found.";
                _logger.LogError(error);
                return Problem(error, statusCode: StatusCodes.Status500InternalServerError);
            }

            var content = _services.ContentService.CreateWithInvariantOrDefaultCultureName(
                model.Title,
                archive,
                contentType,
                _services.LocalizationService,
                _backOfficeSecurityAccessor.BackOfficeSecurity.GetUserId().Result);

            content.SetInvariantOrDefaultCultureValue("markdown", model.Body, contentType, _services.LocalizationService);

            if (!string.IsNullOrEmpty(parsedImageResponse.FirstImage))
            {
                content.SetInvariantOrDefaultCultureValue("postImage", parsedImageResponse.FirstImage, contentType, _services.LocalizationService);
            }

            if (model.Excerpt.IsNullOrWhiteSpace() == false)
            {
                content.SetInvariantOrDefaultCultureValue("excerpt", model.Excerpt, contentType, _services.LocalizationService);
            }

            if (model.Tags.IsNullOrWhiteSpace() == false)
            {
                var tags = model.Tags.Split([','], StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim());
                content.AssignInvariantOrDefaultCultureTags("tags", tags, contentType, _services.LocalizationService, _services.DataTypeService, _propertyEditors, _jsonSerializer);
            }

            if (model.Categories.IsNullOrWhiteSpace() == false)
            {
                var cats = model.Categories.Split([','], StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim());
                content.AssignInvariantOrDefaultCultureTags("categories", cats, contentType, _services.LocalizationService, _services.DataTypeService, _propertyEditors, _jsonSerializer);
            }

            if (model.Slug.IsNullOrWhiteSpace() == false)
            {
                content.SetInvariantOrDefaultCultureValue(Constants.Conventions.Content.UrlName, model.Slug, contentType, _services.LocalizationService);
            }

            //author is required
            content.SetInvariantOrDefaultCultureValue("author", _backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.Name ?? "Unknown", contentType, _services.LocalizationService);

            var status = _services.ContentService.Save(content, _backOfficeSecurityAccessor.BackOfficeSecurity.GetUserId().Result);
            if (status.Success == false)
            {
                ModelState.AddModelError("SaveOperation", "Content failed to save. Please check logs for details.");
                return ValidationProblem(ModelState);
            }

            var published = _umbracoHelper.Content(content.Id);
            return Ok(new CreatePostResponse { Url = published?.Url() ?? "#" });
        }

        private ParseImageResponse ParseImages(string body, IFormFileCollection formFiles, bool extractFirstImageAsProperty)
        {

            // this will need to match what server-side code does - e.g. the placeholder or regex
            var bodyTextRegex = new Regex(@"\[i:(\d+)\:(.*?)]", RegexOptions.IgnoreCase | RegexOptions.Compiled);

            var reservedNames = new HashSet<string> { "con", "prn", "aux", "nul", "com1", "lpt1" };

            var firstImage = string.Empty;
            var bodyText = bodyTextRegex.Replace(body, m =>
            {
                var index = m.Groups[1].Value.TryConvertTo<int>();
                if (index)
                {
                    var file = (index.Result < formFiles.Count) ? formFiles[index.Result] : null;
                    if (file == null)
                    {
                        // The referenced image was not included in the upload.
                        _logger.LogWarning("Markdown image placeholder [i:{index}] found, but no corresponding file was uploaded.", index.Result);
                        return m.Value;
                    }

                    var untrustedFileName = Path.GetFullPath(file.FileName);
                    if (untrustedFileName.StartsWith("..") || untrustedFileName.Contains("/.."))
                    {
                        // path traversal attempt
                        return string.Empty;
                    }

                    var filename = Path.GetFileName(file.FileName);
                    var fileExtension = Path.GetExtension(filename).ToLowerInvariant();

                    // TODO: validate mime type / extension OR file signature

                    //strip out any characters that are illegal in filenames
                    var cleanFileName = string.Join("", filename.Split(Path.GetInvalidFileNameChars()));
                    if (cleanFileName.IsNullOrWhiteSpace() || cleanFileName.Length > 100 || reservedNames.Contains(cleanFileName.ToLowerInvariant()))
                    {
                        return string.Empty;
                    }

                    var fileWithExtension = string.Concat(WebUtility.HtmlEncode(cleanFileName), ".", fileExtension);

                    if (extractFirstImageAsProperty && index.Result == 0)
                    {
                        var stream = new MemoryStream();
                        file.CopyTo(stream);
                        if (stream.Length is 0 or > 1024 * 1024 * 10)
                        {
                            return string.Empty;
                        }

                        var mediaItem = _mediaService.CreateMedia(fileWithExtension, _articulateRootMediaFolder.Value, Constants.Conventions.MediaTypes.Image);
                        mediaItem.SetValue(_mediaFileManager, _mediaUrlGenerators, _shortStringHelper, _contentTypeBaseServiceProvider, Constants.Conventions.Media.File, fileWithExtension, stream);
                        _mediaService.Save(mediaItem);
                        var media = _umbracoHelper.Media(mediaItem.Key);
                        if (media == null)
                        {
                            return string.Empty;
                        }

                        var result = $"![{media.Name}]({media.Url()})"; // update bodyText with media item URL
                        if (string.IsNullOrEmpty(firstImage))
                        {
                            firstImage = Udi.Create(Constants.UdiEntityType.Media, media.Key).ToString();

                            //in this case, we've extracted the image, we don't want it to be displayed
                            // in the content too so don't return it.
                            return string.Empty;
                        }

                        return result;
                    }
                    else
                    {
                        var rndId = Guid.NewGuid().ToString("N");

                        using var stream = new MemoryStream();
                        file.CopyTo(stream);

                        var fileUrl = "articulate/" + rndId + "/" + cleanFileName.TrimStart("\"").TrimEnd("\"");
                        _mediaFileManager.FileSystem.AddFile(fileUrl, stream);

                        // UmbracoMediaPath default setting = ~/media
                        // Resolved mediaRootPath = /media
                        var mediaRootPath = _hostingEnvironment.ToAbsolute(_globalSettings.UmbracoMediaPath);
                        var mediaFilePath = $"{mediaRootPath}/{fileUrl}";
                        var result = $"![{mediaFilePath}]({mediaFilePath})";
                        return result;
                    }
                }

                return m.Value;
            });

            return new ParseImageResponse { BodyText = bodyText, FirstImage = firstImage };
        }

        private bool CheckPermissions(IUser user, IContent contentItem, IEnumerable<string> permissionsToCheck, IUserService userService)
        {
            var permissions = user.GetPermissions(contentItem.Path, userService);
            return permissionsToCheck.All(p => permissions.Contains(p));
        }
    }
}
