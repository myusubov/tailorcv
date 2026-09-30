# ADR 0007: Helm Chart Owner Resolution

- **Status:** Accepted
- **Date:** 2026-09-30
- **Domain:** `docs/architecture/github-analysis/project-structure/`
- **Related changelog entry:** [Helm Detector, Helm Chart Owner Resolver, and Shared Demo and Test Exclusion](../changelog.md#helm-detector-helm-chart-owner-resolver-and-shared-demo-and-test-exclusion)

---

## Context

Every detected area reports an owner path. [ADR 0003](0003-pluggable-owner-adapters-anchor-signals.md) made owner resolution a per-shape `ownerAdapter`, and [ADR 0006](0006-terraform-owner-resolution.md) added a folder-name adapter for Terraform, which has no per-unit anchor file.

Helm is different. Helm requires the exact filename `Chart.yaml` at every chart root, so there is a real per-unit anchor, but the chart root is not always the area a reader expects. A tree survey of about 130 GitHub repositories (named chart collections and tool repositories such as bitnami/charts, prometheus-community/helm-charts, helm/charts, hashicorp/vault-helm, apache/airflow and argoproj/argo-cd, plus a random sample from GitHub code search for `Chart.yaml`) showed what each existing option does:

- `resolveUnitRootOwner` would treat every `Chart.yaml` directory as its own owner. A chart collection with dozens of sibling charts becomes dozens of areas, and a chart with CRD subcharts becomes several areas for one chart.
- The generic resolver returns `.` for most paths, so a chart at `production/helm/loki` or `deploy/charts/cert-manager` loses its location.
- A Terraform-style folder-name list does not fit: the parent of a chart collection is named anything (`charts`, `bitnami`, `stable`, `elasticsearch` at the repo root).
- Charts under `testdata` and `examples` are not the repository's own deployment: every one of helm/helm's 234 chart directories sits under `testdata`.

## Decision

1. **Add a dedicated adapter, `resolveHelmChartOwner({ path, chartDirectories })`** (`detected-area-rules/owner-adapters/resolve-helm-chart-owner.ts`), wired into the Helm detector as a plain per-entry `ownerAdapter` with no anchor schema. The detector computes `chartDirectories` once per repository: the directory of every counted `Chart.yaml`, `.` for a root chart. The adapter needs that whole list because the right owner for one file depends on which other charts exist.
2. **Resolve ownership in a fixed order, first match wins:** a workspace unit (`apps/<name>`, `services/<name>`, ...) owns every chart below it, even beneath a root chart; otherwise a root chart owns everything; otherwise the nearest owner is the shortest chart directory enclosing the path, so a subchart folds into its enclosing chart whatever the folder between them is called; when another chart directory shares that owner's parent, the owner is that parent (`.` for a root-level parent), so sibling charts collapse into their shared parent whatever its name; a path enclosed by no chart (an orphan companion) resolves to its own directory so it can never share an owner with a manifest.
3. **Gate on the manifest AND at least one companion** (`templates/`, `values.yaml`, `.helmignore`, `Chart.lock`). Paths are lowercased before matching, so `Chart.yaml` collides with a GitHub Actions workflow named `chart.yaml`, and a manifest-only directory in the survey was always a fixture or a CRD-only subchart. The companions alone never emit, since `values.yaml` and `templates/` are common outside Helm.
4. **Share the demo and test exclusion** with Terraform through `infrastructure-as-code/demo-and-test-folders.ts`. It stays in the entry schemas for the reason recorded in ADR 0006: an owner adapter can only return a path, so it cannot express "no area".

Future contributors should not switch Helm to `resolveUnitRootOwner`, which would turn every chart directory into its own area; move the demo/test exclusion into the adapter; or reorder the unit and root-chart rules without revisiting the contrast with Terraform, where a root module wins over workspace units.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Reuse `resolveUnitRootOwner` with a `Chart.yaml` anchor | Matches Helm's per-unit anchor, but over-splits collections and subcharts and cannot see other charts. |
| Keep the generic resolver | Cheap, but loses a chart's location outside the repo root and workspace units. |
| Folder-name list and root flag, as for Terraform | Helm collections live under parents with arbitrary names, so a list cannot cover them. |
| Per-repo `chartDirectories` adapter (chosen) | Folds subcharts and collapses siblings from the charts actually present; needs one extra scan per repository. |

## Consequences

- A chart nested inside another chart folds into it, and sibling top-level charts under one parent become one area. Independent applications under one folder (`helm/api` and `helm/web` in an application repository) also collapse into one area; the resolver spec records this as an undecided judgment call.
- Enclosing and sibling checks are case-sensitive; only the workspace-container lookup ignores case, and the returned owner keeps the path's casing.
- The signal contract and scores come from a search-biased survey tuned and checked on the same repositories, with no held-out set. The survey data is not committed.
- Six `it.todo` cases in `resolve-helm-chart-owner.test.ts` record layouts not yet decided (nested sibling-holding parents, collections with unrelated parents, independent apps under one parent, an orphan at `.`, a chart directly in a workspace container, a lone chart under a home folder).
- The resolver and detector tests were written 2026-09-30 and have not been confirmed passing.

## References

- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-helm-chart-owner.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/owner-adapters/resolve-helm-chart-owner.test.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/infrastructure-as-code/helm-infrastructure-as-code-area-rules.ts`
- `apps/backend/src/services/github-analysis/project-structure/detected-area-rules/infrastructure-as-code/demo-and-test-folders.ts`
- `apps/backend/src/services/github-analysis/project-structure/project-structure-detected-area-rules.test.ts`
