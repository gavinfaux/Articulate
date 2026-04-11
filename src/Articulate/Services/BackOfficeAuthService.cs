#nullable enable
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace Articulate.Services
{
    /// <summary>
    /// Service for checking back-office authentication and permissions.
    /// </summary>
    public sealed class BackOfficeAuthService(
        IOptionsMonitor<CookieAuthenticationOptions> options,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        IUserService userService,
        ILogger<BackOfficeAuthService> logger)
    {
        /// <summary>
        /// Checks if a back-office user is logged in.
        /// </summary>
        /// <param name="context">The HTTP context.</param>
        /// <param name="authenticationType">The authentication type to check.</param>
        /// <returns>True if the user is logged in; otherwise, false.</returns>
        public bool IsBackOfficeLoggedIn(HttpContext context, string authenticationType)
        {
            CookieAuthenticationOptions cookieOptions = options.Get(authenticationType);
            var cookieName = cookieOptions.Cookie.Name;
            if (string.IsNullOrEmpty(cookieName))
            {
                return false;
            }

            var cookie = context.Request.Cookies[cookieName];
            if (string.IsNullOrEmpty(cookie))
            {
                return false;
            }

            try
            {
                AuthenticationTicket? unprotected = cookieOptions.TicketDataFormat.Unprotect(cookie);
                return unprotected is not null && unprotected.AuthenticationScheme == authenticationType;
            }
            catch (Exception ex)
            {
                // Cookie is invalid/corrupted
                logger.LogDebug(ex, "Cookie unprotect failed for {AuthType}", authenticationType);
                return false;
            }
        }

        /// <summary>
        /// Gets the current back-office user.
        /// </summary>
        /// <returns>The current user, or null if not found.</returns>
        public IUser? GetCurrentUser() => backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;

        /// <summary>
        /// Checks if a back-office user has specified permissions for a content item.
        /// </summary>
        /// <param name="user">The user to check.</param>
        /// <param name="contentItem">The content item to check permissions against.</param>
        /// <param name="permissionsToCheck">The collection of permissions to verify.</param>
        /// <returns>True if the user has all the specified permissions; otherwise, false.</returns>
        public bool HasPermissions(IUser user, IContent contentItem, IEnumerable<string>? permissionsToCheck)
        {
            List<string> permissionsToCheckList = permissionsToCheck?.ToList() ?? [];
            if (permissionsToCheckList.Count == 0)
            {
                return false;
            }

            IEnumerable<string> permissions = user.GetPermissions(contentItem.Path, userService);
            return permissionsToCheckList.All(permissions.Contains);
        }
    }
}
