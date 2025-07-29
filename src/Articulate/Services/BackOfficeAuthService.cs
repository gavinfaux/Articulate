#nullable enable
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Articulate.Services
{
    public class BackOfficeAuthService
    {
        private readonly IOptionsMonitor<CookieAuthenticationOptions> _cookieOptions;

        public BackOfficeAuthService(IOptionsMonitor<CookieAuthenticationOptions> cookieOptions) =>
            _cookieOptions = cookieOptions;

        public bool IsBackOfficeLoggedIn(HttpContext context, string authenticationType)
        {
            CookieAuthenticationOptions cookieOptions = _cookieOptions.Get(authenticationType);
            {
                var cookieName = cookieOptions.Cookie.Name;
                if (!string.IsNullOrEmpty(cookieName))
                {
                    var cookie = context.Request.Cookies[cookieName];
                    if (!string.IsNullOrEmpty(cookie))
                    {
                        AuthenticationTicket? unprotected = cookieOptions.TicketDataFormat.Unprotect(cookie);
                        return unprotected is not null && unprotected.AuthenticationScheme == authenticationType;
                    }
                }
            }

            return false;
        }
    }
}
