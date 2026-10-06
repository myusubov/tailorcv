import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

/**
 * Adds `Documentation` candidates for Dumi documentation sites.
 *
 * Scaffold: the detector is not implemented yet, so it adds no candidates.
 * Inputs: `context.candidates` and `context.index`, unused until the detector
 * lands.
 * Output: none.
 * Side effects: none.
 */
export function addDumiDocumentationAreas(
  _context: DetectedAreaRuleContext,
): void {}
