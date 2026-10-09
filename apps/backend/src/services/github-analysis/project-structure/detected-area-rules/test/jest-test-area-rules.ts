import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { excludingNonTestProjectFolders } from './non-test-project-folders';

// Every signal scores 3, the emission floor, so any one opens the gate.
// Deliberately not scored: __tests__, __mocks__, __snapshots__, setupTests.*,
// *.test.*, *.spec.* and test/tests folders. Vitest-only repos carry them as
// often as Jest repos.
const JEST_TEST_SIGNAL_SCORES = {
  'jest-config': 3,
  'jest-config-variant': 3,
  'jest-setup-file': 3,
} as const;

type JestTestSignal = keyof typeof JEST_TEST_SIGNAL_SCORES;

/**
 * Adds `Test suite` candidates with primary technology `Jest`.
 *
 * Owners resolve through `resolveUnitRootOwner`, anchored on `jest.config.*`,
 * so a config owns its own folder and nested or sibling projects stay
 * separate. A variant config or a setup file also opens the gate, which finds
 * repos that keep their config in `package.json`. A `"jest"` key with neither
 * file is invisible to a path-only analyzer.
 *
 * Known gaps: a config inside `config/` or `test/` owns that folder instead of
 * the project root, and a variant file in a non-workspace folder resolves to
 * `.`. Tool repos that keep fixture projects outside the excluded folder names
 * emit one area per fixture.
 */
export function addJestTestAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<JestTestSignal>({
    candidates,
    index,
    detectedArea: 'Test suite',
    primaryTech: 'Jest',
    signalScores: JEST_TEST_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'jest-config',
        regex: excludingNonTestProjectFolders(
          String.raw`(?:.*/)?jest\.config\.(?:[cm]?[jt]s|json)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        // Configs passed with `--config`; NestJS ships `test/jest-e2e.json`
        // while its real config sits in `package.json`.
        signalType: 'jest-config-variant',
        regex: excludingNonTestProjectFolders(
          String.raw`(?:.*/)?(?:jest\.config\.[\w.-]+\.(?:[cm]?[jt]s|json)|jest[.-](?:e2e|unit|integration|int|base|shared|common)\.(?:config\.)?(?:[cm]?[jt]s|json)|jest\.[\w-]+\.config\.(?:[cm]?[jt]s|json)|jest-e2e\.json|jest\.preset\.[cm]?[jt]s)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        // Scored 3, not 2: a lone companion at 2 falls under the floor.
        signalType: 'jest-setup-file',
        regex: excludingNonTestProjectFolders(
          String.raw`(?:.*/)?(?:jest[.-]setup|jest[.-]?setup[-.]?\w*|setup-?jest|setupjest|jest\.polyfills?|jest[.-]?global[.-]?setup|jest\.env|jest\.init)\.(?:[cm]?[jt]sx?)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: ['jest-config', 'jest-config-variant', 'jest-setup-file'],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
