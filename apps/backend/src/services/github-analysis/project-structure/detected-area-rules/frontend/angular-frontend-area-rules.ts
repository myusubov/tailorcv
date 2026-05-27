import {
  addAreaRuleCandidates,
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type AngularFrontendSignal =
  | 'angular-workspace-config'
  | 'angular-app-component'
  | 'angular-app-module'
  | 'angular-main-entry'
  | 'angular-project-config'
  | 'angular-app-directory';

const ANGULAR_FRONTEND_SIGNAL_SCORES = {
  'angular-workspace-config': 4,
  'angular-app-component': 4,
  'angular-app-module': 3,
  'angular-main-entry': 2,
  'angular-project-config': 1,
  'angular-app-directory': 1,
} satisfies AreaRuleSignalScores<AngularFrontendSignal>;

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

  const angularAppComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\/app\.component\.(ts|html|css|scss|sass|less)$/,
  });

  const angularAppModuleFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\/app\.module\.ts$/,
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

  for (const angularAppComponentFile of angularAppComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: angularAreasByOwner,
      entry: angularAppComponentFile,
      signal: 'angular-app-component',
      score: ANGULAR_FRONTEND_SIGNAL_SCORES['angular-app-component'],
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

  addAreaRuleCandidates({
    areasByOwner: angularAreasByOwner,
    candidates,
    name: 'Frontend app',
  });
}
