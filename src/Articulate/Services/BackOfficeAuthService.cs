#nullable enable
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Articulate.Services
{
    public class BackOfficeAuthService(IOptionsMonitor<CookieAuthenticationOptions> options)
    {
        public bool IsBackOfficeLoggedIn(HttpContext context, string authenticationType)
        {
            CookieAuthenticationOptions cookieOptions = options.Get(authenticationType);
            {
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
        }
    }
}
