import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only CircleCI signal contract for owner-scoped scoring.
 *
 * - `circleci-root-config` is the decisive anchor: `.circleci/config.yml` at the
 *   repository root, the only file CircleCI runs a pipeline from. Scored high
 *   enough (`4`) to emit on its own.
 * - `circleci-config-source` is corroborating structure that only exists around
 *   a real CircleCI setup: packed-config source under `.circleci/src/**` that
 *   `circleci config pack` compiles into `config.yml`, and the
 *   `.circleci/continue_config.yml` continuation file used by dynamic config.
 *   It never unlocks emission (see the gate) and its score (`2`) is below
 *   `MIN_AREA_SCORE`. Scripts, caches and READMEs that also live in
 *   `.circleci/` are deliberately not matched.
 */
const CIRCLECI_CI_CD_SIGNAL_SCORES = {
  'circleci-root-config': 4,
  'circleci-config-source': 2,
} as const;

type CircleciCiCdSignal = keyof typeof CIRCLECI_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for CircleCI pipeline configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `CircleCI` at owner path `.` (or contributes score/evidence and
 * rides along in `related` when an earlier-dispatched provider already claimed
 * `.`).
 *
 * Owner: always the repository root. CircleCI reads only the root `.circleci/`
 * directory, and every `.circleci/**` path resolves to `.` through the generic
 * owner resolver, so no `ownerAdapter` is needed. Both regexes are anchored to
 * `^`, which also excludes vendored copies under `vendor/`, `third_party/`,
 * `node_modules/` or `deps/<pkg>/` -- a dependency's own config that CircleCI
 * never executes for the host project.
 *
 * The root config is matched as exactly `.circleci/config.yml`; CircleCI does
 * not accept a `.yaml` extension for the entry file.
 *
 * Gate: at least one `circleci-root-config` must be counted. Packed-config
 * source or a stray continuation file with no root `config.yml` does not emit.
 *
 * Limitations:
 * - When an earlier-dispatched provider (GitHub Actions, GitLab CI/CD) also
 *   owns `.`, it keeps the `primary` label; CircleCI is carried in `related`.
 * - Pipeline *contents* (jobs, workflows, orbs, executors) are out of scope for
 *   path-only analysis.
 */
export function addCircleciCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<CircleciCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'CircleCI',
    signalScores: CIRCLECI_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'circleci-root-config',
        regex: /^\.circleci\/config\.yml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'circleci-config-source',
        regex: /^\.circleci\/(src\/.+\.ya?ml|continue[_-]config\.ya?ml)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'circleci-root-config',
        },
      },
    },
  });
}
