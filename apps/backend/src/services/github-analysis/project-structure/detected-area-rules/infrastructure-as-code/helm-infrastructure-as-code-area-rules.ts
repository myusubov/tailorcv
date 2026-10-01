import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveManifestDirectoryOwner } from '../owner-adapters';
import { excludingDemoAndTestFolders } from './demo-and-test-folders';

/**
 * Path-only Helm chart signal contract, grounded in the Helm chart-structure
 * docs and a GitHub-tree survey of about 130 real repositories (23 named
 * chart collections and tool repos such as bitnami/charts,
 * prometheus-community/helm-charts, helm/charts, hashicorp/vault-helm,
 * apache/airflow, helm/helm and argoproj/argo-cd, plus a random 110-repo
 * sample of repositories returned by GitHub code search for `Chart.yaml`):
 * - `helm-chart-manifest` (`Chart.yaml`): the anchor. Helm requires the exact
 *   filename at every chart root, so unlike most detectors in this domain
 *   there is a per-unit anchor. It scores `3`, the emission floor, and does
 *   not emit alone (see the gate). Two exclusions:
 *   demo/test folders (helm/helm has 234 charts, all under `testdata`), and
 *   `.github/`, because a GitHub Actions workflow named `chart.yaml` exists in
 *   real repositories (kubernetes/ingress-nginx, pluralsh/bootstrap). Paths are
 *   lowercased before matching, so `chart.yaml` and Helm's case-sensitive
 *   `Chart.yaml` cannot be told apart here.
 * - `helm-templates` (any file under a `templates/` directory): support,
 *   scored `2`. Sits beside 86% of `Chart.yaml` files in the named-repo survey
 *   and is the strongest companion, since it is the chart's bundled manifests.
 *   Library charts carry only `_*.tpl` helpers there, which still count.
 * - `helm-values-file` (`values.yaml`): support, `1`. Beside 90% of
 *   `Chart.yaml` files, but also a common orphan (helmfile and OpenTelemetry
 *   example folders), so it can never open the gate without the anchor.
 * - `helm-ignore-file` (`.helmignore`): support, `1`. Beside 63%; `helm create`
 *   generates it.
 * - `helm-chart-lock` (`Chart.lock`): support, `1`. Beside 16%; exists only
 *   after `helm dependency update` was run and committed.
 *
 * Deliberately not scored: `values.schema.json`, `crds/` and `_helpers.tpl`
 * add nothing beyond `templates/` and `values.yaml`; `requirements.yaml` is
 * Helm 2 (`apiVersion: v1`) only and too generic a filename; Helmfile
 * (`helmfile.yaml`) is a separate tool and is left for a later pass.
 */
const HELM_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES = {
  'helm-chart-manifest': 3,
  'helm-templates': 2,
  'helm-values-file': 1,
  'helm-ignore-file': 1,
  'helm-chart-lock': 1,
} as const;

type HelmInfrastructureAsCodeSignal =
  keyof typeof HELM_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES;

/**
 * Matches a counted `Chart.yaml`. Shared by the manifest entry schema and the
 * chart-directory lookup so both always agree on which manifests count.
 */
const HELM_CHART_MANIFEST_REGEX = excludingDemoAndTestFolders(
  String.raw`(?!\.github/)(?:.*/)?chart\.yaml`,
);

/**
 * Adds an `Infrastructure as code` candidate for Helm chart evidence.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates an `Infrastructure as code` candidate
 * with primary technology `Helm` and related technology `Kubernetes` for every
 * owner whose counted signals clear the gate. Candidates are keyed per primary
 * technology, so a Terraform candidate on the same owner path is kept beside
 * it.
 *
 * Exclusion: every schema matches on the full path and rejects any path with a
 * whole demo/test directory segment (`excludingDemoAndTestFolders`), at any
 * depth, so files there contribute no signal, score or evidence. The manifest
 * schema also rejects anything under `.github/`.
 *
 * Gate: `helm-chart-manifest` AND at least one of `helm-templates`,
 * `helm-values-file`, `helm-ignore-file` or `helm-chart-lock`. Unlike
 * Terraform's plain OR, the anchor alone is not enough: `Chart.yaml` is
 * exact, but its lowercased form collides with workflow files, and a
 * manifest-only directory in the survey was always a test fixture or a
 * CRD-only subchart. The companions alone never emit either, since
 * `values.yaml` and `templates/` are common outside Helm.
 *
 * Owner: `resolveManifestDirectoryOwner` (`owner-adapters/`, shared with the
 * Pulumi detector), wired as a plain per-entry `ownerAdapter`. The directory
 * of every counted `Chart.yaml` is computed once per call and passed in, so a
 * chart's companions resolve to the same owner as its manifest, which the gate
 * depends on. Subcharts fold into their enclosing chart, sibling top-level
 * charts collapse into their shared parent directory, and a workspace unit
 * owns every chart below it.
 *
 * Limitations:
 * - Path-only: chart contents (`type: library`, dependencies, the Kubernetes
 *   kinds it renders) are not read.
 * - `Chart.yaml` case cannot be checked, see the signal contract.
 * - Evidence keeps the first path seen per signal, and tree order is
 *   alphabetical, so a chart's `ci/values.yaml` can be listed instead of its
 *   root `values.yaml`.
 * - The signal contract and scores come from a search-biased survey tuned and
 *   checked on the same repositories, with no held-out set. A first research
 *   pass, like every other detector in this domain at this stage.
 */
export function addHelmInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  // Directory of every counted Chart.yaml; a root manifest has no parent path,
  // so it maps to the repo root, `.`.
  const chartDirectories = index
    .findEntriesByPathMatching({ pattern: HELM_CHART_MANIFEST_REGEX })
    .map((entry) => entry.parentPath ?? '.');

  applyDeclarativeAreaDetector<HelmInfrastructureAsCodeSignal>({
    candidates,
    index,
    detectedArea: 'Infrastructure as code',
    primaryTech: 'Helm',
    relatedTechs: ['Kubernetes'],
    signalScores: HELM_INFRASTRUCTURE_AS_CODE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'helm-chart-manifest',
        regex: HELM_CHART_MANIFEST_REGEX,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'helm-templates',
        regex: excludingDemoAndTestFolders(String.raw`(?:.*/)?templates/.+`),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'helm-values-file',
        regex: excludingDemoAndTestFolders(String.raw`(?:.*/)?values\.yaml`),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'helm-ignore-file',
        regex: excludingDemoAndTestFolders(String.raw`(?:.*/)?\.helmignore`),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'helm-chart-lock',
        regex: excludingDemoAndTestFolders(String.raw`(?:.*/)?chart\.lock`),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'helm-chart-manifest',
          hasOneOf: [
            'helm-templates',
            'helm-values-file',
            'helm-ignore-file',
            'helm-chart-lock',
          ],
        },
      },
    },
    ownerAdapter: ({ path }) =>
      resolveManifestDirectoryOwner({
        path,
        manifestDirectories: chartDirectories,
      }),
  });
}
