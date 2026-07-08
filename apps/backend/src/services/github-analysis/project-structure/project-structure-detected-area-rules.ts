import { addBackendAreas } from './detected-area-rules/backend/backend-area-rules';
import { addDatabaseAreas } from './detected-area-rules/database/database-area-rules';
import { addFrontendAreas } from './detected-area-rules/frontend/frontend-area-rules';
import { addSharedPackageAreas } from './detected-area-rules/shared-package/shared-package-area-rules';
import type { DetectedAreaRuleContext } from './project-structure-detected-areas.types';

/**
 * Applies every detected-area rule group to the shared candidate map.
 * Rule groups are kept in feature-specific modules so each area can evolve independently.
 */
export function applyDetectedAreaRules({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addFrontendAreas({ candidates, index });
  addBackendAreas({ candidates, index });
  addDatabaseAreas({ candidates, index });
  addSharedPackageAreas({ candidates, index });
}
