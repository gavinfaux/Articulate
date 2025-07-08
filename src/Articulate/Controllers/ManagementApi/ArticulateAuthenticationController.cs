#nullable enable
using System.Threading.Tasks;
using Articulate.Models.ManagmentApi.Authentication;
using Asp.Versioning;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Security;

namespace Articulate.Controllers.ManagementApi
{
    /// <summary>
    /// Provides an authentication endpoint for the Articulate Mobile Editor.
    /// </summary>
    [ApiVersion("1.0")]
    [ApiExplorerSettings(GroupName = "Authentication")]
    [ApiController]
    [MapToApi(ArticulateConstants.ApiName)]
    [Route("articulate/management/api/v{version:apiVersion}/authentication")]
    public class ArticulateAuthenticationController(IBackOfficeSignInManager signInManager, IAntiforgery antiforgery)
        : ControllerBase
    {
        /// <summary>
        /// Gets a CSRF token required for authenticated POST/PUT requests.
        /// </summary>
        /// <returns>A <see cref="CsrfTokenResponse"/> containing the CSRF request token.</returns>
        /// <response code="200">Successfully retrieved the CSRF token.</response>
        [HttpGet("csrf-token")]
        [AllowAnonymous]
        [ProducesResponseType<CsrfTokenResponse>(StatusCodes.Status200OK)]
        public ActionResult<CsrfTokenResponse> GetCsrfToken()
        {
            var tokens = antiforgery.GetAndStoreTokens(HttpContext);
            return new CsrfTokenResponse { RequestToken = tokens.RequestToken };
        }

        /// <summary>
        /// Gets the authentication status of the current user.
        /// </summary>
        /// <returns>A <see cref="StatusResponse"/> indicating if the user is authenticated.</returns>
        /// <response code="200">Returns the current authentication status.</response>
        [HttpGet("status")]
        [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
        [ProducesResponseType<StatusResponse>(StatusCodes.Status200OK)]
        public ActionResult<StatusResponse> GetStatus() => Ok(new StatusResponse { IsAuthenticated = true });

        /// <summary>
        /// Authenticates a user with the provided credentials.
        /// </summary>
        /// <param name="model">The login model containing email and password.</param>
        /// <response code="200">Login was successful. Returns either a <see cref="LoginSuccessResponse"/> or a <see cref="TwoFactorRequiredResponse"/>.</response>
        /// <response code="400">The request was invalid (e.g., missing email or password).</response>
        /// <response code="403">User login is disabled.</response>
        /// <response code="423">The user account is locked out.</response>
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        [HttpPost("login")]
        [ProducesResponseType<LoginResponseBase>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status423Locked)]
        public async Task<ActionResult<LoginResponseBase>> Login(LoginModel model)
        {
            if (string.IsNullOrEmpty(model.EmailAddress) || string.IsNullOrEmpty(model.Password))
            {
                return Problem(
                    title: "Validation Error",
                    detail: "Email and password are required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var result = await signInManager.PasswordSignInAsync(model.EmailAddress, model.Password, true, true);

            if (result.Succeeded)
            {
                return Ok(new LoginSuccessResponse { IsAuthenticated = true });
            }

            if (result.RequiresTwoFactor)
            {
                return Ok(new TwoFactorRequiredResponse { RequiresTwoFactor = true, RedirectUrl = "/umbraco" });
            }

            return result switch
            {
                { IsLockedOut: true } => Problem(title: "Authentication Failed", detail: "User is locked out.", statusCode: StatusCodes.Status423Locked),
                { IsNotAllowed: true } => Problem(title: "Forbidden", detail: "User login is disabled.", statusCode: StatusCodes.Status403Forbidden),
                _ => Problem(title: "Unauthorized", detail: "Authentication failed.", statusCode: StatusCodes.Status401Unauthorized)
            };
        }

        /// <summary>
        /// Logs out the currently authenticated user.
        /// </summary>
        /// <remarks>Signs out the current user and ends their session.</remarks>
        /// <response code="204">Logout was successful.</response>
        [HttpPost("logout")]
        [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Logout()
        {
            await signInManager.SignOutAsync();
            return NoContent();
        }
    }
}
