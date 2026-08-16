using Articulate.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Web.Common.Authorization;

namespace ArticulateDockerSite.Services;

/// <summary>Runs the opt-in integration fixture after the app has fully started.</summary>
[ApiController]
[Route("articulate/harness")]
[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
public sealed class ArticulateHarnessFixtureController(
    BackOfficeAuthService backOfficeAuthService,
    ArticulateHarnessPermissionsFixture fixture) : ControllerBase
{
    [HttpPost("fixture")]
    public async Task<IActionResult> Run()
    {
        IUser? user = backOfficeAuthService.GetCurrentUser();
        if (user is null)
        {
            return Unauthorized();
        }

        IUser currentUser = user ?? throw new InvalidOperationException("Backoffice user disappeared during fixture setup.");
        await fixture.EnsureAsync(currentUser);
        return Ok(new { completed = true });
    }
}
