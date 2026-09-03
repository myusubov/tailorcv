import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const DOCKER_CONTAINERIZATION_SIGNAL_SCORES = {
  'docker-build-file': 4,
  'docker-compose-file': 4,
  'docker-bake-file': 3,
  'docker-ignore-file': 2,
  'devcontainer-config': 2,
} as const;

type DockerContainerizationSignal =
  keyof typeof DOCKER_CONTAINERIZATION_SIGNAL_SCORES;

/**
 * Adds `Containerization` candidates from Docker path evidence. Dockerfile,
 * Compose, and Bake files independently unlock emission; `.dockerignore` and
 * devcontainer configuration remain supporting score/evidence only and
 * cannot unlock emission alone or together.
 */
export function addDockerContainerizationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<DockerContainerizationSignal>({
    candidates,
    index,
    detectedArea: 'Containerization',
    primaryTech: 'Docker',
    signalScores: DOCKER_CONTAINERIZATION_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'docker-build-file',
        regex: /^(?:dockerfile|[^/]+\.dockerfile)(?:\.[^/]+)?$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'docker-ignore-file',
        regex: /^(?:\.dockerignore|[^/]+\.dockerfile\.dockerignore)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'docker-compose-file',
        regex: /^(?:docker-)?compose(?:\.[^/]+)?\.(?:yml|yaml)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'devcontainer-config',
        regex: /(^|\/)\.devcontainer\/devcontainer\.json$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'docker-bake-file',
        regex: /^docker-bake(?:\.override)?\.(?:hcl|json)$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: [
            'docker-build-file',
            'docker-compose-file',
            'docker-bake-file',
          ],
        },
      },
    },
  });
}
