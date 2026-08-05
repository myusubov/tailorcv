import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addAngularFrontendAreas } from './angular-frontend-area-rules';
import { addAstroFrontendAreas } from './astro-frontend-area-rules';
import { addNextFrontendAreas } from './next-frontend-area-rules';
import { addNuxtFrontendAreas } from './nuxt-frontend-area-rules';
import { addReactFrontendAreas } from './react-frontend-area-rules';
import { addReactRouterFrontendAreas } from './react-router-frontend-area-rules';
import { addStaticFrontendAreas } from './static-frontend-area-rules';
import { addSvelteFrontendAreas } from './svelte-frontend-area-rules';
import { addSvelteKitFrontendAreas } from './sveltekit-frontend-area-rules';
import { addVueFrontendAreas } from './vue-frontend-area-rules';

/**
 * Applies frontend-specific detected-area rules.
 * Framework-specific rules live in separate modules and all emit `Frontend app` candidates.
 */
export function addFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addNextFrontendAreas({ candidates, index });
  addNuxtFrontendAreas({ candidates, index });
  addVueFrontendAreas({ candidates, index });
  addReactRouterFrontendAreas({ candidates, index });
  addReactFrontendAreas({ candidates, index });
  addAngularFrontendAreas({ candidates, index });
  addSvelteKitFrontendAreas({ candidates, index });
  addSvelteFrontendAreas({ candidates, index });
  addAstroFrontendAreas({ candidates, index });
  addStaticFrontendAreas({ candidates, index });
}
