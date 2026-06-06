# Problem Statement

Articulate currently mixes package migration work with post-migration publishing behavior. That works, but it blurs two different responsibilities:

- package installation and migration, which should remain stable and repeatable
- developer automation, which may need to publish content, run tests, and drive backoffice workflows through the Umbraco Management API or similar tooling

The question is how to make that boundary explicit for Umbraco 16, 17, and 18 while keeping the developer experience smooth for agents and automation.

# Solution

Separate the concerns into two layers:

- the core Articulate package owns schema, content, and migration behavior
- direct Management API calls own dev-only publish automation, agent workflows, and instance interaction during local development and Docker-based validation

Auto-publish is removed from the default package path. The default package should be migration-only. The implemented package-side opt-in path is intentionally tiny: `Articulate:AutoPublishOnStartup` enables a small notification handler, and the package-facing contract stays equally small so a content-bearing RCL can opt in without a framework. The package must still ship publishable content in its embedded `package.zip`, but the opt-in signal should come from the package itself, not from dev automation. `Articulate.Theme.Sample` is the concrete example package for this path, and its migration plan is ordered so the core Articulate package imports first. If this ever expands beyond the built-in opt-in hook, it should stay narrow, not become a broad plugin framework.

For dev automation, assume publish capability already exists via the Umbraco Management API and focus on version-pinned compatibility per major Umbraco line. The automation layer should be the place where automation commands, agent testing, and workflow orchestration live. This keeps the production package independent from dev automation, which is not expected to be available in production. Automation configuration should be host/env driven, not package driven, so unattended local or Docker runs can inject client id and secret without changing the repo. The smallest Articulate bootstrap should mirror that pattern only for dev configuration and client provisioning: dev-only env files or compose overrides plus any site-local startup registration needed to create or upsert the API user and attach the client credentials, not a headless editor-login flow. That bootstrap is separate from the package-side opt-in autopublish hook.

Readonly should be the safe default for inspection-heavy workflows. When an agent only needs to inspect schema, verify state, or prepare a dry run, the automation script should be able to run in readonly mode and avoid any unnecessary write paths.

The prior-art shape we want to reuse is a closed loop: infer the desired model from a source of truth, materialize it in the live Umbraco instance through the Management API, validate the result, and repeat only when validation shows drift. That is a better fit for agents and Docker than a broad package-side automation framework because it reduces duplicate work and keeps the number of moving parts low.

# User Stories

1. As an installer, I want Articulate migrations to run without unexpected publishing side effects, so that package installs remain predictable.
2. As a developer, I want dev automation to publish Articulate content explicitly through the Management API, so that I can verify content state after installs and migrations.
3. As an agent runner, I want a version-pinned automation surface for Umbraco 16, 17, and 18, so that tool behavior matches the site version I am operating against.
4. As an agent runner, I want automation to be configured from host or environment settings, so that I can automate local and Docker scenarios without changing package code.
5. As an agent runner, I want readonly mode for inspection-only tasks, so that automation can fail safely when it does not need to write.
6. As a maintainer, I want the core package to stay focused on package-level concerns, so that upgrades and migrations stay easier to reason about.
7. As a maintainer, I want publish automation to be optional, so that production installs do not inherit dev-only workflow behavior.
8. As a developer, I want the package migration path to remain compatible across supported Umbraco major versions, so that the same Articulate release can support the current version line without branching logic everywhere.
9. As a tester, I want to validate migration completion independently from publish automation, so that failures are easier to isolate.
10. As a tester, I want to validate publish behavior only when the automation layer is enabled, so that tests can distinguish package correctness from automation correctness.
11. As a user of the package-side opt-in path, I want a tiny installation surface that only adds the automation hook I asked for, so that I do not pay for extra behavior I do not use.
12. As a user upgrading from an earlier Articulate version, I want migrations to run cleanly before any optional automation tries to publish content, so that upgrade flow stays safe.
13. As an agent operator, I want the automation layer to know which Articulate roots exist and whether they should be published, so that post-install verification can be repeatable.
14. As a contributor, I want the publish policy to be explicit and configurable, so that future changes do not accidentally turn dev behavior into a package default.
15. As a maintainer, I want a clear contract between the package and the automation layer, so that future extensions can be added without duplicating migration logic.
16. As a documentation reader, I want the README and developer notes to clearly explain which behavior belongs to the package and which belongs to dev automation or the package-side opt-in path, so that setup choices are obvious.
17. As an integrator, I want the automation layer to be replaceable or removable without breaking the package, so that teams can choose the amount of DX automation they want.

# Implementation Decisions

- Keep package migration responsibilities inside the core Articulate package.
- Treat auto-publish as removed from the default package behavior, not as a hidden install side effect.
- Prefer direct Management API calls as the primary automation surface when the goal is agent execution, publish verification, or dev workflows.
- Keep automation config host/env driven, including client id and client secret.
- Use readonly mode as the default safety lever for inspection-only automation runs.
- Pin automation scripts to the Umbraco major version they target so the surface tracks the site version.
- Keep the production package independent from dev automation.
- If package-side publish automation ever returns beyond the built-in opt-in path, move it behind a small optional boundary so it can be enabled independently and only for packages that ship publishable content.
- Keep the package-facing opt-in contract small: one tiny contributor interface plus a tiny target record is preferable to a broad extension framework.
- Avoid introducing a runtime interface just for marketplace identity; package discovery should continue to live in NuGet metadata, README content, and Umbraco Marketplace listings unless a package needs a real runtime contribution such as theme discovery.
- Define a narrow contract for anything that needs to discover Articulate roots, evaluate publish eligibility, or trigger publication.
- Keep package migration ordering deterministic so the core Articulate package imports before content-bearing examples like `Articulate.Theme.Sample`.
- Keep version-specific Umbraco compatibility at the boundary where the automation layer connects to the site.
- Preserve the current separation between migration completion and publish completion.
- Avoid creating duplicate migration implementations in the package and automation layers.
- Keep the default install path safe for production and ordinary upgrade scenarios.
- Prefer one source of truth per concern: package metadata/docs for marketplace identity, Management API scripts for live dev automation, and package migrations for install-time schema/content setup.
- Favor deterministic, replayable steps over hidden startup behavior so validation can stay cheap and repeatable.
- Minimize redundant publish or import passes; only repeat a step when validation shows a concrete mismatch.

# Testing Decisions

- Prefer tests that verify external behavior rather than implementation details.
- Test that package migrations complete without requiring the automation layer.
- Test that auto-publish does not occur in the default package path.
- Test that the opt-in package-side path only activates when `Articulate:AutoPublishOnStartup` is enabled and the package contributes publishable targets from its own opt-in contract.
- Test that a fresh empty-DB Docker boot imports the core Articulate package before `Articulate.Theme.Sample`, so the sample package can import content in the correct order.
- Test that the automation layer can identify the expected Articulate roots and publish them when asked.
- Test that host/env configuration can drive automation unattended in local or Docker scenarios.
- Test readonly mode for inspection-only workflows so it cannot accidentally write.
- Test that migration completion and publish completion can fail independently and produce understandable outcomes.
- Test the closed-loop workflow with minimal iterations: one change, one validation pass, then only retry when a mismatch is detected.
- Prior art in this repo includes focused migration and publish-behavior tests that mock services and verify observable results.
- Prior art in the wider Umbraco ecosystem shows direct API automation works best when it materializes live schema and then uses repeatable serialization/import tooling for bulk movement rather than relying on repeated manual backoffice work.

# Out of Scope

- Reworking Articulate content models or theme rendering.
- Changing the broader Umbraco Management API.
- Making auto-publish part of the default package install path.
- Designing a general-purpose automation platform for all packages.
- Adding a broad runtime plugin framework for marketplace identity or package discovery.
- Migrating all existing automation into a new framework at once.
- Adding a new UI for content publishing that is unrelated to dev automation or package automation.

# Further Notes

- The strongest split is: package for migrations, package-facing opt-in autopublish for content-bearing installs, and Management API scripts for dev automation.
- The Sample package is the canonical content-bearing example for the package-side opt-in path, not a hypothetical future add-in.
- Dev automation should be treated as host-configured infrastructure, not package-owned configuration.
- If a package-side optional add-in is still desired beyond the built-in opt-in path, it should look more like a thin hook than a second copy of the core migration logic.
- Marketplace identity should stay in package metadata and docs unless a real runtime contribution is needed.
- The more the automation path is tied to agents, tests, Docker, and install verification, the more it belongs outside the default package runtime path.
- Version pinning matters here because the automation surface is coupled to supported Umbraco majors rather than to Articulate alone.
- Readonly mode is the safest default whenever the workflow does not need to mutate content or schema.
- Efficiency goal: use the minimum number of automation steps needed to prove state, then stop. Do not add extra publish/import phases unless they close a specific drift gap.
