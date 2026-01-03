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
    public sealed class BackOfficeAuthService(
        IOptionsMonitor<CookieAuthenticationOptions> options,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        IUserService userService,
        ILogger<BackOfficeAuthService> logger)
    {
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

        public IUser? GetCurrentUser() => backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;

        public bool HasCurrentUser() => GetCurrentUser() is not null;

        public bool CurrentUserHasPermissions(IContent contentItem, IEnumerable<string> permissionsToCheck)
        {
            IUser? currentUser = GetCurrentUser();
            return currentUser is not null && HasPermissions(currentUser, contentItem, permissionsToCheck);
        }

        public bool HasPermissions(IUser user, IContent contentItem, IEnumerable<string>? permissionsToCheck)
        {
            if (permissionsToCheck is null || !permissionsToCheck.Any())
            {
                return true;
            }
            IEnumerable<string> permissions = user.GetPermissions(contentItem.Path, userService);
            return permissionsToCheck.All(p => permissions.Contains(p));
        }
    }
}
