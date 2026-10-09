import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';
import { createNonTestProjectFoldersExcluder } from './non-test-project-folders';

// The shared folder list plus `openzeppelin*`, the vendored Foundry copies that
// ship their own `.mocharc.*`. `test`, `tests`, `e2e` and `lib` stay allowed:
// they hold real suites.
const excludingMochaNonProjectFolders = createNonTestProjectFoldersExcluder({
  extraFolders: ['openzeppelin[^/]*'],
});

// The config scores 4 and the legacy opts file 3, so either opens the gate
// alone. The two supports only add confidence. Deliberately not scored:
// *.spec.*, *.test.*, __tests__, .nycrc*, karma/hardhat/truffle configs and
// mochawesome, none of which separates Mocha from other runners.
const MOCHA_TEST_SIGNAL_SCORES = {
  'mocha-config-file': 4,
  'mocha-legacy-opts': 3,
  'mocha-test-entry': 1,
  'mocha-setup': 1,
} as const;

type MochaTestSignal = keyof typeof MOCHA_TEST_SIGNAL_SCORES;

/**
 * Adds `Test suite` candidates with primary technology `Mocha` and related
 * technology `Node.js`.
 *
 * Owners resolve through `resolveUnitRootOwner`, anchored on `.mocharc.*`, so a
 * config owns its own folder and nested or sibling projects stay separate.
 * `test/mocha.opts` (Mocha before v8) also opens the gate. Recall is low,
 * because most Mocha projects configure it in `package.json` or use defaults,
 * so a missing Mocha area proves nothing.
 *
 * Known gaps: `test/mocha.opts` outside a workspace folder resolves to `.`
 * instead of the folder above `test/`, and fixture projects such as Stryker's
 * `e2e/test/<case>` each emit an area.
 */
export function addMochaTestAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<MochaTestSignal>({
    candidates,
    index,
    detectedArea: 'Test suite',
    primaryTech: 'Mocha',
    relatedTechs: ['Node.js'],
    signalScores: MOCHA_TEST_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'mocha-config-file',
        regex: excludingMochaNonProjectFolders(
          String.raw`(?:.*/)?\.mocharc\.(?:cjs|js|mjs|ya?ml|jsonc?)`,
        ),
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'mocha-legacy-opts',
        regex: excludingMochaNonProjectFolders(
          String.raw`(?:.*/)?test/mocha\.opts`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        // Shared with AVA and tape, so it only scores 1.
        signalType: 'mocha-test-entry',
        regex: excludingMochaNonProjectFolders(
          String.raw`(?:.*/)?test/[^/]+\.[cm]?[jt]s`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'mocha-setup',
        regex: excludingMochaNonProjectFolders(
          String.raw`(?:.*/)?test/(?:.*/)?(?:mocha[._-]?)?(?:setup|helpers?|bootstrap|hooks)\.[cm]?[jt]s`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: ['mocha-config-file', 'mocha-legacy-opts'],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
