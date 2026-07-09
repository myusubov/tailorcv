import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addDockerContainerizationAreas } from './docker-containerization-area-rules';

/**
 * Applies containerization-specific detected-area rules.
 * Runtime-specific rules live in separate modules and emit `Containerization`
 * candidates for container build/runtime configuration areas.
 */
export function addContainerizationAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addDockerContainerizationAreas({ candidates, index });
}
