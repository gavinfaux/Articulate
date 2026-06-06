# Autopublish Belongs Outside the Default Package Path

## Status

Accepted

## Context

Articulate needs two different things that used to get blurred together:

- package migrations and installed content setup
- dev-only automation for agents, tests, and Docker-based validation

We also want to keep the production package independent from dev automation, because the automation layer is a dev control plane and is not expected to be present in production.

Prior art from the Umbraco ecosystem shows a leaner pattern works better: infer the desired model from a source of truth, materialize it in a live Umbraco instance through the Management API, validate the result, and repeat only if validation proves there is drift.

## Decision

Move Articulate to a migration-only default package path.

- Remove auto-publish from the default package behavior.
- Keep the package-side opt-in path tiny: `Articulate:AutoPublishOnStartup` enables a notification handler, and the package-facing opt-in contract stays equally small so a content-bearing RCL can opt in without a framework.
- Treat `Articulate.Theme.Sample` as the concrete example package for the opt-in path, with migration ordering that keeps the core Articulate package ahead of the sample content import.
- Use direct REST API calls as the dev-only publish and verification control plane, configured through host environment variables or equivalent host-level config.
- Prefer readonly sessions for safety when the task only needs inspection, schema discovery, or dry-run validation.
- Keep Articulate's dev bootstrap limited to environment/config + startup API-user provisioning and client credentials registration; do not treat the markdown editor as a headless automation surface.
- Keep any future package-side automation optional and tiny if it ever expands beyond the built-in opt-in hook, and only enable it for packages that actually ship publishable content.
- If a package needs to opt in via code, prefer one contributor interface and one target record rather than a broad plugin framework.
- Avoid introducing a broad runtime plugin framework for marketplace identity; keep package discovery in NuGet metadata, README content, and Umbraco Marketplace listings unless a package has a real runtime contribution to make.

## Consequences

- Package installs become more predictable and easier to reason about.
- Production usage no longer depends on dev automation behavior.
- Agent workflows can still publish and verify content through the Management API in Docker or local development.
- Dev automation setup remains explicit and unattended-friendly because secrets, base URLs, and bootstrap client identity live in host/env config, not in package code.
- Readonly mode gives us a low-risk default for inspection-heavy workflows.
- Empty-DB Docker boots should import Articulate before `Articulate.Theme.Sample`, so the sample package can install content that depends on Articulate document types already existing.
- Any future optional add-in should be a narrow hook, not a second framework.
- Tests can separate migration correctness from publish automation correctness.

## Notes

- This decision is intentionally small and narrow.
- The automation layer should stay version-pinned per Umbraco major line rather than relying on a floating package name.
- If a future package needs a runtime contribution beyond the built-in opt-in hook, it can use a small dedicated interface for that purpose.
- Marketplace identity itself remains documentation and package metadata, not a runtime contract.
