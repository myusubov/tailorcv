import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addCypressTestAreas } from './cypress-test-area-rules';
import { addJestTestAreas } from './jest-test-area-rules';
import { addMochaTestAreas } from './mocha-test-area-rules';
import { addPlaywrightTestAreas } from './playwright-test-area-rules';
import { addVitestTestAreas } from './vitest-test-area-rules';

/**
 * Applies the Jest, Vitest, Playwright, Cypress and Mocha detectors, each of
 * which adds `Test suite` candidates to the shared map.
 *
 * Dispatch order is by expected popularity and carries no precedence: candidate
 * keys include the primary technology, so runners at the same owner coexist.
 */
export function addTestAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addJestTestAreas({ candidates, index });
  addVitestTestAreas({ candidates, index });
  addPlaywrightTestAreas({ candidates, index });
  addCypressTestAreas({ candidates, index });
  addMochaTestAreas({ candidates, index });
}
