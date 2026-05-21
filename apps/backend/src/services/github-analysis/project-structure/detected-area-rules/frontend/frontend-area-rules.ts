import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addGenericFrontendAreas } from './generic-frontend-area-rules';
import { addNextFrontendAreas } from './next-frontend-area-rules';

/**
 * Applies frontend-specific detected-area rules.
 * Framework-specific rules live in separate modules and all emit `Frontend app` candidates.
 */
export function addFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addNextFrontendAreas({ candidates, index });
  addGenericFrontendAreas({ candidates, index });
}
