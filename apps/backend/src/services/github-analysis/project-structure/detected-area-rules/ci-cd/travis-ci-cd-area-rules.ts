import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only Travis CI signal contract for owner-scoped scoring.
 *
 * - `travis-root-config` is the only signal: a `.travis.yml` at the repository
 *   root, the single file Travis reads a build from. Scored high enough (`4`) to
 *   emit on its own. Travis has no split-config or templating convention, so
 *   there is no support signal.
 */
const TRAVIS_CI_CD_SIGNAL_SCORES = {
  'travis-root-config': 4,
} as const;

type TravisCiCdSignal = keyof typeof TRAVIS_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for Travis CI configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `Travis CI` at owner path `.` (or contributes score/evidence and
 * rides along in `related` when an earlier-dispatched provider already claimed
 * `.`).
 *
 * Owner: always the repository root -- no `ownerAdapter`. The regex is anchored
 * to `^\.travis\.yml$`, so a nested `.travis.yml` (a vendored copy or an
 * abandoned leftover, never executed by Travis) does not match.
 *
 * Gate: at least one `travis-root-config` must be counted. With a single signal
 * this only formalizes "emit when the anchor is present".
 *
 * Limitations:
 * - When an earlier-dispatched provider also owns `.`, it keeps the `primary`
 *   label; Travis CI is carried in `related`.
 * - Build *contents* (language, stages, matrix, deploy) are out of scope for
 *   path-only analysis.
 */
export function addTravisCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<TravisCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'Travis CI',
    signalScores: TRAVIS_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'travis-root-config',
        regex: /^\.travis\.yml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'travis-root-config',
        },
      },
    },
  });
}
