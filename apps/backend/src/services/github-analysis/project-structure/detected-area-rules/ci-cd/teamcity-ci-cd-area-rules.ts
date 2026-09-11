import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only TeamCity signal contract for owner-scoped scoring.
 *
 * TeamCity's "Versioned Settings" feature is opt-in: most TeamCity setups keep
 * build configuration entirely on the server and leave nothing in the repo.
 * When it is enabled, TeamCity serializes the project into `.teamcity/` in one
 * of two formats.
 *
 * - `teamcity-kotlin-dsl-config` and `teamcity-xml-config` are the two anchors,
 *   one per format: the Kotlin DSL entrypoint (`.teamcity/settings.kts` plus
 *   the `.teamcity/pom.xml` that compiles it) or the legacy XML entrypoint
 *   (`.teamcity/**\/project-config.xml`, one per project/sub-project). Either
 *   is scored high enough (`4`) to emit on its own.
 * - `teamcity-build-type-source` and `teamcity-vcs-root-source` are
 *   corroborating structure: a build configuration or VCS root split into its
 *   own file, conventionally under a `buildTypes/` or `vcsRoots/` subfolder in
 *   either format. Neither unlocks emission (see the gate); each is scored low
 *   (`1`) because the gate already does the real gating -- these exist mainly
 *   so the evidence trail can show one build-type example and one VCS-root
 *   example separately rather than one generic exemplar path.
 */
const TEAMCITY_CI_CD_SIGNAL_SCORES = {
  'teamcity-kotlin-dsl-config': 4,
  'teamcity-xml-config': 4,
  'teamcity-build-type-source': 1,
  'teamcity-vcs-root-source': 1,
} as const;

type TeamcityCiCdSignal = keyof typeof TEAMCITY_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for JetBrains TeamCity versioned settings.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `TeamCity` at owner path `.` (or contributes score/evidence and
 * rides along in `related` when an earlier-dispatched provider already claimed
 * `.`).
 *
 * Owner: always the repository root -- no `ownerAdapter`. Every `.teamcity/**`
 * path resolves to `.` through the generic owner resolver. All four regexes are
 * anchored to `^\.teamcity\/`, which also excludes vendored copies under
 * `vendor/`, `third_party/`, `node_modules/` or `deps/<pkg>/`.
 *
 * Gate: at least one of the two anchors (`teamcity-kotlin-dsl-config` or
 * `teamcity-xml-config`) must be counted. Build-type or VCS-root files with no
 * entrypoint of either format do not emit.
 *
 * Limitations:
 * - Most TeamCity projects keep configuration server-side only (Versioned
 *   Settings is opt-in); those repositories have no `.teamcity/**` evidence at
 *   all and are not detectable from the tree, the same limitation as Buildkite.
 * - When an earlier-dispatched provider also owns `.`, it keeps the `primary`
 *   label; TeamCity is carried in `related`.
 * - Build *contents* (steps, triggers, dependencies) are out of scope for
 *   path-only analysis.
 */
export function addTeamcityCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<TeamcityCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'TeamCity',
    signalScores: TEAMCITY_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'teamcity-kotlin-dsl-config',
        regex: /^\.teamcity\/(settings\.kts|pom\.xml)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'teamcity-xml-config',
        regex: /^\.teamcity\/(.+\/)?project-config\.xml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'teamcity-build-type-source',
        regex: /^\.teamcity\/(.+\/)?buildtypes\/[^/]+\.(kt|xml)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'teamcity-vcs-root-source',
        regex: /^\.teamcity\/(.+\/)?vcsroots\/[^/]+\.(kt|xml)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: ['teamcity-kotlin-dsl-config', 'teamcity-xml-config'],
        },
      },
    },
  });
}
