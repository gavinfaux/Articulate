using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Server;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;

namespace Articulate.Authorization
{
    // This attribute makes it easy to apply the filter to a controller.
    public class UseArticulateCookieAuthAttribute : TypeFilterAttribute
    {
        public UseArticulateCookieAuthAttribute() : base(typeof(ArticulateCookieAuthFilter))
        {
        }
    }

    public class ArticulateCookieAuthFilter : IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var result = await context.HttpContext.AuthenticateAsync(ArticulateConstants.ManagementApi.SchemeName);

            if (result.Succeeded && result.Principal != null)
            {
                context.HttpContext.User = result.Principal;
                return;
            }

            context.Result = new UnauthorizedResult();
        }
    }

    public class OpenIddictHandler : IOpenIddictServerHandler<OpenIddictServerEvents.GenerateTokenContext>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OpenIddictHandler(IHttpContextAccessor httpContextAccessor)
            => _httpContextAccessor = httpContextAccessor;

        public async ValueTask HandleAsync(OpenIddictServerEvents.GenerateTokenContext context)
        {
            if (context.Principal.Identity?.AuthenticationType != Umbraco.Cms.Core.Constants.Security.BackOfficeAuthenticationType)
            {
                return;
            }

            var cookieIdentity = new ClaimsIdentity(context.Principal.Claims, ArticulateConstants.ManagementApi.SchemeName);
            var cookiePrincipal = new ClaimsPrincipal(cookieIdentity);

            var httpContext = _httpContextAccessor.GetRequiredHttpContext();
            await httpContext.SignInAsync(
                ArticulateConstants.ManagementApi.SchemeName,
                cookiePrincipal,
                new AuthenticationProperties { IsPersistent = true });
        }
    }

    public class ArticulateAuthenticationComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            builder.Services
                .AddAuthentication()
                .AddCookie(ArticulateConstants.ManagementApi.SchemeName, options =>
                {
                    options.Cookie.Name = ArticulateConstants.ManagementApi.SchemeName;
                    options.Cookie.HttpOnly = true;
                    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                    options.SlidingExpiration = true;
                    options.Events = new CookieAuthenticationEvents
                    {
                        OnRedirectToLogin = context =>
                        {
                            if (context.Request.Path.StartsWithSegments("/umbraco/management/api") || context.Request.Path.StartsWithSegments("/articulate/management/api"))
                            {
                                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                            }
                            else
                            {
                                context.Response.Redirect(context.RedirectUri);
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

            builder.Services.AddSingleton<OpenIddictHandler>();
            builder.Services.Configure<OpenIddictServerOptions>(options =>
            {
                options.Handlers.Add(
                    OpenIddictServerHandlerDescriptor.CreateBuilder<OpenIddictServerEvents.GenerateTokenContext>()
                        .UseSingletonHandler<OpenIddictHandler>()
                        .Build());
            });

            builder.Services.AddScoped<ArticulateCookieAuthFilter>();
        }
    }
}
