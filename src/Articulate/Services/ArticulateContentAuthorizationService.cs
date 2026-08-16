#nullable enable
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.AuthorizationStatus;

namespace Articulate.Services;

/// <summary>
/// Validates Articulate content scope and applies the shared Umbraco permission checks.
/// </summary>
public sealed class ArticulateContentAuthorizationService(
    IContentPermissionService contentPermissionService,
    IMediaPermissionService mediaPermissionService)
{
    private static readonly string[] AllowedPostAliases =
    [
        ArticulateConstants.ContentType.ArticulateRichText,
        ArticulateConstants.ContentType.ArticulateMarkdown,
        ArticulateConstants.ContentType.ArticulatePost
    ];

    public bool IsArticulateRoot(IContent content) =>
        content.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate);

    public bool IsAllowedPost(IContent content) =>
        AllowedPostAliases.Any(alias => content.ContentType.Alias.InvariantEquals(alias));

    public bool IsBlogMlPost(IContent content) =>
        content.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateRichText)
        || content.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateMarkdown);

    public bool IsArchive(IContent content) =>
        content.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive);

    public bool IsDescendantOf(IContent content, IContent ancestor)
    {
        string ancestorId = ancestor.Id.ToString(System.Globalization.CultureInfo.InvariantCulture);
        return content.Path.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Contains(ancestorId, StringComparer.Ordinal);
    }

    public IContent? FindArchive(IEnumerable<IContent> children) =>
        children.FirstOrDefault(x => x.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive));

    public IEnumerable<IContent> FindArchives(IEnumerable<IContent> descendants) =>
        descendants.Where(x => x.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive));

    public async Task EnsureContentAccessAsync(
        IUser user,
        IEnumerable<IContent> content,
        IEnumerable<string> permissions)
    {
        Guid[] keys = content.Select(x => x.Key).Distinct().ToArray();
#pragma warning disable IDE0007, IDE0008
        HashSet<string> required = permissions.ToHashSet(StringComparer.Ordinal);
#pragma warning restore IDE0007, IDE0008
        if (keys.Length == 0 || required.Count == 0)
        {
            return;
        }

#pragma warning disable IDE0007, IDE0008
        ContentAuthorizationStatus status = keys.Length == 1 && required.Count == 1
            ? await contentPermissionService.AuthorizeAccessAsync(user, keys[0], required.First())
            : await contentPermissionService.AuthorizeAccessAsync(user, keys, required);
#pragma warning restore IDE0007, IDE0008
        if (status != ContentAuthorizationStatus.Success)
        {
            throw new UnauthorizedAccessException("The requested Articulate content is not available");
        }
    }

    public Task EnsureContentAccessAsync(IUser user, IContent content, params string[] permissions) =>
        EnsureContentAccessAsync(user, [content], permissions);

    public Task<ISet<Guid>> FilterAuthorizedPostsAsync(IUser user, IEnumerable<IContent> posts) =>
        contentPermissionService.FilterAuthorizedAccessAsync(
            user,
            posts.Select(x => x.Key),
            new HashSet<string> { ActionBrowse.ActionLetter });

    public async Task EnsureMediaWriteAccessAsync(IUser user)
    {
        MediaAuthorizationStatus rootStatus = await mediaPermissionService.AuthorizeRootAccessAsync(user);
        MediaAuthorizationStatus binStatus = await mediaPermissionService.AuthorizeBinAccessAsync(user);
        if (rootStatus != MediaAuthorizationStatus.Success || binStatus != MediaAuthorizationStatus.Success)
        {
            throw new UnauthorizedAccessException("The requested media operation is not available");
        }
    }

    public async Task EnsureMediaWriteAccessAsync(IUser user, Guid mediaKey)
    {
        MediaAuthorizationStatus status = await mediaPermissionService.AuthorizeAccessAsync(user, mediaKey);
        if (status != MediaAuthorizationStatus.Success)
        {
            throw new UnauthorizedAccessException("The requested media operation is not available");
        }
    }

    public async Task EnsureMediaReadAccessAsync(IUser user, IEnumerable<Guid> mediaKeys)
    {
        Guid[] keys = mediaKeys.Distinct().ToArray();
        if (keys.Length == 0)
        {
            return;
        }

        MediaAuthorizationStatus status = await mediaPermissionService.AuthorizeAccessAsync(user, keys);
        if (status != MediaAuthorizationStatus.Success)
        {
            throw new UnauthorizedAccessException("The requested media operation is not available");
        }
    }
}
