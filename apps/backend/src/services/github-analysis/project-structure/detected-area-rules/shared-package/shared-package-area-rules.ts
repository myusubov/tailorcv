import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addJsTsSharedPackageAreas } from './js-ts-shared-package-area-rules';

/**
 * Applies shared-package detected-area rules.
 * Language-specific rules live in separate modules and all emit `Shared package`
 * candidates for reusable workspace package areas.
 */
export function addSharedPackageAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addJsTsSharedPackageAreas({ candidates, index });
}
