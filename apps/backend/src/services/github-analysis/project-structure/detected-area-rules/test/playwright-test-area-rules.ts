import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { createNonTestProjectFoldersExcluder } from './non-test-project-folders';

// The shared folder list except `playground`, which held a real project in the
// survey. `test`, `tests`, `e2e` and `spec` stay allowed: they hold real suites.
const excludingPlaywrightNonProjectFolders =
  createNonTestProjectFoldersExcluder({
    allowedFolders: ['playground'],
  });

// The config scores 4 and opens the gate alone. Supports only add confidence;
// snapshots are the most specific, the rest score 1. Deliberately not scored:
// generic *.spec.* and *.test.* files (every runner has them), page-object
// folders, `playwright.<x>.config.*` variants, test-results, and Python test
// files (the Python bindings leave no Playwright path).
const PLAYWRIGHT_TEST_SIGNAL_SCORES = {
  'playwright-config-file': 4,
  'playwright-snapshots': 2,
  'playwright-e2e-spec': 1,
  'playwright-setup-file': 1,
  'playwright-ci-workflow': 1,
  'playwright-report': 1,
  'playwright-tests-examples': 1,
} as const;

type PlaywrightTestSignal = keyof typeof PLAYWRIGHT_TEST_SIGNAL_SCORES;

/**
 * Adds `Test suite` candidates with primary technology `Playwright`.
 *
 * Owners resolve through `resolveUnitRootOwner`, anchored on
 * `playwright.config.*`, so the owner is the project that runs Playwright (for
 * example `apps/web-e2e`), and nested or sibling projects stay separate. The
 * config alone opens the gate. The CI workflow sits at the repository root, so
 * it only reaches a root config. Python, Java and .NET Playwright leave no
 * path evidence.
 *
 * Known gap: a library's own fixture configs flood owners (88 in
 * `playwright-bdd`), and no path rule separates them from real suites without
 * also dropping `tests/e2e` layouts.
 */
export function addPlaywrightTestAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<PlaywrightTestSignal>({
    candidates,
    index,
    detectedArea: 'Test suite',
    primaryTech: 'Playwright',
    signalScores: PLAYWRIGHT_TEST_SIGNAL_SCORES,
    entrySchemas: [
      {
        // The six extensions Playwright loads; a name that only ends in the
        // anchor, such as `jest-playwright.config.js`, does not match.
        signalType: 'playwright-config-file',
        regex: excludingPlaywrightNonProjectFolders(
          String.raw`(?:.*/)?playwright\.config\.(?:ts|js|mts|mjs|cts|cjs)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'playwright-snapshots',
        regex: excludingPlaywrightNonProjectFolders(
          String.raw`(?:(?:.*/)?[^/]+\.(?:spec|test)\.[cm]?[jt]sx?-snapshots/.+|.*-(?:chromium|firefox|webkit|chrome|msedge|mobile-chrome|mobile-safari)(?:-[a-z0-9]+)*-(?:linux|darwin|win32)\.png)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'playwright-e2e-spec',
        regex: excludingPlaywrightNonProjectFolders(
          String.raw`(?:.*/)?e2e/(?:.*/)?[^/]+\.(?:spec|test)\.[cm]?[jt]sx?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        // Narrow on purpose: a bare `*.setup.*` also matches Jest and Vitest.
        signalType: 'playwright-setup-file',
        regex: excludingPlaywrightNonProjectFolders(
          String.raw`(?:.*/)?(?:(?:auth|login|global)[._-]?setup|global[._-]?teardown)\.[cm]?[jt]sx?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        // Written by `npm init playwright`.
        signalType: 'playwright-ci-workflow',
        regex: excludingPlaywrightNonProjectFolders(
          String.raw`\.github/workflows/playwright[^/]*\.ya?ml`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'playwright-report',
        regex: excludingPlaywrightNonProjectFolders(
          String.raw`(?:.*/)?(?:playwright-report|blob-report)(?:/.*)?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'playwright-tests-examples',
        regex: excludingPlaywrightNonProjectFolders(
          String.raw`(?:.*/)?tests-examples/.+`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: { has: 'playwright-config-file' },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
