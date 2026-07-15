import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForDockerContainerizationArea } from '../../project-structure-path-utils';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

type DockerContainerizationSignal =
  | 'docker-build-file'
  | 'docker-ignore-file'
  | 'docker-compose-file'
  | 'devcontainer-config'
  | 'docker-bake-file';

const DOCKER_CONTAINERIZATION_SIGNAL_SCORES = {
  'docker-build-file': 4,
  'docker-compose-file': 4,
  'docker-bake-file': 3,
  'docker-ignore-file': 2,
  'devcontainer-config': 2,
} satisfies AreaRuleSignalScores<DockerContainerizationSignal>;

function hasDockerContainerizationAreaShape(
  countedSignals: Set<DockerContainerizationSignal>,
): boolean {
  return false;
}

/**
 * Applies Docker containerization rules.
 * This scaffold reserves the Docker-specific detector boundary; concrete
 * path evidence and scoring gates will be added in a follow-up change.
 */
export function addDockerContainerizationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const dockerContainerizationAreasByOwner =
    createAreaRuleCandidateMap<DockerContainerizationSignal>();

  const dockerBuildFiles = index.findFilesByNameMatching({
    pattern: /^(?:dockerfile|[^/]+\.dockerfile)(?:\.[^/]+)?$/,
  });

  const dockerIgnoreFiles = index.findFilesByNameMatching({
    pattern: /^(?:\.dockerignore|[^/]+\.dockerfile\.dockerignore)$/,
  });

  const dockerComposeFiles = index.findFilesByNameMatching({
    pattern: /^(?:docker-)?compose(?:\.[^/]+)?\.(?:yml|yaml)$/,
  });

  const devcontainerConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)\.devcontainer\/devcontainer\.json$/,
  });

  const dockerBakeFiles = index.findFilesByNameMatching({
    pattern: /^docker-bake(?:\.override)?\.(?:hcl|json)$/,
  });

  for (const dockerBuildFile of dockerBuildFiles) {
    countAreaRuleSignal({
      areasByOwner: dockerContainerizationAreasByOwner,
      entry: dockerBuildFile,
      score: DOCKER_CONTAINERIZATION_SIGNAL_SCORES['docker-build-file'],
      signal: 'docker-build-file',
      resolveOwnerPath: ownerPathForDockerContainerizationArea
    });
  }

  for (const dockerIgnoreFile of dockerIgnoreFiles) {
    countAreaRuleSignal({
      areasByOwner: dockerContainerizationAreasByOwner,
      entry: dockerIgnoreFile,
      score: DOCKER_CONTAINERIZATION_SIGNAL_SCORES['docker-ignore-file'],
      signal: 'docker-ignore-file',
      resolveOwnerPath: ownerPathForDockerContainerizationArea
    });
  }

  for (const dockerComposeFile of dockerComposeFiles) {
    countAreaRuleSignal({
      areasByOwner: dockerContainerizationAreasByOwner,
      entry: dockerComposeFile,
      score: DOCKER_CONTAINERIZATION_SIGNAL_SCORES['docker-compose-file'],
      signal: 'docker-compose-file',
      resolveOwnerPath: ownerPathForDockerContainerizationArea
    });
  }

  for (const dockerBakeFile of dockerBakeFiles) {
    countAreaRuleSignal({
      areasByOwner: dockerContainerizationAreasByOwner,
      entry: dockerBakeFile,
      score: DOCKER_CONTAINERIZATION_SIGNAL_SCORES['docker-bake-file'],
      signal: 'docker-bake-file',
      resolveOwnerPath: ownerPathForDockerContainerizationArea
    })
  }

  for (const devcontainerConfigFile of devcontainerConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: dockerContainerizationAreasByOwner,
      entry: devcontainerConfigFile,
      score: DOCKER_CONTAINERIZATION_SIGNAL_SCORES['devcontainer-config'],
      signal: 'devcontainer-config',
      resolveOwnerPath: ownerPathForDockerContainerizationArea
    });
  }

  for (const [
    ownerPath,
    ownerCandidate,
  ] of dockerContainerizationAreasByOwner) {
    if (!hasDockerContainerizationAreaShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Containerization',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Docker',
      relatedTechnologies: [],
    });
  }
}
