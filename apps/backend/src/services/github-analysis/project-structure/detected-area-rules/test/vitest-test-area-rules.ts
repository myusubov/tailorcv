import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { createNonTestProjectFoldersExcluder } from './non-test-project-folders';

// The shared folder list plus the singular `fixture` and `template-*`. `test`,
// `tests`, `__tests__`, `e2e`, `docs` and `spec` stay allowed: they hold real
// suites.
const excludingVitestNonProjectFolders = createNonTestProjectFoldersExcluder({
  extraFolders: ['fixture', 'template-[^/]*'],
});

// The three config names score 3, the emission floor, so any one opens the
// gate. Supports only add confidence. Deliberately not scored: `vite.config.*`
// (every Vite app has one), test files, Jest/CRA setup names, __snapshots__,
// __mocks__, *.test-d.ts, *.bench.*, and `vitest.config.<name>.*` (undocumented,
// and it matches Vite's temporary `vitest.config.ts.timestamp-*.mjs`).
const VITEST_TEST_SIGNAL_SCORES = {
  'vitest-config-file': 3,
  'vitest-workspace-file': 3,
  'vitest-named-config': 3,
  'vitest-setup-file': 2,
  'vitest-scaffold-tsconfig': 1,
  'vitest-type-shims': 1,
} as const;

type VitestTestSignal = keyof typeof VITEST_TEST_SIGNAL_SCORES;

/**
 * Adds `Test suite` candidates with primary technology `Vitest`.
 *
 * Owners resolve through `resolveUnitRootOwner`, with all three config names as
 * anchors, so a config owns its own folder and nested or sibling configs stay
 * separate. Any one anchor opens the gate; a setup file alone does not, because
 * it often sits in `test/` or `src/`, a poor owner. A `test` block inside
 * `vite.config.*` is invisible to a path-only analyzer, so roughly 40% of Vitest
 * users are missed.
 *
 * Known gaps: a stray `vitest.config.js` with no Vitest dependency still emits,
 * shared config packages such as `ui/packages/config` emit, and there is no cap
 * on owners.
 */
export function addVitestTestAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<VitestTestSignal>({
    candidates,
    index,
    detectedArea: 'Test suite',
    primaryTech: 'Vitest',
    signalScores: VITEST_TEST_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'vitest-config-file',
        regex: excludingVitestNonProjectFolders(
          String.raw`(?:.*/)?vitest\.config\.[cm]?[jt]s`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        // Deprecated since Vitest 3.2 but still common.
        signalType: 'vitest-workspace-file',
        regex: excludingVitestNonProjectFolders(
          String.raw`(?:.*/)?vitest\.workspace\.(?:[cm]?[jt]s|json)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        // Documented naming for extra projects, e.g. `vitest.e2e.config.ts`.
        signalType: 'vitest-named-config',
        regex: excludingVitestNonProjectFolders(
          String.raw`(?:.*/)?vitest\.[\w-]+\.config\.[cm]?[jt]s`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'vitest-setup-file',
        regex: excludingVitestNonProjectFolders(
          String.raw`(?:.*/)?(?:vitest[.\-_]?setup|setup[.\-_]?vitest)[\w.-]*\.[cm]?[jt]sx?`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        // Written by the create-vue scaffold.
        signalType: 'vitest-scaffold-tsconfig',
        regex: excludingVitestNonProjectFolders(
          String.raw`(?:.*/)?tsconfig\.vitest\.json`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vitest-type-shims',
        regex: excludingVitestNonProjectFolders(
          String.raw`(?:.*/)?vitest(?:[.\-](?:env|shims|globals))?\.d\.ts`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: [
            'vitest-config-file',
            'vitest-workspace-file',
            'vitest-named-config',
          ],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
