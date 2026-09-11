import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only AppVeyor signal contract for owner-scoped scoring.
 *
 * - `appveyor-root-config` is the only signal: a root `appveyor.yml` or
 *   `.appveyor.yml`, the single file AppVeyor reads a build from. Scored high
 *   enough (`4`) to emit on its own. AppVeyor has no split-config or
 *   per-directory convention, so there is no support signal.
 */
const APPVEYOR_CI_CD_SIGNAL_SCORES = {
  'appveyor-root-config': 4,
} as const;

type AppveyorCiCdSignal = keyof typeof APPVEYOR_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for AppVeyor configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `AppVeyor` at owner path `.` (or contributes score/evidence and
 * rides along in `related` when an earlier-dispatched provider already claimed
 * `.`).
 *
 * Owner: always the repository root -- no `ownerAdapter`. The regex is anchored
 * to `^(\.)?appveyor\.yml$`, so a nested `appveyor.yml` does not match. This is
 * the highest vendored-false-positive-risk provider of the eleven: real
 * examples include `vendor/k8s.io/**\/appveyor.yml` in Kubernetes and
 * `deps/**\/.appveyor.yml` in Node.js -- bundled dependencies carrying their own
 * leftover CI config that the host repository never runs. The root anchor is
 * the whole defense against that shape.
 *
 * Gate: at least one `appveyor-root-config` must be counted. With a single
 * signal this only formalizes "emit when the anchor is present".
 *
 * Limitations:
 * - AppVeyor projects can be configured entirely through its own UI with no
 *   file in the repo; those repositories are not detectable from the tree.
 * - When an earlier-dispatched provider also owns `.`, it keeps the `primary`
 *   label; AppVeyor is carried in `related`.
 * - Build *contents* (image, matrix, deploy) are out of scope for path-only
 *   analysis.
 */
export function addAppveyorCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<AppveyorCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'AppVeyor',
    signalScores: APPVEYOR_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'appveyor-root-config',
        regex: /^(\.)?appveyor\.yml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'appveyor-root-config',
        },
      },
    },
  });
}
