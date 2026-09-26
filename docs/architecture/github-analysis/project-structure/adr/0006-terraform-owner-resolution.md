# ADR 0006: Terraform Owner Resolution

- **Status:** Accepted
- **Date:** 2026-09-26
- **Domain:** `docs/architecture/github-analysis/project-structure/`
- **Related changelog entry:** [Infrastructure as Code Category, Terraform Detector, and Owner Resolver](../changelog.md#infrastructure-as-code-category-terraform-detector-and-owner-resolver)

---

## Context

Every detected area reports an owner path. [ADR 0003](0003-pluggable-owner-adapters-anchor-signals.md) made owner resolution a per-shape `ownerAdapter`, keyed on an anchor signal that sits at the unit root by the tool's own contract, and [ADR 0004](0004-containerization-owner-resolution.md) added a non-anchor adapter for Docker.

Terraform has no such anchor. Every directory holding a `.tf`, `.tofu`, or `terragrunt.hcl` file is an equally real Terraform directory, and a single repository can hold dozens. A tree survey of 1,802 GitHub repositories that contain Terraform files (48,604 such directories) showed what each existing option does:

- `resolveUnitRootOwner` treats every Terraform directory as its own owner. A registry module with one root module, two nested modules, thirteen examples, and three wrappers (`terraform-aws-modules/terraform-aws-vpc`) becomes 19 areas.
- The generic resolver returns `.` for most paths, so in the 949 surveyed repositories where Terraform is under 30% of the repository it swallowed the Terraform folder into the repo root 938 times. It also splits `modules/<name>` off the root because `modules` is a shared workspace root.
- Demo and test Terraform is common and is not the repository's infrastructure: 177 of the 1,802 repositories (9.8%) hold Terraform only under `examples`, `test`, `testdata`, `fixtures`, or `spec` (provider plugins, editors, and CLI tools), and a module repository's `examples/` would otherwise create a separate area per example.

## Decision

1. **Exclude demo and test paths in the detector's entry schemas, not in the owner adapter.** Every Terraform schema matches on the full path with a negative lookahead for a directory segment named `examples`, `example`, `tests`, `test`, `testdata`, `fixtures`, or `spec`, at any depth. An owner adapter can only return a path, so it cannot express "no area"; excluding upstream means those files never create a candidate.
2. **Add a dedicated non-anchor adapter, `resolveTerraformRootOwner({ path, rootHasTerraform })`** (`detected-area-rules/owner-adapters/resolve-terraform-root-owner.ts`), wired into the Terraform detector. The detector computes `rootHasTerraform` once per repository; when it is true, every Terraform path resolves to `.`. Otherwise the owner comes from folder names: a listed home folder or environment folder owns everything below it, `modules` and `wrappers` collapse into the enclosing owner, a workspace unit keeps its own Terraform, and anything else falls back to `ownerPathForApplicationArea`.
3. **Keep the folder-name lists deliberately small and case-insensitive**, and treat the unlisted-name gap as a known limitation rather than growing the lists to chase the long tail.

Future contributors should not move the demo/test exclusion into the adapter, or add `terraform`, `infra`, or `modules` to the shared `MONOREPO_OWNER_ROOT_DIRECTORIES` list, which would change every other detector's fallback.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Reuse `resolveUnitRootOwner` | Assumes one anchor per unit; over-splits registry modules and Terragrunt live repos (19 areas for the VPC module). |
| Keep the generic resolver | Cheap, but loses the Terraform folder in most repositories and over-splits `modules/<name>`. |
| Name-list adapter plus root flag (chosen) | Covers roughly 78% of surveyed repositories with simple rules; misses folders with unlisted names. |
| Tree-based adapter that climbs while a folder is mostly Terraform | Needs no folder names and handles the unlisted-name gap, but is more code and harder to test; deferred. It can use the `index` every adapter already receives. |

## Consequences

- A repository with a Terraform config file at its root is one area at `.`, including workspace units nested below it. In the survey this changed the answer for only 14 of 532 such repositories.
- A Terraform folder with an unlisted name (`aws/`, `cluster-setup/`) resolves to `.` and loses its location, about 8% of surveyed repositories. Several sibling stacks under an unlisted parent collapse into one area.
- A repository whose only Terraform is under a demo or test folder emits no area, which is intended.
- The lists were tuned on the survey sample, which is search-biased toward registry modules and tutorials and is not committed to the repository. They have not been tested on a held-out set.
- The resolver and detector tests were written 2026-09-26 and were not confirmed passing after the final `rootHasTerraform` change; three `it.todo` cases record the open gaps.

## References

- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-terraform-root-owner.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-terraform-root-owner.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/infrastructure-as-code/terraform-infrastructure-as-code-area-rules.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-detected-area-rules.test.ts`
