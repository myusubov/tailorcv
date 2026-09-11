import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only Bitbucket Pipelines signal contract for owner-scoped scoring.
 *
 * - `bitbucket-pipelines-config` is the only signal: a `bitbucket-pipelines.yml`
 *   at the repository root, the single file Bitbucket runs a pipeline from.
 *   Scored high enough (`4`) to emit on its own. Bitbucket Pipelines has no
 *   split-config or templating convention, so there is no support signal.
 */
const BITBUCKET_CI_CD_SIGNAL_SCORES = {
  'bitbucket-pipelines-config': 4,
} as const;

type BitbucketCiCdSignal = keyof typeof BITBUCKET_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for Bitbucket Pipelines configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `Bitbucket Pipelines` at owner path `.` (or contributes
 * score/evidence and rides along in `related` when an earlier-dispatched
 * provider already claimed `.`).
 *
 * Owner: always the repository root -- no `ownerAdapter`. The regex is anchored
 * to `^bitbucket-pipelines\.yml$`, so a nested copy does not match; Bitbucket
 * only executes the root file.
 *
 * Gate: at least one `bitbucket-pipelines-config` must be counted. With a
 * single signal this only formalizes "emit when the anchor is present".
 *
 * Limitations:
 * - When an earlier-dispatched provider also owns `.`, it keeps the `primary`
 *   label; Bitbucket Pipelines is carried in `related`.
 * - Pipeline *contents* (steps, caches, deployments) are out of scope for
 *   path-only analysis.
 */
export function addBitbucketCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<BitbucketCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'Bitbucket Pipelines',
    signalScores: BITBUCKET_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'bitbucket-pipelines-config',
        regex: /^bitbucket-pipelines\.yml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'bitbucket-pipelines-config',
        },
      },
    },
  });
}
