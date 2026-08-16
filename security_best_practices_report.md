# OWASP Security Review

## Executive summary

This static review found four High issues. Two non-production items are deferred: API-generation tooling and local Docker. No Critical issue was found.

Current status: SEC-001, SEC-002, and SEC-003 are fixed for their addressed surfaces; SEC-012 is partially fixed. The MetaWeblog fixes add target permissions and hardened password validation, while scoped credentials and rate limiting remain future work.

### Production quick wins

#### 1. MetaWeblog authorization and authentication

- **Status:** SEC-001 and SEC-002 are fixed; SEC-012 is partially fixed.
- **Residual quick win:** Restrict the endpoint at the network edge, then replace primary-password checks with scoped, revocable app credentials.
- **Summary:** The MetaWeblog surface now has target authorization and hardened compatibility authentication, but it remains a legacy credentialed API.

#### 2. BlogML target authorization

- **Issue:** Settings access does not authorize the selected export/import branch (SEC-003).
- **Quick win:** Add an authorization check in the controller. Check the root and descendants before parsing or changing the file.
- **Summary:** Reject an unauthorized operation before bulk work starts.
- **Elaboration:** Export needs branch browse access. Import needs create, update, publish, and optional media-path checks for each target.

The review used the [OWASP Top 10:2025](https://owasp.org/Top10/2025/) and [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/). It also checked the [.NET Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DotNet_Security_Cheat_Sheet.html) and Microsoft's [antiforgery](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0) and [rate limiting](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0) guidance. Scope: first-party C#, ASP.NET Core, JavaScript/TypeScript, package locks, Docker, and GitHub Actions. Umbraco behavior was checked against local `release-17.6.0` and `release-18.1.0` sources, plus the current working tree. This was a static review with small parser and dependency probes. It was not a penetration test.

## High severity

### SEC-001: MetaWeblog mutations lack complete target authorization — **Fixed**

- **OWASP:** A01:2025 Broken Access Control
- **Location:** `src/Articulate/MetaWeblog/ArticulateMetaWeblogProvider.cs:65-90`, `:107-170`, `:319-353`; `src/Articulate/Services/BackOfficeAuthService.cs:57-66`; `src/Articulate/Services/ArticulateImportMediaService.cs:720-745`
- **Original evidence:** Before the fix, create, publish, edit, delete, and upload paths did not consistently enforce target permissions or blog ancestry.
- **Resolution:** The provider now validates the configured blog root and post type/ancestry, keeps the authenticated `IUser`, applies `IContentPermissionService` checks for browse/create/update/publish/delete, and requires `ActionUpdate` on the blog root before filesystem uploads. Denied operations have regression coverage and no-mutation assertions.
- **Residual risk:** MetaWeblog still accepts primary backoffice passwords. Keep the endpoint restricted at the network edge until scoped credentials and rate limiting exist.

### SEC-002: MetaWeblog exposes drafts without item authorization — **Fixed**

- **OWASP:** A01:2025 Broken Access Control
- **Location:** `src/Articulate/MetaWeblog/ArticulateMetaWeblogProvider.cs:225-246`, `:250-283`, `:652-677`
- **Original evidence:** Before the fix, direct and recent-post reads could expose unpublished content without target authorization.
- **Resolution:** `GetPostAsync` requires blog ancestry, an Articulate post type, and `ActionBrowse`; `GetRecentPostsAsync` filters post types and applies browse authorization per item, including Markdown posts. Cross-blog and unauthorized-draft regression tests pass.
- **Residual risk:** The endpoint remains a credentialed XML-RPC surface and should still be restricted to trusted users at the host/network boundary.

### SEC-003: BlogML import and export omit target-node permission checks — **Fixed**

- **OWASP:** A01:2025 Broken Access Control
- **Location:** `src/Articulate/Controllers/Api/BlogMlApiController.cs:24-30`, `:169-176`, `:256-286`; `src/Articulate/ImportExport/BlogMlImporter.cs:107-126`, `:265-344`, `:369-403`, `:465-472`, `:602-630`, `:803-817`
- **Original evidence:** The controller previously checked only `SectionAccessSettings`; import/export did not verify the selected root or affected descendants.
- **Resolution:** Export now resolves the current user, validates the Articulate root, preserves every archive, captures and authorizes the exact author/post snapshots that it serializes, emits a namespaced per-post archive marker (archive key plus name fallback), limits category definitions to tags used by those posts, and checks referenced media items before Base64 reads. Import checks root browse access before parsing, builds one immutable authorization/import plan for authors, archives, posts, and media, maps marked posts to matching archives, retains first-archive fallback for third-party BlogML, and applies final content authorization before each post mutation. No-op imports need no write action, new records require New (and Publish when applicable), overwrite targets require Update (and Publish when applicable). Potentially usable image attachments trigger an early media root/bin guard so denied imports cannot leave an auto-created archive behind; the actual media write rechecks immediately before `SaveToMediaLibrary`. Empty collections no longer create containers, and failed preflight returns generic 403 without writing content, media, or export files.
- **Regression coverage:** Low-privilege export/import tests verify denial before parsing/writes and no content save on denied import; empty collections, author publish permission, operation matrices, archive routing (including auto-created archives), unusable-image handling, shared media guard behavior, and exporter media-item denial before file creation are covered. Legacy `ArticulatePost` has no BlogML contract in current or historical importer/exporter code, so BlogML remains limited to RichText/Markdown while MetaWeblog retains its legacy support.
- **Residual risk:** The Management API still relies on the host's Settings-section policy and deployment controls; permissions must be kept aligned with the selected Articulate branch.

### SEC-012: MetaWeblog password authentication bypasses MFA and account lockout — **Partially fixed**

- **OWASP:** A07:2025 Authentication Failures
- **Location:** `src/Articulate/Controllers/MetaWeblogController.cs:28-51`; `src/Articulate/MetaWeblog/ArticulateMetaWeblogProvider.cs:813-847`; `docker/src/Program.cs:8-70`
- **Original evidence:** The XML-RPC path previously checked only the primary password and bypassed lockout, failure counting, and MFA policy.
- **Resolution:** `ValidateUserAsync` now rejects missing/locked and MFA-enabled identity users, records failed password attempts, resets failures after successful authentication, and returns generic authentication errors. Disabled/unapproved-user behavior and end-to-end XML-RPC fault coverage still need explicit characterization.
- **Remaining gap:** The endpoint still accepts the primary backoffice password. The maintainer selected the compatibility-bridge option: no in-package scoped credential store, rate limiter, or sunset is being claimed. SEC-012 remains partially fixed.
- **Mitigation/ownership:** The consuming host must restrict MetaWeblog at the network/edge layer and apply rate limiting. This is an accepted deployment-owned residual, not a package-level remediation.

## Deferred non-production hardening

These items are for maintainers. They are not production quick wins. The paths are development, test, or agent-advisor infrastructure.

### SEC-009: API generation disables TLS certificate validation process-wide

- **Rule ID:** JS supply-chain / CWE-295
- **OWASP:** A04:2025 Cryptographic Failures; A08:2025 Software or Data Integrity Failures
- **Location:** `src/Articulate.Web/Client/v17/package.json:28`; `src/Articulate.Web/Client/v18/package.json:28`; `src/Articulate.Web/Client/scripts/generate-api.js:49,80-116`
- **Evidence:** Both manual `generate:api` scripts set `NODE_TLS_REJECT_UNAUTHORIZED=0` while fetching a localhost OpenAPI schema.
- **Disposition:** Defer as developer tooling. If addressed, remove the TLS bypass and use the trusted local CA through `NODE_EXTRA_CA_CERTS`; do not parameterise hosts or ports as part of this security fix. Reprioritize if generation runs in CI, release automation, or against a non-local endpoint.

### SEC-010: Local Docker images are tag-pinned rather than digest-pinned

- **OWASP:** A08:2025 Software or Data Integrity Failures
- **Location:** `docker/Dockerfile:9-13`; `docker/docker-compose.yml:10-11,71-72`
- **Evidence:** SDK/runtime images use mutable `10.0` tags. Caddy uses `2.11.4-alpine` without a digest.
- **Disposition:** Defer as a local development/test issue. Reprioritize if these images become production deployment inputs.

## Controls that passed review

- Management API controllers use authorization policies. The Markdown editor checks create and publish permission on its archive.
- BlogML parsing blocks DTDs, sets `XmlResolver` to null, and limits document characters (`BlogMlImporter.cs:215-224`).
- Imported HTML is sanitized. Image redirects are rechecked. DNS is pinned. Unsafe IP ranges are blocked. Image size and signatures are checked.
- SQL values are parameterized. Lucene terms are escaped and length-limited.
- Umbraco 17.6.0 and 18.1.0 resolve `System.Security.Cryptography.Xml` 10.0.10 and `Microsoft.OpenApi` 2.9.0/2.11.0. The current working tree no longer directly pins the cryptography package.
- The Markdown editor uses PKCE, keeps tokens in memory, checks OAuth state, validates same-origin redirects, and sends a strict CSP header.
- No separate CSRF issue was found. Management API changes use an authenticated API boundary. MetaWeblog credentials are in the XML-RPC body, not an ambient browser cookie.
- Production exception pages are off in Docker. The developer exception page is on only in Development. Controllers return generic errors. Logs keep exception context.
- The frontend has no dangerous DOM, code, or message sinks. Lit escapes interpolated values.
- `pnpm audit --json` found zero vulnerabilities across 498 locked dependencies.
- The local Compose harness binds Caddy to loopback by default. It uses a non-root UID, drops capabilities, enables `no-new-privileges`, and uses a `noexec,nosuid` temp filesystem.

## Safe OSS disclosure

As checked on 2026-08-09, the [upstream repository has no `SECURITY.md`](https://github.com/Shazwazza/Articulate/security/policy). GitHub private vulnerability reporting is disabled. Keep this report, probes, and fix branches private until maintainers choose a channel.

1. **Recommended: coordinated GitHub advisory.** Contact a maintainer through a private channel. Ask for a [draft repository security advisory](https://docs.github.com/en/code-security/concepts/vulnerability-reporting-and-management/repository-security-advisories). GitHub supports private discussion, a private fork, coordinated fixes, and later publication.
2. **Alternative: private maintainer branch or encrypted message.** Share the finding and smallest useful reproducer. Agree on affected versions and release date. Publish the fix after release.
3. **Last resort: contact-request issue.** If no private route exists, open a short public issue asking for a security contact. Do not include endpoints, repro steps, line references, credentials, or impact details.

Use three contribution lanes:

- **Private security:** SEC-001, SEC-002, SEC-003, and SEC-012. Split into MetaWeblog and BlogML fix series. Add low-privilege and MFA/lockout tests before disclosure.
- **Deferred:** SEC-009 and SEC-010 while their tooling stays outside production.

Publish application details after supported v17 and v18 packages contain the fixes. Name affected and fixed versions and mitigations. Publish only the probe detail needed to assess exposure.

## Scope and remaining risk

- No live browser or production-host header/cookie integration test was run. A live v18 XML-RPC route was exercised with authorized and invalid credentials, including discovery, reads, mutations, and upload.
- No Git history or external secret-store audit was run. No production secret was confirmed in the tracked tree.
- The test-only SQLite native dependency is not in the packable runtime project. It is excluded.
- BlogML upload size is set by the host. Docker permits 100 MB. The controller copies the buffered `IFormFile` into memory before the XML limit. Settings access and the host limit make this conditional. A byte limit and direct streaming would lower peak memory.
- Docker Compose is a loopback-only local harness by default. Its `Production` switch tests Umbraco behavior with persistent development volumes. It does not revoke known development admin or automation credentials. It is not a hardened deployment. Changing `CADDY_BIND_IP` expands the risk to that network.
- Security headers, production cookie policy, data-protection keys, proxy trust, and edge rate limiting belong to the consuming Umbraco host. They need deployment checks. They were not reported without a first-party exploit path.
