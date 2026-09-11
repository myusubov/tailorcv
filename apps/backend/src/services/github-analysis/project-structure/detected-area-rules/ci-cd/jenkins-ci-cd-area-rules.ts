import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

/**
 * Path-only Jenkins signal contract for owner-scoped scoring.
 *
 * - `jenkins-pipeline-file` is the only signal: a `Jenkinsfile` (any basename
 *   variant, such as `Jenkinsfile.release`), which is itself a complete
 *   pipeline definition -- there is no split-config convention. Scored high
 *   enough (`4`) to emit on its own, and marked as the anchor signal so
 *   `resolveUnitRootOwner` treats each match as its own unit root (see below).
 *
 * Unlike the root-only providers, a Jenkinsfile can legitimately live at any
 * depth (a root single-pipeline repo, or one per service in a multibranch
 * monorepo), so the regex cannot anchor to `^` the way GitHub Actions or
 * Travis do. Instead it excludes path segments that are almost always fixture
 * or vendored copies rather than real pipelines: `test/`, `tests/`,
 * `fixtures/`, `examples/` (Jenkinsfiles used as test data for a Jenkins
 * plugin or a docs repo) and the usual vendored set `vendor/`, `node_modules/`,
 * `third_party/`, `deps/`.
 */
const JENKINS_CI_CD_SIGNAL_SCORES = {
  'jenkins-pipeline-file': 4,
} as const;

type JenkinsCiCdSignal = keyof typeof JENKINS_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for Jenkins pipeline configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `Jenkins` for every owner that has a Jenkinsfile, or contributes
 * score/evidence and rides along in `related` for an owner an earlier-dispatched
 * provider already claimed.
 *
 * Owner: the directory containing each matched `Jenkinsfile`, via
 * `resolveUnitRootOwner` (a root `Jenkinsfile` resolves to `.`). This is the
 * only CI/CD provider that can emit more than one `CI/CD workflows` candidate
 * for a single repository -- the multibranch, per-service pipeline pattern.
 * (Azure Pipelines has an analogous per-directory `ci.yml` pattern but does not
 * detect it -- see that detector's Limitations.)
 *
 * Gate: at least one `jenkins-pipeline-file` must be counted. With a single
 * signal this only formalizes "emit when the anchor is present".
 *
 * Limitations:
 * - Jenkins shared libraries (`vars/*.groovy`) are consumed by pipelines
 *   elsewhere and are not themselves pipeline definitions; they are not matched
 *   by this pattern regardless.
 * - The fixture/vendored exclusion list is a heuristic, not path-position proof
 *   the way `^\.github\/` is for GitHub Actions -- a real pipeline nested under
 *   a directory that happens to be named `test` (unlikely, but possible) would
 *   be missed.
 * - When an earlier-dispatched provider also owns the same directory, it keeps
 *   the `primary` label there; Jenkins is carried in `related` for that owner.
 * - Pipeline *contents* (stages, agents, post actions) are out of scope for
 *   path-only analysis.
 */
export function addJenkinsCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<JenkinsCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'Jenkins',
    signalScores: JENKINS_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'jenkins-pipeline-file',
        regex:
          /^(?!.*(?:^|\/)(?:test|tests|fixtures|examples|vendor|node_modules|third_party|deps)\/)(?:.*\/)?jenkinsfile(?:\.[\w-]+)?$/,
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'jenkins-pipeline-file',
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
