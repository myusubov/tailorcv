import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only GitHub Actions signal contract for owner-scoped scoring.
 *
 * - `github-actions-workflow` is the decisive anchor: a YAML file whose
 *   immediate parent is the repository-root `.github/workflows/` directory,
 *   which is the only location GitHub executes workflows from. Scored high
 *   enough (`4`) to emit on its own.
 * - `github-actions-composite-action` is a repo-local action definition
 *   (`.github/actions/<name>/action.yml`) consumed by those workflows.
 *   Corroborating evidence only; it never unlocks emission (see the gate) and
 *   its score (`2`) is below `MIN_AREA_SCORE`.
 */
const GITHUB_ACTIONS_CI_CD_SIGNAL_SCORES = {
  'github-actions-workflow': 4,
  'github-actions-composite-action': 2,
} as const;

type GithubActionsCiCdSignal = keyof typeof GITHUB_ACTIONS_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for GitHub Actions pipeline configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `GitHub Actions` at owner path `.`.
 *
 * Owner: always the repository root. Every `.github/**` path resolves to `.`
 * through the generic owner resolver, and GitHub only runs the root
 * `.github/workflows/`, so no `ownerAdapter` is needed. Both signal regexes are
 * anchored to `^\.github/`, which also excludes vendored copies under
 * `vendor/`, `third_party/`, `node_modules/` or `deps/<pkg>/` -- those belong to
 * a dependency and are never executed by the host repository.
 *
 * Non-signal files that legitimately live in `.github/workflows/` (`.sh`,
 * `.ps1`, `.json`, `.md`, sub-folders) are excluded by matching on the exact
 * `.github/workflows/<file>.yml|.yaml` shape (`[^/]+` forbids a nested path).
 *
 * Gate: at least one `github-actions-workflow` must be counted. A repo-local
 * composite action with no workflow does not emit.
 *
 * Limitations:
 * - When another CI/CD provider also owns `.`, the first provider detector
 *   dispatched wins the `primary` label. GitHub Actions is dispatched first, so
 *   it is the primary whenever present; other providers are carried in
 *   `related`.
 * - Workflow *contents* (triggers, jobs, deploy targets, matrix) are out of
 *   scope for path-only analysis and left to a later analyzer.
 */
export function addGithubActionsCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<GithubActionsCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'GitHub Actions',
    signalScores: GITHUB_ACTIONS_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'github-actions-workflow',
        regex: /^\.github\/workflows\/[^/]+\.ya?ml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'github-actions-composite-action',
        regex: /^\.github\/actions\/[^/]+\/action\.ya?ml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'github-actions-workflow',
        },
      },
    },
  });
}
