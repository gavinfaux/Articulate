#nullable enable
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Security;

namespace Articulate.Controllers
{
    /// <summary>
    /// Represents the response returned upon successful login.
    /// </summary>
    public class LoginSuccessResponse
    {
        /// <summary>
        /// Gets a value indicating whether the login was successful.
        /// </summary>
        public bool Success { get; init; }
    }

    /// <summary>
    /// Represents the response when two-factor authentication is required.
    /// </summary>
    public class TwoFactorRequiredResponse
    {
        /// <summary>
        /// Gets a value indicating whether two-factor authentication is required.
        /// </summary>
        public bool RequiresTwoFactor { get; init; }

        /// <summary>
        /// Gets the URL to redirect the user for two-factor authentication.
        /// </summary>
        public string RedirectUrl { get; init; } = string.Empty;
    }

    /// <summary>
    /// Represents the authentication status response.
    /// </summary>
    public class StatusResponse
    {
        /// <summary>
        /// Gets a value indicating whether the user is authenticated.
        /// </summary>
        public bool IsAuthenticated { get; init; }
    }

    /// <summary>
    /// Represents the CSRF token response.
    /// </summary>
    public class CsrfTokenResponse
    {
        /// <summary>
        /// Gets the CSRF request token.
        /// </summary>
        public string RequestToken { get; init; } = string.Empty;
    }

    /// <summary>
    /// Represents the login model for authentication.
    /// </summary>
    public class ArticulateLoginModel
    {
        /// <summary>
        /// Gets the email address of the user.
        /// </summary>
        [Required(ErrorMessage = "Email Address is required.")]
        [EmailAddress(ErrorMessage = "Email Address must be a valid email address.")]
        public string EmailAddress
        {
            get;
        } = string.Empty;

        /// <summary>
        /// Gets the password of the user.
        /// </summary>
        [Required(ErrorMessage = "Password is required.")]
        public string Password
        {
            get;
        } = string.Empty;
    }
    // NOTE: [ApiController] attribute will automatically validate the model
    // [ApiController] attribute also infers [FromBody] for model binding

    /// <summary>
    /// Provides authentication endpoints for Articulate.
    /// </summary>
    [ApiVersion("1.0")]
    [ApiExplorerSettings(GroupName = "Authentication")]
    [ApiController]
    [MapToApi(ArticulateConstants.ApiName)]
    [Route("api/v{version:apiVersion}/articulate/auth")]
    public class ArticulateAuthController(IBackOfficeSignInManager signInManager, IAntiforgery antiforgery)
        : ControllerBase
    {
        /// <summary>
        /// Gets a CSRF token for the current session.
        /// </summary>
        /// <returns>A <see cref="CsrfTokenResponse"/> containing the CSRF request token.</returns>
        [HttpGet("get-csrf-token")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(CsrfTokenResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public IActionResult GetCsrfToken()
        {
            var tokens = antiforgery.GetAndStoreTokens(HttpContext);
            return new JsonResult(new { requestToken = tokens.RequestToken });
        }

        /// <summary>
        /// Gets the authentication status of the current user.
        /// </summary>
        /// <returns>A <see cref="StatusResponse"/> indicating if the user is authenticated.</returns>
        [ProducesResponseType<StatusResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesDefaultResponseType(typeof(ProblemDetails))]
        [HttpGet("status")]
        [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
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
             ArticulateLoginModel model)
        {
            if (string.IsNullOrEmpty(model.EmailAddress) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest("Username and password are required.");
            }

            var result = await signInManager.PasswordSignInAsync(
                model.EmailAddress, model.Password, true, true).ConfigureAwait(false);

            if (result.Succeeded)
            {
                return Ok(new LoginSuccessResponse { Success = true });
            }

            if (result.RequiresTwoFactor)
            {
                // 200 OK with instructions for the client.
                return Ok(new TwoFactorRequiredResponse { RequiresTwoFactor = true, RedirectUrl = "/umbraco" });
            }

            if (result.IsLockedOut)
            {
                return new StatusCodeResult(StatusCodes.Status423Locked);
            }

            if (result.IsNotAllowed)
            {
                return new StatusCodeResult(StatusCodes.Status403Forbidden);
            }

            return new StatusCodeResult(StatusCodes.Status401Unauthorized);
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
        /// <response code="200">If the user was successfully logged out.</response>
        [HttpPost("logout")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
        public async Task<IActionResult> Logout()
        {
            await signInManager.SignOutAsync().ConfigureAwait(false);
            return Ok();
        }
    }
}
