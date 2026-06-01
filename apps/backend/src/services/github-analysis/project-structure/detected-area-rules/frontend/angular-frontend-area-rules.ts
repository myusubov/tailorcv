import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type AngularFrontendSignal =
  | 'angular-workspace-config'
  | 'angular-root-component-ts'
  | 'angular-root-component-view'
  | 'angular-app-module'
  | 'angular-app-config'
  | 'angular-main-entry'
  | 'angular-project-config'
  | 'angular-app-directory';

const ANGULAR_FRONTEND_SIGNAL_SCORES = {
  'angular-workspace-config': 4,
  'angular-root-component-ts': 4,
  'angular-app-module': 3,
  'angular-app-config': 2,
  'angular-main-entry': 2,
  'angular-root-component-view': 1,
  'angular-project-config': 1,
  'angular-app-directory': 1,
} satisfies AreaRuleSignalScores<AngularFrontendSignal>;

function hasAngularAppShape({
  countedSignals,
}: {
  countedSignals: Set<AngularFrontendSignal>;
}): boolean {
  const hasAngularWorkspaceConfig = countedSignals.has(
    'angular-workspace-config',
  );
  const hasAngularRootComponent = countedSignals.has(
    'angular-root-component-ts',
  );
  const hasAngularAppModule = countedSignals.has('angular-app-module');
  const hasAngularAppConfig = countedSignals.has('angular-app-config');
  const hasAngularMainEntry = countedSignals.has('angular-main-entry');

  const hasRootComponentAndMainEntry =
    hasAngularRootComponent && hasAngularMainEntry;
  const hasRootComponentAndAppModule =
    hasAngularRootComponent && hasAngularAppModule;
  const hasRootComponentAndAppConfig =
    hasAngularRootComponent && hasAngularAppConfig;
  const hasAppModuleAndMainEntry = hasAngularAppModule && hasAngularMainEntry;

  return (
    hasAngularWorkspaceConfig ||
    hasRootComponentAndMainEntry ||
    hasRootComponentAndAppModule ||
    hasRootComponentAndAppConfig ||
    hasAppModuleAndMainEntry
  );
}

/**
 * Adds `Frontend app` candidates from Angular path evidence.
 * Angular-specific signals stay internal while emitted areas remain role-based.
 */
export function addAngularFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const angularAreasByOwner =
    createAreaRuleCandidateMap<AngularFrontendSignal>();

  const angularWorkspaceConfigFiles = index.findFilesByNameMatching({
    pattern: /^angular\.json$/,
  });

  const angularRootComponentTsFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\/app\.component\.ts$/,
  });

  const angularRootComponentViewFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\/app\.component\.(html|css|scss|sass|less)$/,
  });

  const angularAppModuleFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\/app\.module\.ts$/,
  });

  const angularAppConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\/app\.config\.ts$/,
  });

  const angularMainEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/main\.ts$/,
  });

  const angularProjectConfigFiles = index.findFilesByNameMatching({
    pattern: /^project\.json$/,
  });

  const angularAppDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)src\/app$/,
  });

  for (const angularWorkspaceConfigFile of angularWorkspaceConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularWorkspaceConfigFile,
      signal: 'angular-workspace-config',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-workspace-config'],
    });
  }

  for (const angularRootComponentTsFile of angularRootComponentTsFiles) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularRootComponentTsFile,
      signal: 'angular-root-component-ts',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-root-component-ts'],
    });
  }

  for (const angularRootComponentViewFile of angularRootComponentViewFiles) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularRootComponentViewFile,
      signal: 'angular-root-component-view',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-root-component-view'],
    });
  }

  for (const angularAppModuleFile of angularAppModuleFiles) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularAppModuleFile,
      signal: 'angular-app-module',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-app-module'],
    });
  }

  for (const angularAppConfigFile of angularAppConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularAppConfigFile,
      signal: 'angular-app-config',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-app-config'],
    });
  }

  for (const angularMainEntryFile of angularMainEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularMainEntryFile,
      signal: 'angular-main-entry',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-main-entry'],
    });
  }

  for (const angularProjectConfigFile of angularProjectConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularProjectConfigFile,
      signal: 'angular-project-config',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-project-config'],
    });
  }

  for (const angularAppDirectory of angularAppDirectories) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularAppDirectory,
      signal: 'angular-app-directory',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-app-directory'],
    });
  }

  for (const [ownerPath, ownerCandidate] of angularAreasByOwner) {
    if (
      !hasAngularAppShape({
        countedSignals: ownerCandidate.countedSignals,
      })
    ) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
