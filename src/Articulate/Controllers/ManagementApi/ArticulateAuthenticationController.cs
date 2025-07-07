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

    public enum AuthenticationOperationStatus
    {
        BadRequest
    }

    // NOTE: [ApiController] attribute will automatically validate the model
    // [ApiController] attribute also infers [FromBody] for model binding

    /// <summary>
    /// Provides alternative authentication endpoint for Umbraco BackOffice and Articulate (Umbraco endpoint forces redirect to backoffice).
    /// </summary>
    [ApiVersion("1.0")]
    [ApiExplorerSettings(GroupName = "Authentication")]
    [ApiController]
    [MapToApi(ArticulateConstants.ApiName)]
    [Route("articulate/management/api/v{version:apiVersion}/authentication")]
    public class ArticulateAuthenticationController(IBackOfficeSignInManager signInManager, IAntiforgery antiforgery)
        : ControllerBase
    {
        // <summary>
        // Gets a CSRF token for the current session.
        // </summary>
        // <returns>A <see cref="CsrfTokenResponse"/> containing the CSRF request token.</returns>
        // <response code="200">Returns an <see cref="CsrfTokenResponse"/> containing the CSRF request token.</response>
        [HttpGet("csrf-token")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(CsrfTokenResponse), StatusCodes.Status200OK)]
        public IActionResult GetCsrfToken()
        {
            var tokens = antiforgery.GetAndStoreTokens(HttpContext);
            return new JsonResult(new { requestToken = tokens.RequestToken });
        }

        /// <summary>
        /// Gets the authentication status of the current user.
        /// </summary>
        /// <returns>A <see cref="StatusResponse"/> indicating if the user is authenticated.</returns>
        /// <response code="200">Returns an <see cref="StatusResponse"/> indicating if the user is authenticated.</response>
        [HttpGet("status")]
        [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
        [ProducesResponseType<StatusResponse>(StatusCodes.Status200OK)]
        public IActionResult GetStatus() => Ok(new StatusResponse { IsAuthenticated = true });

        /// <summary>
        /// Authenticates a user with the provided credentials.
        /// </summary>
        /// <param name="model">The login model containing email and password.</param>
        /// <returns>
        /// <see cref="LoginSuccessResponse"/> if login is successful,
        /// <see cref="TwoFactorRequiredResponse"/> if two-factor authentication is required,
        /// or an appropriate error response.
        /// </returns>
        /// <response code="200">Returns an <see cref="LoginSuccessResponse"/> indicating login is successful.</response>
        /// <response code="200">Returns an <see cref="TwoFactorRequiredResponse"/> indicating if the user is authenticated.</response>
        /// <response code="400">Email and password are required.</response>
        /// <response code="401">Authentication failed.</response>
        /// <response code="403">User login is disabled.</response>
        /// <response code="423">User is locked out.</response>
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        [HttpPost("login")]
        [ProducesResponseType<LoginSuccessResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<TwoFactorRequiredResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status423Locked)]
        public async Task<IActionResult> Login(
             LoginModel model)
        {
            if (string.IsNullOrEmpty(model.EmailAddress) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new ProblemDetails { Title="Validation Error", Detail = "Email and password are required.",
                    Status = StatusCodes.Status400BadRequest });
            }

            var result = await signInManager.PasswordSignInAsync(
                model.EmailAddress, model.Password, true, true);

            if (result.Succeeded)
            {
                return Ok(new LoginSuccessResponse { Success = true });
            }

            if (result.RequiresTwoFactor)
            {
                // 200 OK with instructions for the client.
                return Ok(new TwoFactorRequiredResponse { RequiresTwoFactor = true, RedirectUrl = "/umbraco" });
            }

            return result.IsLockedOut ? StatusCode(StatusCodes.Status423Locked, new ProblemDetails { Title = "Authentication Failed", Detail = "User is locked out.", Status = StatusCodes.Status423Locked }) :
                result.IsNotAllowed ? StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails { Title = "Forbidden", Detail = "User login is disabled.", Status = StatusCodes.Status403Forbidden }) :
                StatusCode(StatusCodes.Status401Unauthorized, new ProblemDetails { Title = "Unauthorized", Detail = "Authentication failed.", Status = StatusCodes.Status401Unauthorized });
        }

        /// <summary>
        /// Logs out the currently authenticated user.
        /// </summary>
        /// <remarks>
        /// Signs out the current user and ends their session.
        /// </remarks>
        /// <returns>
        /// An <see cref="IActionResult"/> indicating the result of the logout operation.
        /// </returns>
        /// <response code="200">Logout successful.</response>
        [HttpPost("logout")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
        public async Task<IActionResult> Logout()
        {
            await signInManager.SignOutAsync();
            return Ok(new { message = "Logout successful" });
        }
    }
}
