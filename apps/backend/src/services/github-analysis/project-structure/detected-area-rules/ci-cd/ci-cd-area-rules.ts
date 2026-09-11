import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addAppveyorCiCdAreas } from './appveyor-ci-cd-area-rules';
import { addAzurePipelinesCiCdAreas } from './azure-pipelines-ci-cd-area-rules';
import { addBitbucketCiCdAreas } from './bitbucket-ci-cd-area-rules';
import { addBuildkiteCiCdAreas } from './buildkite-ci-cd-area-rules';
import { addCircleciCiCdAreas } from './circleci-ci-cd-area-rules';
import { addDroneWoodpeckerCiCdAreas } from './drone-woodpecker-ci-cd-area-rules';
import { addGithubActionsCiCdAreas } from './github-actions-ci-cd-area-rules';
import { addGitlabCiCdAreas } from './gitlab-ci-cd-area-rules';
import { addJenkinsCiCdAreas } from './jenkins-ci-cd-area-rules';
import { addTeamcityCiCdAreas } from './teamcity-ci-cd-area-rules';
import { addTravisCiCdAreas } from './travis-ci-cd-area-rules';

/**
 * Applies CI/CD-specific detected-area rules to the shared candidate map.
 *
 * Provider-specific rules live in sibling modules and emit `CI/CD workflows`
 * candidates for pipeline-as-code configuration. Owner resolution is the
 * repository root for every provider except Jenkins, which resolves each
 * `Jenkinsfile` to its own containing directory and so can produce more than
 * one owner per repository. Dispatch order below is provider precedence:
 * when two providers both claim the same owner, the first dispatched keeps
 * the `primary` technology label and later ones are carried in `related`.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: fans out to the provider detectors, which insert or update
 * `CI/CD workflows` candidates.
 */
export function addCiCdAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addGithubActionsCiCdAreas({ candidates, index });
  addGitlabCiCdAreas({ candidates, index });
  addCircleciCiCdAreas({ candidates, index });
  addJenkinsCiCdAreas({ candidates, index });
  addAzurePipelinesCiCdAreas({ candidates, index });
  addBuildkiteCiCdAreas({ candidates, index });
  addTravisCiCdAreas({ candidates, index });
  addBitbucketCiCdAreas({ candidates, index });
  addDroneWoodpeckerCiCdAreas({ candidates, index });
  addAppveyorCiCdAreas({ candidates, index });
  addTeamcityCiCdAreas({ candidates, index });
}
