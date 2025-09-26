#nullable enable
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace Articulate.Services
{
    public class BackOfficeAuthService(
        IOptionsMonitor<CookieAuthenticationOptions> options,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        IUserService userService)
    {
        private readonly IOptionsMonitor<CookieAuthenticationOptions> _options = options;
        private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
        private readonly IUserService _userService = userService;

        public bool IsBackOfficeLoggedIn(HttpContext context, string authenticationType)
        {
            CookieAuthenticationOptions cookieOptions = _options.Get(authenticationType);
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

            AuthenticationTicket? unprotected = cookieOptions.TicketDataFormat.Unprotect(cookie);
            return unprotected is not null && unprotected.AuthenticationScheme == authenticationType;
        }

        public IUser? GetCurrentUser() => _backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;

        public bool HasCurrentUser() => GetCurrentUser() is not null;

        public bool CurrentUserHasPermissions(IContent contentItem, IEnumerable<string> permissionsToCheck)
        {
            IUser? currentUser = GetCurrentUser();
            return currentUser is not null && HasPermissions(currentUser, contentItem, permissionsToCheck);
        }

        public bool HasPermissions(IUser user, IContent contentItem, IEnumerable<string> permissionsToCheck)
        {
            IEnumerable<string> permissions = user.GetPermissions(contentItem.Path, _userService);
            return permissionsToCheck.All(p => permissions.Contains(p));
        }
    }
}
