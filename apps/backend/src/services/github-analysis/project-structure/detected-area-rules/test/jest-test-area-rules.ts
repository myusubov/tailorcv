import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const JEST_TEST_SIGNAL_SCORES = {
  'jest-config-file': 3,
  'jest-setup-file': 2,
  'jest-setup-tests-file': 1,
  'jest-tests-directory': 1,
  'jest-mocks-directory': 2,
  'jest-snapshots-directory': 2,
  'jest-test-file': 1,
} as const;

type JestTestSignal = keyof typeof JEST_TEST_SIGNAL_SCORES;

/**
 * Adds `Test suite` candidates from Jest path evidence.
 * `jest.config.*` is the only path-only signal that names Jest unambiguously,
 * so it unlocks alone. Every other signal is a convention Jest shares with at
 * least one other runner (`__tests__`, `*.test.*`, and `setupTests.*` are also
 * used by Vitest/AVA/CRA-with-Vitest; `__snapshots__` is deliberately mirrored
 * by Vitest for migration compatibility), so none of them may unlock alone.
 * Two narrower combinations still stand in for a missing config file:
 * - `jest.setup.*`/`jest-setup.*` literally names Jest in the filename, but a
 *   stale or migrated-away setup file could remain with no active tests, so
 *   it only counts when paired with at least one other piece of real test
 *   evidence (a test file, `__tests__`, `__mocks__`, `__snapshots__`, or
 *   `setupTests.*`).
 * - `__mocks__` and `__snapshots__` together are a coherent pair: each is
 *   individually shared with other tools, but Jest is the only runner that
 *   couples manual mocks with its own on-disk `.snap` serialization by
 *   default, so the pair co-occurring is strong enough on its own.
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
        signalType: 'jest-config-file',
        regex: /^jest\.config\.(?:js|ts|mjs|mts|cjs|cts|json)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'jest-setup-file',
        regex: /^jest[.-]setup\.(?:js|ts|mjs|cjs)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'jest-setup-tests-file',
        regex: /^setuptests\.(?:js|jsx|ts|tsx)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'jest-tests-directory',
        regex: /(^|\/)__tests__$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'jest-mocks-directory',
        regex: /(^|\/)__mocks__$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'jest-snapshots-directory',
        regex: /(^|\/)__snapshots__$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'jest-test-file',
        regex: /(^|\/)[^/]+\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            { has: 'jest-config-file' },
            {
              has: 'jest-setup-file',
              or: [
                { has: 'jest-test-file' },
                { has: 'jest-tests-directory' },
                { has: 'jest-mocks-directory' },
                { has: 'jest-snapshots-directory' },
                { has: 'jest-setup-tests-file' },
              ],
            },
            { hasAllOf: ['jest-mocks-directory', 'jest-snapshots-directory'] },
          ],
        },
      },
    },
  });
}
