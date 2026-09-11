import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only GitLab CI/CD signal contract for owner-scoped scoring.
 *
 * - `gitlab-ci-root-config` is the decisive anchor: a `.gitlab-ci.yml` at the
 *   repository root, which is the only path GitLab reads a pipeline from by
 *   default. Scored high enough (`4`) to emit on its own.
 * - `gitlab-ci-pipeline-include` is a split-out pipeline fragment under the
 *   community-convention `.gitlab/ci/` directory, pulled in via `include: local`.
 *   Corroborating evidence only; it never unlocks emission (see the gate) and
 *   its score (`2`) is below `MIN_AREA_SCORE`. `.gitlab/` also holds issue and
 *   merge-request templates, so only the `ci/` subtree is treated as pipeline
 *   config.
 */
const GITLAB_CI_CD_SIGNAL_SCORES = {
  'gitlab-ci-root-config': 4,
  'gitlab-ci-pipeline-include': 2,
} as const;

type GitlabCiCdSignal = keyof typeof GITLAB_CI_CD_SIGNAL_SCORES;

/**
 * Adds a `CI/CD workflows` candidate for GitLab CI/CD pipeline configuration.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `CI/CD workflows` candidate with primary
 * technology `GitLab CI/CD` at owner path `.` (or, when GitHub Actions already
 * claimed `.`, contributes score/evidence and rides along in `related`).
 *
 * Owner: always the repository root. The root `.gitlab-ci.yml` and every
 * `.gitlab/ci/**` fragment resolve to `.` through the generic owner resolver,
 * and GitLab only runs the root pipeline, so no `ownerAdapter` is needed. Both
 * regexes are anchored to `^`, which also excludes vendored copies under
 * `vendor/`, `third_party/`, `node_modules/` or `deps/<pkg>/` -- those belong to
 * a dependency and are never executed by the host project.
 *
 * The root config is matched as exactly `.gitlab-ci.yml`; GitLab does not accept
 * a `.yaml` extension or a nested path for the default pipeline file.
 *
 * Gate: at least one `gitlab-ci-root-config` must be counted. `.gitlab/ci/`
 * fragments with no root config do not emit.
 *
 * Limitations:
 * - The project-level custom CI config path override (Settings -> CI/CD) can
 *   point the pipeline at a non-root or differently named file. That setting is
 *   invisible from the tree, so such a repository is not detected.
 * - When GitHub Actions also owns `.`, it keeps the `primary` label because it
 *   is dispatched first; GitLab CI/CD is then carried in `related`.
 * - Pipeline *contents* (stages, jobs, rules, deploy targets) are out of scope
 *   for path-only analysis.
 */
export function addGitlabCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<GitlabCiCdSignal>({
    candidates,
    index,
    detectedArea: 'CI/CD workflows',
    primaryTech: 'GitLab CI/CD',
    signalScores: GITLAB_CI_CD_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'gitlab-ci-root-config',
        regex: /^\.gitlab-ci\.yml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'gitlab-ci-pipeline-include',
        regex: /^\.gitlab\/ci\/.+\.ya?ml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'gitlab-ci-root-config',
        },
      },
    },
  });
}
