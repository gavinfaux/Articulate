# Autopublish / Dev Automation Split Task List

Repo-local, GitHub-flavored markdown only.
Not published to GitHub.

Status: Slice 1 done, Slice 2 done, Slice 3 done as the concrete package-side opt-in hook in `Articulate.Theme.Sample`; any expansion beyond the built-in hook remains future-only.

## Slice 1: Make the core package migration-only

- Type: AFK
- Blocked by: None
- User stories covered: 1, 6, 8, 9, 12

### What to build

Remove auto-publish from the default Articulate package path so installs and upgrades only perform migration and package setup work.

### Acceptance criteria

- [x] Package install and upgrade paths complete without triggering publish side effects.
- [x] Migration completion and publish completion remain separate concerns.
- [x] The package boundary is documented as migration-only in the PRD and ADR.
- [x] Tests continue to cover migration behavior without requiring dev automation.

## Slice 2: Use the Management API for dev-only publish and verification

- Type: AFK
- Blocked by: Slice 1
- User stories covered: 2, 3, 4, 5, 9, 10, 13, 16, 17

### What to build

Define the dev-only automation path where direct Management API calls publish and verify Articulate content against local or Docker-hosted Umbraco instances.

### Acceptance criteria

- [x] Automation config is host/env driven, not package driven.
- [x] Automation scripts are version-pinned per Umbraco major line.
- [x] Readonly mode is the safe default for inspection-only workflows.
- [x] Dev/Docker automation can publish and verify content without production coupling.
- [x] The docs clearly distinguish dev automation from the package install path.

## Slice 3: Keep the package-side opt-in hook tiny

- Type: AFK
- Blocked by: Slice 1 and Slice 2
- User stories covered: 11, 14, 15, 16, 17

### What to build

Keep the package-side opt-in hook tiny: it should stay config-driven, content-bearing-package-only, and separate from dev automation. The concrete example is `Articulate.Theme.Sample`, which opts in through a single contributor interface and a tiny target record. Any broader plugin framework remains out of scope.

### Acceptance criteria

- [x] The opt-in boundary is explicit and config-driven.
- [x] The hook stays narrow enough that it does not duplicate migration logic.
- [x] The package-facing contract can be expressed with a single contributor interface and target record.
- [x] The Docker `plugin` mode remains confirm-only harness, not the feature itself.
- [x] Empty-DB Docker boots import Articulate before `Articulate.Theme.Sample`.
- [x] Marketplace identity continues to live in metadata and docs, not a runtime framework.

## Notes

- This is intentionally small and narrow.
- The default package path stays migration-only.
- Direct Management API calls are the dev-only control plane for publish and verification.
- `Articulate.Theme.Sample` is the canonical package-side opt-in example.
- Marketplace identity is a docs/metadata concern unless a package has a real runtime contribution.
