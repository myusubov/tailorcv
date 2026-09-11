import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only Drone CI / Woodpecker CI signal contract for owner-scoped scoring.
 *
 * - `drone-woodpecker-config` is the only signal: a root `.drone.yml` /
 *   `.drone.yaml` (Drone), a root `.woodpecker.yml` / `.woodpecker.yaml`, or any
 *   file directly under a `.woodpecker/` directory (Woodpecker's multi-pipeline
 *   convention, same idea as Buildkite's `.buildkite/pipelines/`). Scored high
 *   enough (`4`) to emit on its own.
 */
const DRONE_WOODPECKER_CI_CD_SIGNAL_SCORES = {
  'drone-woodpecker-config': 4,
} as const;

type DroneWoodpeckerCiCdSignal =
  keyof typeof DRONE_WOODPECKER_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for Drone CI or Woodpecker CI
 * configuration (Woodpecker is a Drone fork sharing its file conventions).
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `Drone CI` at owner path `.` (or contributes score/evidence and
 * rides along in `related` when an earlier-dispatched provider already claimed
 * `.`).
 *
 * Owner: always the repository root -- no `ownerAdapter`. Every matched path
 * resolves to `.` through the generic owner resolver. The regex is anchored to
 * `^`, which also excludes vendored copies under `vendor/`, `third_party/`,
 * `node_modules/` or `deps/<pkg>/`; both tools read only the repository root.
 *
 * Gate: at least one `drone-woodpecker-config` must be counted. With a single
 * signal this only formalizes "emit when the anchor is present".
 *
 * Limitations:
 * - When an earlier-dispatched provider also owns `.`, it keeps the `primary`
 *   label; Drone/Woodpecker is carried in `related`.
 * - The `primary` label is always `Drone CI`, even for a Woodpecker-only
 *   repository -- split into two detectors later if that distinction needs to
 *   surface.
 * - Pipeline *contents* (steps, services, matrix) are out of scope for
 *   path-only analysis.
 */
export function addDroneWoodpeckerCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<DroneWoodpeckerCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'Drone CI',
    signalScores: DRONE_WOODPECKER_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'drone-woodpecker-config',
        regex: /^(\.drone\.ya?ml|\.woodpecker\.ya?ml|\.woodpecker\/[^/]+\.ya?ml)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'drone-woodpecker-config',
        },
      },
    },
  });
}
