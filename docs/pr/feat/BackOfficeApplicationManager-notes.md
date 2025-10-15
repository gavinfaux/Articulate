# Custom BackOfficeApplicationManager Notes

## TL;DR

We want `/umbraco/management/api/v1/security/back-office/authorize` to recognise our extra client id/redirect URIs without breaking the stock back-office setup. OpenIddict reads clients directly from its store, so we can register our own client alongside Umbraco's defaults without replacing `BackOfficeApplicationManager`.

---

## Default Setup

- `BackOfficeAuthBuilderExtensions.AddAuthentication` wires `IBackOfficeApplicationManager` to `BackOfficeApplicationManager`.
- `BackOfficeApplicationManager.EnsureBackOfficeApplicationAsync` creates the core back-office client and, in non-production, the Swagger/Postman developer clients.
- The authorize endpoint uses OpenIddict; it reads `OpenIddictApplicationDescriptor`s from the OpenIddict application store. Any descriptor we add through `IOpenIddictApplicationManager` is automatically available to that endpoint.

---

## Options Recap

1. **Replace/Compose the manager** - required only if we need to alter the default back-office client (change redirect URIs on `Constants.OAuthClientIds.BackOffice`, remove Swagger/Postman, etc.).
2. **Register an extra client separately** - safest path if we just need another client id/redirect pair; we keep the default manager intact and add our descriptor via OpenIddict directly.

We decided to follow option 2 to avoid the risk of breaking core back-office behaviour.

---

## Adding Our Client Without Replacing the Manager

- If the goal is simply to register an additional client id/redirect pair so `/umbraco/management/api/v1/security/back-office/authorize` accepts it, resolve `IOpenIddictApplicationManager` (or reuse `OpenIdDictApplicationManagerBase` in a helper class) from DI and call `CreateAsync`/`UpdateAsync` with your descriptor. Hook this into a composer, hosted service, migration step, or any startup component that runs once Umbraco has booted.

```csharp
public class CustomBackOfficeClientRegistrar
{
    private readonly IOpenIddictApplicationManager _applications;

    public CustomBackOfficeClientRegistrar(IOpenIddictApplicationManager applications)
        => _applications = applications;

    public async Task EnsureCustomClientAsync(CancellationToken ct = default)
    {
        var descriptor = new OpenIddictApplicationDescriptor
        {
            DisplayName = "My Custom Back-Office Client",
            ClientId = "my-client-id",
            ClientType = OpenIddictConstants.ClientTypes.Public,
            Permissions =
            {
                OpenIddictConstants.Permissions.Endpoints.Authorization,
                OpenIddictConstants.Permissions.Endpoints.Token,
                OpenIddictConstants.Permissions.Endpoints.EndSession,
                OpenIddictConstants.Permissions.Endpoints.Revocation,
                OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
                OpenIddictConstants.Permissions.ResponseTypes.Code,
            },
            RedirectUris =
            {
                new Uri("https://my-app/callback")
            }
        };

        var existing = await _applications.FindByClientIdAsync(descriptor.ClientId!, ct);
        if (existing is null)
        {
            await _applications.CreateAsync(descriptor, ct);
        }
        else
        {
            await _applications.UpdateAsync(existing, descriptor, ct);
        }
    }
}
```

- Trigger `EnsureCustomClientAsync` during startup (e.g. from a composer, hosted service, or install/upgrade step). This leaves `BackOfficeApplicationManager` untouched.
- Once registered, the authorize endpoint will list/accept the new client because the descriptor lives in OpenIddict's store.

---

## When to Replace the Manager Instead

- We need to override `BackofficeOpenIddictApplicationDescriptor` details (different callback paths, client type, permissions, etc.).
- We must add/remove the developer clients automatically when Umbraco toggles between development and production.
In those cases, replace `IBackOfficeApplicationManager` with a custom implementation that delegates to the stock class and adds custom logic, as documented earlier.

---

*File location: `F:\int\Articulate6-wip\docs\pr\feat\BackOfficeApplicationManager-notes.md`.*
