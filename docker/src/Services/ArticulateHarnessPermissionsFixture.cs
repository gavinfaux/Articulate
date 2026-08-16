namespace ArticulateDockerSite.Services
{
    using Articulate;
    using ArticulateDockerSite.Options;
    using Umbraco.Cms.Core;
    using Umbraco.Cms.Core.Actions;
    using Umbraco.Cms.Core.Models;
    using Umbraco.Cms.Core.Models.Membership;
    using Umbraco.Cms.Core.Models.Membership.Permissions;
    using Umbraco.Cms.Core.Security;
    using Umbraco.Cms.Core.Services;
    using Umbraco.Cms.Core.Strings;
    using Umbraco.Cms.Core.Services.OperationStatus;

    /// <summary>Ensures the regular author used by the development permission tests.</summary>
    public sealed class ArticulateHarnessPermissionsFixture(
        IContentService contentService,
        IMediaService mediaService,
        IUserService userService,
        IUserGroupService userGroupService,
        IBackOfficeUserStore userStore,
        ICoreBackOfficeUserManager userManager,
        IShortStringHelper shortStringHelper,
        ILogger<ArticulateHarnessPermissionsFixture> logger)
    {
        private const string ContentSection = "Umb.Section.Content";
        private const string MediaSection = "Umb.Section.Media";
        private const string FixtureGroupDescription = "Scoped Articulate author access for the development site.";
        private const string FixtureAuthorUserName = "JuneDoe";
        private const string FixtureAuthorEmail = "June.Doe@localhost";
        private const string FixtureAuthorName = "June Doe";
        private const string FixtureAuthorPassword = "@rticulate";
        private const string FixtureAuthorGroupAlias = "JuneDoe";
        private const string FixtureAuthorGroupName = "June Doe";
        private const string BlogName = "Blog";
        private const string FixtureArchiveName = "June Doe";
        private const string AuthorsName = "Authors";
        private const string FixturePostName = "Welcome";
        private const string FixturePostBody = "Tea?";

        public async Task EnsureAsync(IUser performingUser)
        {
            IContent blog = contentService.GetRootContent()
                .FirstOrDefault(x => string.Equals(x.Name, BlogName, StringComparison.OrdinalIgnoreCase))
                ?? throw new InvalidOperationException("The scoped author fixture requires a root content node named 'Blog'.");
            IContent? fixtureArchive = contentService.GetPagedDescendants(blog.Id, 0, int.MaxValue, out _)
                .FirstOrDefault(x => x.ContentType.Alias == ArticulateConstants.ContentType.ArticulateArchive &&
                                     string.Equals(x.Name, FixtureArchiveName, StringComparison.OrdinalIgnoreCase));
            if (fixtureArchive is null)
            {
                throw new InvalidOperationException(
                    "The fixture requires the imported fixture archive.");
            }
            IContent authors = contentService.GetPagedDescendants(blog.Id, 0, int.MaxValue, out _)
                .FirstOrDefault(x => string.Equals(x.Name, AuthorsName, StringComparison.OrdinalIgnoreCase))
                ?? throw new InvalidOperationException("The scoped author fixture requires a content node named 'Authors'.");
            IContent author = contentService.GetPagedChildren(authors.Id, 0, int.MaxValue, out _, null, null, null)
                .FirstOrDefault(x => string.Equals(x.Name, FixtureAuthorName, StringComparison.OrdinalIgnoreCase))
                ?? throw new InvalidOperationException($"The fixture requires an author named '{FixtureAuthorName}'.");
            IMedia articulateMedia = mediaService.GetRootMedia()
                .FirstOrDefault(x => string.Equals(
                    x.Name,
                    ArticulateConstants.Convention.ArticulateMediaFolder,
                    StringComparison.OrdinalIgnoreCase))
                ?? throw new InvalidOperationException("The fixture requires the Articulate media folder.");
            IMedia fixtureMedia = mediaService.GetPagedChildren(articulateMedia.Id, 0, int.MaxValue, out _)
                .FirstOrDefault(x => string.Equals(x.Name, FixtureAuthorName, StringComparison.OrdinalIgnoreCase))
                ?? mediaService.CreateMedia(FixtureAuthorName, articulateMedia.Id, Constants.Conventions.MediaTypes.Folder);
            mediaService.Save(fixtureMedia, performingUser.Id);

            IContent markdown = EnsureMarkdownFixture(fixtureArchive, performingUser.Id);
            IUserGroup group = await EnsureGroupAsync(performingUser, blog, fixtureArchive, authors, author, fixtureMedia, markdown);
            IUser user = await EnsureUserAsync(performingUser, group);
            logger.LogInformation("Ensured authorization fixture user '{Email}' and group '{Group}'.", user.Email, group.Name);
        }

        private IContent EnsureMarkdownFixture(IContent fixtureArchive, int userId)
        {
            // Keep the fixture post out of BlogML; this fixture owns it.
            IContent? welcome = contentService.GetPagedChildren(fixtureArchive.Id, 0, int.MaxValue, out _, null, null, null)
                .FirstOrDefault(x => string.Equals(x.Name, FixturePostName, StringComparison.OrdinalIgnoreCase));
            if (welcome is not null && welcome.ContentType.Alias == "ArticulateMarkdown")
            {
                welcome.SetValue("author", FixtureAuthorName);
                contentService.Save(welcome, userId);
                return welcome;
            }

            if (welcome is not null)
            {
                contentService.Delete(welcome, userId);
            }

            IContent markdown = contentService.Create(FixturePostName, fixtureArchive.Id, "ArticulateMarkdown", userId);
            markdown.SetValue("author", FixtureAuthorName);
            markdown.SetValue("markdown", FixturePostBody);
            OperationResult saveResult = contentService.Save(markdown, userId);
            if (!saveResult.Success)
            {
                throw new InvalidOperationException("Could not save Markdown fixture.");
            }

            PublishResult publishResult = contentService.Publish(markdown, ["*"], userId);
            if (!publishResult.Success)
            {
                throw new InvalidOperationException("Could not publish Markdown fixture.");
            }

            return markdown;
        }

        private async Task<IUserGroup> EnsureGroupAsync(
            IUser performingUser,
            IContent blog,
            IContent fixtureArchive,
            IContent authors,
            IContent author,
            IMedia fixtureMedia,
            IContent markdown)
        {
            IUserGroup? existingGroup = await userGroupService.GetAsync(FixtureAuthorGroupAlias);
            if (existingGroup is not null &&
                (existingGroup is not UserGroup existingUserGroup ||
                 !string.Equals(existingUserGroup.Description, FixtureGroupDescription, StringComparison.Ordinal)))
            {
                throw new InvalidOperationException(
                    $"The authorization fixture refuses to modify existing group '{FixtureAuthorGroupAlias}' because it is not fixture-owned.");
            }

            UserGroup group = existingGroup as UserGroup ?? new UserGroup(shortStringHelper)
            {
                Alias = FixtureAuthorGroupAlias,
                Name = FixtureAuthorGroupName,
                Description = FixtureGroupDescription,
                Icon = "icon-users"
            };

            group.Name = FixtureAuthorGroupName;
            group.Description = FixtureGroupDescription;
            group.StartContentId = blog.Id;
            group.StartMediaId = fixtureMedia.Id;
            group.ClearAllowedSections();
            group.AddAllowedSection(ContentSection);
            group.AddAllowedSection(MediaSection);
            group.Permissions.Clear();

            Guid blogKey = blog.Key;
            Guid fixtureArchiveKey = fixtureArchive.Key;
            Guid authorsKey = authors.Key;
            Guid authorKey = author.Key;
            group.GranularPermissions = group.GranularPermissions
                .Where(permission => permission is not DocumentGranularPermission document ||
                                      (document.Key != blogKey && document.Key != fixtureArchiveKey && document.Key != authorsKey && document.Key != authorKey))
                .ToHashSet();
            AddDocumentPermissions(group, blogKey, ActionBrowse.ActionLetter);
            AddDocumentPermissions(group, authorsKey, ActionBrowse.ActionLetter);
            AddDocumentPermissions(
                group,
                fixtureArchiveKey,
                ActionBrowse.ActionLetter,
                ActionNew.ActionLetter,
                ActionNotify.ActionLetter,
                ActionUpdate.ActionLetter,
                ActionCopy.ActionLetter,
                ActionSort.ActionLetter,
                ActionPublish.ActionLetter);
            AddDocumentPermissions(group, authorKey, ActionBrowse.ActionLetter, ActionUpdate.ActionLetter);
            AddDocumentPermissions(group, markdown.Key, ActionBrowse.ActionLetter);

            Attempt<IUserGroup, UserGroupOperationStatus> result = group.Id == 0
                ? await userGroupService.CreateAsync(group, performingUser.Key, [])
                : await userGroupService.UpdateAsync(group, performingUser.Key);
            if (!result.Success)
            {
                throw new InvalidOperationException($"Could not save authorization fixture group '{FixtureAuthorGroupAlias}': {result.Result}");
            }

            return result.Result ?? group;
        }

        private static void AddDocumentPermissions(IUserGroup group, Guid key, params string[] permissions)
        {
            foreach (string permission in permissions)
            {
                group.GranularPermissions.Add(new DocumentGranularPermission { Key = key, Permission = permission });
            }
        }

        private async Task<IUser> EnsureUserAsync(IUser performingUser, IUserGroup group)
        {
            IUser? user = await userStore.GetByEmailAsync(FixtureAuthorEmail);
            bool createdUser = user is null;
            if (createdUser)
            {
                IdentityCreationResult created = await userManager.CreateAsync(new UserCreateModel
                {
                    Email = FixtureAuthorEmail,
                    UserName = FixtureAuthorUserName,
                    Name = FixtureAuthorName,
                    Kind = UserKind.Default,
                    UserGroupKeys = new HashSet<Guid> { group.Key }
                });
                if (!created.Succeded || (user = await userStore.GetByEmailAsync(FixtureAuthorEmail)) is null)
                {
                    throw new InvalidOperationException($"Could not create authorization fixture user '{FixtureAuthorEmail}': {created.ErrorMessage}");
                }
            }

            IUser ensuredUser = user ?? throw new InvalidOperationException($"Could not load authorization fixture user '{FixtureAuthorEmail}'.");
            ensuredUser.Name = FixtureAuthorName;
            ensuredUser.IsApproved = true;
            if (!ensuredUser.Groups.Any(x => x.Key == group.Key))
            {
                ensuredUser.AddGroup(group.ToReadOnlyGroup());
            }

            UserOperationStatus saveStatus = await userStore.SaveAsync(ensuredUser);
            if (saveStatus != UserOperationStatus.Success)
            {
                throw new InvalidOperationException($"Could not save authorization fixture user '{FixtureAuthorEmail}': {saveStatus}");
            }

            if (createdUser)
            {
                Attempt<PasswordChangedModel, UserOperationStatus> password = await userService.ChangePasswordAsync(
                    performingUser.Key,
                    new ChangeUserPasswordModel { UserKey = ensuredUser.Key, NewPassword = FixtureAuthorPassword });
                if (!password.Success)
                {
                    throw new InvalidOperationException($"Could not set authorization fixture password: {password.Result}");
                }
            }

            return ensuredUser;
        }
    }
}
