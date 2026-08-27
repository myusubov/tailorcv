import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const JS_TS_SHARED_PACKAGE_SIGNAL_SCORES = {
  'js-ts-shared-package-name': 3,
  'js-ts-shared-package-workspace-manifest': 2,
  'js-ts-shared-package-entrypoint': 2,
} as const;

type JsTsSharedPackageSignal = keyof typeof JS_TS_SHARED_PACKAGE_SIGNAL_SCORES;

const sharedPackageOwnerPattern = String.raw`(?:(?:packages|libs|modules)\/(?:@[^/]+\/)?(?:shared|common|utils|types|ui|schemas|config|eslint-config|typescript-config)|libs\/shared\/[^/]+|shared|common)`;

/**
 * Adds `Shared package` candidates from JavaScript/TypeScript workspace
 * package path evidence, such as `packages/shared`, `packages/ui`, or
 * `libs/shared`.
 */
export function addJsTsSharedPackageAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<JsTsSharedPackageSignal>({
    candidates,
    index,
    detectedArea: 'Shared package',
    primaryTech: 'Node.js',
    signalScores: JS_TS_SHARED_PACKAGE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'js-ts-shared-package-workspace-manifest',
        regex: new RegExp(
          `^${sharedPackageOwnerPattern}\\/(?:package\\.json|project\\.json)$`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'js-ts-shared-package-name',
        regex: new RegExp(`^${sharedPackageOwnerPattern}$`),
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'js-ts-shared-package-entrypoint',
        regex: new RegExp(
          `^${sharedPackageOwnerPattern}\\/(?:src\\/)?index\\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts)$`,
        ),
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'js-ts-shared-package-name',
          hasOneOf: [
            'js-ts-shared-package-workspace-manifest',
            'js-ts-shared-package-entrypoint',
          ],
        },
      },
    },
  });
}
