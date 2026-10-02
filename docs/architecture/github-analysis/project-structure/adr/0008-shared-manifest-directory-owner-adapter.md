# ADR 0008: Shared Manifest-Directory Owner Adapter for Helm and Pulumi

- **Status:** Accepted
- **Date:** 2026-10-01
- **Domain:** `docs/architecture/github-analysis/project-structure/`
- **Amends:** [ADR 0007](0007-helm-chart-owner-resolution.md) decision 1 (the adapter's name, location and sole user); decisions 2 to 4 stand.
- **Related changelog entry:** [Pulumi Detector and Shared Manifest-Directory Owner Adapter](../changelog.md#pulumi-detector-and-shared-manifest-directory-owner-adapter)
- **Amendment (2026-10-02):** The Ansible detector is a third user of the adapter. It has no single manifest file, so it passes a list derived from four anchors (see [Ansible Detector](../changelog.md#ansible-detector)); the adapter and decisions 1 to 4 are unchanged.

---

## Context

[ADR 0007](0007-helm-chart-owner-resolution.md) gave Helm a dedicated adapter driven by the directory of every counted `Chart.yaml`. Pulumi has the same shape: `Pulumi.yaml` is required at every project root, and Pulumi defines a project as the nearest parent folder that holds one.

A tree survey of 448 repositories (named Pulumi repositories, Pulumi-topic repositories, a random draw from code search for Pulumi file names, and 80 repositories found through dependency manifests) compared the available resolvers on the 289 repositories that emit an area. "Right" is the share of the 191 single-project repositories where the owner is the folder holding the `Pulumi.yaml`:

| Resolver | Areas | Right on single-project repos |
| -------- | ----- | ----------------------------- |
| Generic `ownerPathForApplicationArea` | 300 | 83 of 191 |
| `resolveTerraformRootOwner` folder-name lists | 1,139 | 141 of 191 |
| `resolveUnitRootOwner` with `Pulumi.yaml` as anchor | 3,317 | 191 of 191 |
| Helm-shaped manifest-directory resolver | 1,365 | 190 of 191 |

`resolveUnitRootOwner` finds the project folder every time but makes every project folder its own area, so five template, example and documentation repositories alone produce 2,097 areas. Folding nested and sibling projects, as the Helm resolver already did for subcharts and sibling charts, keeps the project folder and avoids that.

## Decision

1. **Share one adapter between Helm and Pulumi:** `resolveManifestDirectoryOwner({ path, manifestDirectories })` (`detected-area-rules/owner-adapters/resolve-manifest-directory-owner.ts`, exported from the adapters barrel). It replaces `resolveHelmChartOwner` with the same rules in the same order as ADR 0007 decision 2: workspace unit first, then a root manifest, then the shortest enclosing manifest directory with sibling folding, then an orphan's own directory. Each detector computes `manifestDirectories` once per repository from its own counted manifest regex (`Chart.yaml`, `Pulumi.yaml`).
2. **Pulumi uses it unchanged.** A Pulumi project folder owns its `Pulumi.yaml` and its stack files, a project nested inside another folds into it, and sibling projects collapse into their shared parent whatever its name.
3. **Pulumi gates on `Pulumi.yaml` alone,** which makes the exclusions load-bearing. The project-file regex rejects `.github/` and the empty `Pulumi.yaml` stubs that provider repositories generate under root `sdk/<language>/` and `provider/{cmd,pkg,test-programs}/`, and every schema keeps the shared demo and test exclusion. Requiring a stack file as well lost 91 of 289 repositories to remove 5 tool repositories.
4. **Keep one spec file per tool against the shared adapter,** named `resolve-manifest-directory-owner.<tool>.test.ts`, the same convention as the unit-root adapter's per-framework specs.

Future contributors should not give Pulumi `resolveUnitRootOwner`, which turns every project folder in a collection into an area; copy the adapter back into a per-tool file without a reason the other tool does not share; or drop the provider-stub lookahead while the gate is the anchor alone.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Dedicated `resolvePulumiProjectOwner` copied from the Helm resolver | Keeps tools independent, but duplicates about 40 lines whose rules must stay identical. |
| `resolveUnitRootOwner` with a `Pulumi.yaml` anchor | No new code and exact project folders, but one area per project folder (3,317 across the survey). |
| Terraform-style folder-name lists | Finds `infra/` and `pulumi/` only when listed; right on 141 of 191 single-project repositories. |
| Shared manifest-directory adapter (chosen) | One implementation and one set of rules; a change for one tool has to be checked against the other. |

## Consequences

- A change to the adapter affects Helm, Pulumi and Ansible at once, so all three spec files (`resolve-manifest-directory-owner.<tool>.test.ts`) must pass after it.
- Sibling folding applies to Pulumi: independent stacks in one folder (`deploy-lambda` and `infrastructure` at the repo root) become one area at `.`, recorded as an `it.todo`. A workspace container as the first segment hides the real project folder, recorded as an `it.fails.each` case.
- Enclosing and sibling checks are case-sensitive; only the workspace-container lookup ignores case.
- `Pulumi.yml` is not matched, which costs about 0.5% of projects, because lowercased paths cannot tell it from scanner rules and CI workflows.
- Documentation and test-program corpora under unlisted folder names still emit, and about 8 of 289 surveyed repositories are Pulumi tool repositories.
- The signal contract comes from a search-biased survey tuned and checked on the same repositories, with no held-out set. The survey data is not committed, and the Pulumi spec and the renamed Helm spec have not been run.

## References

- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-manifest-directory-owner.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-manifest-directory-owner.helm.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-manifest-directory-owner.pulumi.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/infrastructure-as-code/pulumi-infrastructure-as-code-area-rules.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/infrastructure-as-code/helm-infrastructure-as-code-area-rules.ts`
