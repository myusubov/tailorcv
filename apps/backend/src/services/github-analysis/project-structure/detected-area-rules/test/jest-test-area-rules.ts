import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

type JestTestSignal =
  | 'jest-config-file'
  | 'jest-setup-file'
  | 'jest-setup-tests-file'
  | 'jest-tests-directory'
  | 'jest-mocks-directory'
  | 'jest-snapshots-directory'
  | 'jest-test-file';

const JEST_TEST_SIGNAL_SCORES = {
  'jest-config-file': 3,
  'jest-setup-file': 2,
  'jest-setup-tests-file': 1,
  'jest-tests-directory': 1,
  'jest-mocks-directory': 2,
  'jest-snapshots-directory': 2,
  'jest-test-file': 1,
} satisfies AreaRuleSignalScores<JestTestSignal>;

/**
 * Returns whether one owner has a conservative Jest shape.
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
function hasJestAppShape({
  countedSignals,
}: {
  countedSignals: Set<JestTestSignal>;
}): boolean {
  const hasJestConfigFile = countedSignals.has('jest-config-file');
  const hasJestSetupFile = countedSignals.has('jest-setup-file');
  const hasJestSetupTestsFile = countedSignals.has('jest-setup-tests-file');
  const hasJestTestsDirectory = countedSignals.has('jest-tests-directory');
  const hasJestMocksDirectory = countedSignals.has('jest-mocks-directory');
  const hasJestSnapshotsDirectory = countedSignals.has(
    'jest-snapshots-directory',
  );
  const hasJestTestFile = countedSignals.has('jest-test-file');

  const hasSupportingTestEvidence =
    hasJestTestFile ||
    hasJestTestsDirectory ||
    hasJestMocksDirectory ||
    hasJestSnapshotsDirectory ||
    hasJestSetupTestsFile;

  const hasNamedSetupShape = hasJestSetupFile && hasSupportingTestEvidence;

  const hasMockSnapshotPairShape =
    hasJestMocksDirectory && hasJestSnapshotsDirectory;

  return hasJestConfigFile || hasNamedSetupShape || hasMockSnapshotPairShape;
}

/**
 * Counts owner-scoped Jest signal evidence from conservative path-only
 * evidence. Emission gating against a confirmed Jest shape is not
 * implemented yet, so this only accumulates score and evidence per owner.
 */
export function addJestTestAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const jestAreasByOwner = createAreaRuleCandidateMap<JestTestSignal>();

  const jestConfigFiles = index.findFilesByNameMatching({
    pattern: /^jest\.config\.(?:js|ts|mjs|mts|cjs|cts|json)$/,
  });

  const jestSetupFiles = index.findFilesByNameMatching({
    pattern: /^jest[.-]setup\.(?:js|ts|mjs|cjs)$/,
  });

  const jestSetupTestsFiles = index.findFilesByNameMatching({
    pattern: /^setuptests\.(?:js|jsx|ts|tsx)$/,
  });

  const jestTestsDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)__tests__$/,
  });

  const jestMocksDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)__mocks__$/,
  });

  const jestSnapshotsDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)__snapshots__$/,
  });

  const jestTestFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)[^/]+\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs)$/,
  });

  for (const jestConfigFile of jestConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: jestAreasByOwner,
      entry: jestConfigFile,
      signal: 'jest-config-file',
      score: JEST_TEST_SIGNAL_SCORES['jest-config-file'],
    });
  }

  for (const jestSetupFile of jestSetupFiles) {
    countAreaRuleSignal({
      areasByOwner: jestAreasByOwner,
      entry: jestSetupFile,
      signal: 'jest-setup-file',
      score: JEST_TEST_SIGNAL_SCORES['jest-setup-file'],
    });
  }

  for (const jestSetupTestsFile of jestSetupTestsFiles) {
    countAreaRuleSignal({
      areasByOwner: jestAreasByOwner,
      entry: jestSetupTestsFile,
      signal: 'jest-setup-tests-file',
      score: JEST_TEST_SIGNAL_SCORES['jest-setup-tests-file'],
    });
  }

  for (const jestTestsDirectory of jestTestsDirectories) {
    countAreaRuleSignal({
      areasByOwner: jestAreasByOwner,
      entry: jestTestsDirectory,
      signal: 'jest-tests-directory',
      score: JEST_TEST_SIGNAL_SCORES['jest-tests-directory'],
    });
  }

  for (const jestMocksDirectory of jestMocksDirectories) {
    countAreaRuleSignal({
      areasByOwner: jestAreasByOwner,
      entry: jestMocksDirectory,
      signal: 'jest-mocks-directory',
      score: JEST_TEST_SIGNAL_SCORES['jest-mocks-directory'],
    });
  }

  for (const jestSnapshotsDirectory of jestSnapshotsDirectories) {
    countAreaRuleSignal({
      areasByOwner: jestAreasByOwner,
      entry: jestSnapshotsDirectory,
      signal: 'jest-snapshots-directory',
      score: JEST_TEST_SIGNAL_SCORES['jest-snapshots-directory'],
    });
  }

  for (const jestTestFile of jestTestFiles) {
    countAreaRuleSignal({
      areasByOwner: jestAreasByOwner,
      entry: jestTestFile,
      signal: 'jest-test-file',
      score: JEST_TEST_SIGNAL_SCORES['jest-test-file'],
    });
  }

  for (const [ownerPath, ownerCandidate] of jestAreasByOwner) {
    if (!hasJestAppShape({ countedSignals: ownerCandidate.countedSignals })) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Test suite',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Jest',
      relatedTechnologies: [],
    });
  }
}
