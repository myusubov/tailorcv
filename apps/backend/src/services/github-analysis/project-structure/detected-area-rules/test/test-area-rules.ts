import { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addJestTestAreas } from './jest-test-area-rules';
import { addVitestTestAreas } from './vitest-test-area-rules';
import { addPlaywrightTestAreas } from './playwright-test-area-rules';
import { addCypressTestAreas } from './cypress-test-area-rules';
import { addMochaTestAreas } from './mocha-test-area-rules';

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
