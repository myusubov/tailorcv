import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addAspNetCoreBackendAreas } from './asp-net-core-backend-area-rules';
import { addDjangoBackendAreas } from './django-backend-area-rules';
import { addGenericBackendAreas } from './generic-backend-area-rules';
import { addLaravelBackendAreas } from './laravel-backend-area-rules';
import { addNestBackendAreas } from './nest-backend-area-rules';
import { addRailsBackendAreas } from './rails-backend-area-rules';
import { addSpringBootBackendAreas } from './spring-boot-backend-area-rules';

/**
 * Applies backend-specific detected-area rules.
 * Framework-specific detectors run before the generic backend fallback.
 */
export function addBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addNestBackendAreas({ candidates, index });
  addDjangoBackendAreas({ candidates, index });
  addSpringBootBackendAreas({ candidates, index });
  addAspNetCoreBackendAreas({ candidates, index });
  addLaravelBackendAreas({ candidates, index });
  addRailsBackendAreas({ candidates, index });
  addGenericBackendAreas({ candidates, index });
};