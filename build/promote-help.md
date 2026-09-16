# Articulate promotion utility

`build/promote.cs` prepares a candidate branch from selected commits in the side-by-side development branch. It never pushes, force-updates a ref, or opens a pull request.

```text
dotnet run --file build/promote.cs -- patch [options]
```

## patch

Create a candidate from a clean target branch and cherry-pick selected commits from a source ref:

```text
dotnet run --file build/promote.cs -- patch \
  --profile v17-lts \
  --base upstream/main \
  --source upstream/develop \
  --commits abc1234,def5678 \
  --manifest build/promotion.json
```

| Option | Required | Notes |
|---|---:|---|
| `--profile` | yes | `v17-lts` or `v18-sts`. Selects target checks and build profile. |
| `--base` | yes | Target branch or commit. The candidate starts here. |
| `--source` | yes | Side-by-side source branch or commit. |
| `--commits` | yes | Comma-separated commit SHAs, applied in the listed order. |
| `--branch` | no | Candidate branch. Defaults to `promote/<profile>/<source-short-sha>`. |
| `--worktree` | no | Candidate worktree. Defaults to a temporary directory. |
| `--manifest` | no | Path for the JSON evidence manifest, relative to the repository root. |
| `--skip-build` | no | Run Git/reference checks only. Use only while preparing or debugging a target branch. |

The command resolves refs to SHAs, verifies that every selected commit belongs to the source ref, creates an isolated worktree from the target base, cherry-picks the commits, checks for forbidden platform references, and runs the target branch's clean build, tests and package smoke checks.

A cherry-pick conflict stops the promotion. The command does not resolve conflicts or mutate an upstream branch. Review the candidate worktree, port the change manually when required, and rerun with the resulting commit.

The candidate is local until explicitly pushed:

```text
git -C <candidate-worktree> push origin <candidate-branch>
```

The maintainer opens the pull request against the correct upstream target branch.
