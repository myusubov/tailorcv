import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only Azure Pipelines signal contract for owner-scoped scoring.
 *
 * - `azure-root-config` is the decisive anchor: a root `azure-pipelines.yml` /
 *   `azure-pipelines-*.yml`, or an `.azure-pipelines/` / `build/azure-pipelines/`
 *   folder variant seen in the wild (e.g. vscode). Scored high enough (`4`) to
 *   emit on its own.
 * - `azure-template` is corroborating structure: shared pipeline templates
 *   pulled in via `extends`/`template:`, conventionally under `eng/pipelines/**`.
 *   It never unlocks emission (see the gate) and its score (`2`) is below
 *   `MIN_AREA_SCORE`.
 *
 * Deliberately not matched: a per-directory `<dir>/ci.yml` (the azure-sdk
 * pattern of ~150 independently registered pipelines). `ci.yml` is too weak a
 * basename to trust path-only -- scaffolding templates and test fixtures use it
 * too, and there is no cheap path-only corroboration for it: requiring a
 * sibling root `azure-pipelines.yml` does not work because the repos that use
 * this pattern often have no root file at all (the per-directory files are the
 * whole setup), and requiring a specific parent directory name does not
 * generalize beyond the one repo it was observed in. See Limitations.
 */
const AZURE_PIPELINES_CI_CD_SIGNAL_SCORES = {
  'azure-root-config': 4,
  'azure-template': 2,
} as const;

type AzurePipelinesCiCdSignal =
  keyof typeof AZURE_PIPELINES_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for Azure Pipelines configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `Azure Pipelines` at owner path `.` (or contributes score/evidence
 * and rides along in `related` when an earlier-dispatched provider already
 * claimed `.`).
 *
 * Owner: always the repository root -- no `ownerAdapter`. Every matched path
 * resolves to `.` through the generic owner resolver.
 *
 * Gate: at least one `azure-root-config` must be counted. Shared templates with
 * no root entrypoint do not emit.
 *
 * Limitations:
 * - The per-directory `<dir>/ci.yml` multi-owner pattern (the azure-sdk repos)
 *   is not detected. Unlike Jenkins's `Jenkinsfile`, `ci.yml` is not a
 *   distinctive enough basename to trust from its path alone, and no cheap
 *   path-only corroboration is available (see the signal contract doc above).
 *   This is a deliberate accepted gap, not an oversight -- the same category as
 *   GitLab's custom CI config-path override or TeamCity/Buildkite's UI-only
 *   setups.
 * - When an earlier-dispatched provider also owns `.`, it keeps the `primary`
 *   label; Azure Pipelines is carried in `related`.
 * - Pipeline *contents* (stages, jobs, templates) are out of scope for
 *   path-only analysis.
 */
export function addAzurePipelinesCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<AzurePipelinesCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'Azure Pipelines',
    signalScores: AZURE_PIPELINES_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'azure-root-config',
        regex:
          /^(azure-pipelines(-.+)?\.yml|(\.azure-pipelines|build\/azure-pipelines)\/.+\.yml)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'azure-template',
        regex: /^eng\/pipelines\/.+\.yml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'azure-root-config',
        },
      },
    },
  });
}
