import { addFrontendAreas } from './detected-area-rules/frontend/frontend-area-rules';
import type { DetectedAreaRuleContext } from './project-structure-detected-areas.types';

/**
 * Applies every detected-area rule group to the shared candidate map.
 * Rule groups are kept in feature-specific modules so each area can evolve independently.
 */
export function applyDetectedAreaRules({
  entries,
  candidates,
}: DetectedAreaRuleContext): void {
  addFrontendAreas({ entries, candidates });
}
