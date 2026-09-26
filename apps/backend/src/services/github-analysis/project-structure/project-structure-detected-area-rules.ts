import { addBackendAreas } from './detected-area-rules/backend/backend-area-rules';
import { addCiCdAreas } from './detected-area-rules/ci-cd/ci-cd-area-rules';
import { addContainerizationAreas } from './detected-area-rules/containerization/containerization-area-rules';
import { addDatabaseAreas } from './detected-area-rules/database/database-area-rules';
import { addFrontendAreas } from './detected-area-rules/frontend/frontend-area-rules';
import { addInfrastructureAsCodeAreas } from './detected-area-rules/infrastructure-as-code/infrastructure-as-code-area-rules';
import { addMobileAreas } from './detected-area-rules/mobile/mobile-area-rules';
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
  addContainerizationAreas({ candidates, index });
  addCiCdAreas({ candidates, index });
  addMobileAreas({ candidates, index });
  addInfrastructureAsCodeAreas({ candidates, index });
}
