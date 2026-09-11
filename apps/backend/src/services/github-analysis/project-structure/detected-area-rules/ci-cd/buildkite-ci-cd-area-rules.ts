import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only Buildkite signal contract for owner-scoped scoring.
 *
 * - `buildkite-pipeline-config` is the decisive anchor: the pipeline entrypoint
 *   `buildkite-agent pipeline upload` reads by default -- `.buildkite/pipeline.yml`
 *   or a root `buildkite.yml` (either extension). Scored high enough (`4`) to
 *   emit on its own.
 * - `buildkite-pipeline-steps` is corroborating structure: extra step files the
 *   entrypoint uploads, conventionally under `.buildkite/pipelines/**`. It never
 *   unlocks emission (see the gate) and its score (`2`) is below
 *   `MIN_AREA_SCORE`. Agent hooks (`.buildkite/hooks/*`) and tooling
 *   (`.buildkite/package.json`) are deliberately not matched.
 */
const BUILDKITE_CI_CD_SIGNAL_SCORES = {
  'buildkite-pipeline-config': 4,
  'buildkite-pipeline-steps': 2,
} as const;

type BuildkiteCiCdSignal = keyof typeof BUILDKITE_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for Buildkite pipeline configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `Buildkite` at owner path `.` (or contributes score/evidence and
 * rides along in `related` when an earlier-dispatched provider already claimed
 * `.`).
 *
 * Owner: always the repository root, however deep `.buildkite/pipelines/**`
 * nests -- Buildkite uploads every step into one repo pipeline, and all
 * `.buildkite/**` paths resolve to `.` through the generic owner resolver, so no
 * `ownerAdapter` is needed. Both regexes are anchored to `^`, which also
 * excludes vendored copies under `vendor/`, `third_party/`, `node_modules/` or
 * `deps/<pkg>/`.
 *
 * Gate: at least one `buildkite-pipeline-config` must be counted. A
 * `.buildkite/pipelines/` directory with no entrypoint does not emit.
 *
 * Limitations:
 * - Buildkite pipelines can be defined entirely in the Buildkite UI with no
 *   file in the repo; those repositories are not detectable from the tree.
 * - When an earlier-dispatched provider also owns `.`, it keeps the `primary`
 *   label; Buildkite is carried in `related`.
 * - Pipeline *contents* (steps, plugins, agents) are out of scope for path-only
 *   analysis.
 */
export function addBuildkiteCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<BuildkiteCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'Buildkite',
    signalScores: BUILDKITE_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'buildkite-pipeline-config',
        regex: /^(\.buildkite\/pipeline|buildkite)\.ya?ml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'buildkite-pipeline-steps',
        regex: /^\.buildkite\/pipelines\/.+\.ya?ml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'buildkite-pipeline-config',
        },
      },
    },
  });
}
