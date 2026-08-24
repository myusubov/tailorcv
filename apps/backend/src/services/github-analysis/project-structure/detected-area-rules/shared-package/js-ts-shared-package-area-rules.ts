import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  type AreaRuleSignalScores,
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
} from '../project-structure-area-rule-candidates';

type JsTsSharedPackageSignal =
  | 'js-ts-shared-package-workspace-manifest'
  | 'js-ts-shared-package-name'
  | 'js-ts-shared-package-entrypoint';

const JS_TS_SHARED_PACKAGE_SIGNAL_SCORES = {
  'js-ts-shared-package-name': 3,
  'js-ts-shared-package-workspace-manifest': 2,
  'js-ts-shared-package-entrypoint': 2,
} satisfies AreaRuleSignalScores<JsTsSharedPackageSignal>;

function hasJsTsSharedPackageAreaShape(
  countedSignals: Set<JsTsSharedPackageSignal>,
): boolean {
  const hasSharedPackageName = countedSignals.has('js-ts-shared-package-name');
  const hasWorkspaceManifest = countedSignals.has(
    'js-ts-shared-package-workspace-manifest',
  );
  const hasEntrypoint = countedSignals.has('js-ts-shared-package-entrypoint');

  return hasSharedPackageName && (hasWorkspaceManifest || hasEntrypoint);
}

/**
 * Applies JavaScript and TypeScript shared-package rules.
 * These rules look for reusable workspace package areas such as
 * `packages/shared`, `packages/ui`, or `libs/shared`.
 */
export function addJsTsSharedPackageAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const sharedPackageAreasByOwner =
    createAreaRuleCandidateMap<JsTsSharedPackageSignal>();

  const sharedPackageOwnerPattern = String.raw`(?:(?:packages|libs|modules)\/(?:@[^/]+\/)?(?:shared|common|utils|types|ui|schemas|config|eslint-config|typescript-config)|libs\/shared\/[^/]+|shared|common)`;

  const sharedPackageManifestFiles = index.findEntriesByPathMatching({
    pattern: new RegExp(
      `^${sharedPackageOwnerPattern}\\/(?:package\\.json|project\\.json)$`,
    ),
  });

  const sharedPackageNameDirectories = index.findDirectoriesByPathMatching({
    pattern: new RegExp(`^${sharedPackageOwnerPattern}$`),
  });

  const sharedPackageEntryPointFiles = index.findEntriesByPathMatching({
    pattern: new RegExp(
      `^${sharedPackageOwnerPattern}\\/(?:src\\/)?index\\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts)$`,
    ),
  });

  for (const sharedPackageManifestFile of sharedPackageManifestFiles) {
    countAreaRuleSignal({
      areasByOwner: sharedPackageAreasByOwner,
      entry: sharedPackageManifestFile,
      score:
        JS_TS_SHARED_PACKAGE_SIGNAL_SCORES[
          'js-ts-shared-package-workspace-manifest'
        ],
      signal: 'js-ts-shared-package-workspace-manifest',
    });
  }

  for (const sharedPackageNameDirectory of sharedPackageNameDirectories) {
    countAreaRuleSignal({
      areasByOwner: sharedPackageAreasByOwner,
      entry: sharedPackageNameDirectory,
      score: JS_TS_SHARED_PACKAGE_SIGNAL_SCORES['js-ts-shared-package-name'],
      signal: 'js-ts-shared-package-name',
    });
  }

  for (const sharedPackageEntryPointFile of sharedPackageEntryPointFiles) {
    countAreaRuleSignal({
      areasByOwner: sharedPackageAreasByOwner,
      entry: sharedPackageEntryPointFile,
      score:
        JS_TS_SHARED_PACKAGE_SIGNAL_SCORES['js-ts-shared-package-entrypoint'],
      signal: 'js-ts-shared-package-entrypoint',
    });
  }

  for (const [ownerPath, ownerCandidate] of sharedPackageAreasByOwner) {
    if (!hasJsTsSharedPackageAreaShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Shared package',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Node.js',
      relatedTechnologies: [],
    });
  }
}
