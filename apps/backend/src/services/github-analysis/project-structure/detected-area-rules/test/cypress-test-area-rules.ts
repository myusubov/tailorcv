import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { createNonTestProjectFoldersExcluder } from './non-test-project-folders';

// The shared fixture, template and vendored folders, plus build and asset
// folders. Demo-style names are allowed back in: Cypress plugins and workshops
// ship working Cypress projects in `examples/` and `demos/`. `test`, `tests`,
// `e2e` and `spec` stay allowed too (every Nx Cypress project lives in
// `apps/<name>-e2e`).
const excludingCypressNonProjectFolders = createNonTestProjectFoldersExcluder({
  allowedFolders: [
    'examples?',
    'demos?',
    'samples?',
    'playground',
    'sandbox',
    'starters?',
  ],
  extraFolders: [
    'fixture',
    'vendors',
    'template-[^/]*',
    'dist',
    'public',
    'static',
  ],
});

// The config scores 3 and opens the gate alone. The legacy `cypress.json`
// scores 2 because its name leaks out of non-projects (plant data, a tsconfig
// preset), which is under MIN_AREA_SCORE (3): it only emits with a support.
// Deliberately not scored: `cypress/fixtures`, `cypress.env.json`, generic
// e2e/support/fixtures folders, *.test.*, *.spec.*, and a bare `cypress/` folder
// (PSoC firmware has `ports/cypress/psoc5`).
const CYPRESS_TEST_SIGNAL_SCORES = {
  'cypress-config-file': 3,
  'cypress-legacy-config-file': 2,
  'cypress-spec-folder': 2,
  'cypress-spec-file': 1,
  'cypress-support-file': 1,
} as const;

type CypressTestSignal = keyof typeof CYPRESS_TEST_SIGNAL_SCORES;

/**
 * Adds `Test suite` candidates with primary technology `Cypress`.
 *
 * Owners resolve through `resolveUnitRootOwner`, anchored on
 * `cypress.config.*` and `cypress.json`, so a config owns its own folder (for
 * example `tests/` or `apps/<name>-e2e`) and sibling configs stay separate.
 * Either anchor opens the gate, but a legacy `cypress.json` alone scores under
 * `MIN_AREA_SCORE`, so it only emits with a spec folder, spec file or support
 * file.
 *
 * Known gaps: there is no owner cap, so a tool repo with fixture projects
 * outside the excluded names emits one area per project, and a config inside
 * `cypress/e2e` becomes a second project.
 */
export function addCypressTestAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<CypressTestSignal>({
    candidates,
    index,
    detectedArea: 'Test suite',
    primaryTech: 'Cypress',
    signalScores: CYPRESS_TEST_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'cypress-config-file',
        regex: excludingCypressNonProjectFolders(
          String.raw`(?:.*/)?cypress\.config\.(?:js|ts|mjs|cjs)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'cypress-legacy-config-file',
        regex: excludingCypressNonProjectFolders(
          String.raw`(?:.*/)?cypress\.json`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'cypress-spec-folder',
        regex: excludingCypressNonProjectFolders(
          String.raw`(?:.*/)?cypress/(?:e2e|integration|component)`,
        ),
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        // The `.cy.` infix is the only spec naming Cypress discovers.
        signalType: 'cypress-spec-file',
        regex: excludingCypressNonProjectFolders(
          String.raw`.*\.cy\.(?:js|jsx|ts|tsx|mjs|cjs)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'cypress-support-file',
        regex: excludingCypressNonProjectFolders(
          String.raw`(?:.*/)?cypress/support/(?:e2e|component|index|commands)\.(?:js|jsx|ts|tsx|mjs|cjs)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: ['cypress-config-file', 'cypress-legacy-config-file'],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
