import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

type AngularFrontendSignal =
  | 'angular-workspace-config'
  | 'angular-app-component'
  | 'angular-app-module'
  | 'angular-main-entry'
  | 'angular-project-config'
  | 'angular-app-directory';

type AngularAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<AngularFrontendSignal>;
};

const ANGULAR_FRONTEND_SIGNAL_SCORES = {
  'angular-workspace-config': 4,
  'angular-app-component': 4,
  'angular-app-module': 3,
  'angular-main-entry': 2,
  'angular-project-config': 1,
  'angular-app-directory': 1,
} satisfies Record<AngularFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from Angular path evidence.
 * Angular-specific signals stay internal while emitted areas remain role-based.
 */
export function addAngularFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const angularAreasByOwner = new Map<string, AngularAreaCandidate>();

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
    const ownerPath = ownerPathForApplicationArea({
      path: angularWorkspaceConfigFile.path,
    });
    const ownerCandidate =
      angularAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AngularFrontendSignal>(),
      } satisfies AngularAreaCandidate);

    if (!ownerCandidate.countedSignals.has('angular-workspace-config')) {
      ownerCandidate.score +=
        ANGULAR_FRONTEND_SIGNAL_SCORES['angular-workspace-config'];
      ownerCandidate.evidence.push(angularWorkspaceConfigFile.path);
      ownerCandidate.countedSignals.add('angular-workspace-config');
    }

    angularAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const angularAppComponentFile of angularAppComponentFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: angularAppComponentFile.path,
    });
    const ownerCandidate =
      angularAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AngularFrontendSignal>(),
      } satisfies AngularAreaCandidate);

    if (!ownerCandidate.countedSignals.has('angular-app-component')) {
      ownerCandidate.score +=
        ANGULAR_FRONTEND_SIGNAL_SCORES['angular-app-component'];
      ownerCandidate.evidence.push(angularAppComponentFile.path);
      ownerCandidate.countedSignals.add('angular-app-component');
    }

    angularAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const angularAppModuleFile of angularAppModuleFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: angularAppModuleFile.path,
    });
    const ownerCandidate =
      angularAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AngularFrontendSignal>(),
      } satisfies AngularAreaCandidate);

    if (!ownerCandidate.countedSignals.has('angular-app-module')) {
      ownerCandidate.score +=
        ANGULAR_FRONTEND_SIGNAL_SCORES['angular-app-module'];
      ownerCandidate.evidence.push(angularAppModuleFile.path);
      ownerCandidate.countedSignals.add('angular-app-module');
    }

    angularAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const angularMainEntryFile of angularMainEntryFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: angularMainEntryFile.path,
    });
    const ownerCandidate =
      angularAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AngularFrontendSignal>(),
      } satisfies AngularAreaCandidate);

    if (!ownerCandidate.countedSignals.has('angular-main-entry')) {
      ownerCandidate.score +=
        ANGULAR_FRONTEND_SIGNAL_SCORES['angular-main-entry'];
      ownerCandidate.evidence.push(angularMainEntryFile.path);
      ownerCandidate.countedSignals.add('angular-main-entry');
    }

    angularAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const angularProjectConfigFile of angularProjectConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: angularProjectConfigFile.path,
    });
    const ownerCandidate =
      angularAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AngularFrontendSignal>(),
      } satisfies AngularAreaCandidate);

    if (!ownerCandidate.countedSignals.has('angular-project-config')) {
      ownerCandidate.score +=
        ANGULAR_FRONTEND_SIGNAL_SCORES['angular-project-config'];
      ownerCandidate.evidence.push(angularProjectConfigFile.path);
      ownerCandidate.countedSignals.add('angular-project-config');
    }

    angularAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const angularAppDirectory of angularAppDirectories) {
    const ownerPath = ownerPathForApplicationArea({
      path: angularAppDirectory.path,
    });
    const ownerCandidate =
      angularAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AngularFrontendSignal>(),
      } satisfies AngularAreaCandidate);

    if (!ownerCandidate.countedSignals.has('angular-app-directory')) {
      ownerCandidate.score +=
        ANGULAR_FRONTEND_SIGNAL_SCORES['angular-app-directory'];
      ownerCandidate.evidence.push(angularAppDirectory.path);
      ownerCandidate.countedSignals.add('angular-app-directory');
    }

    angularAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const [ownerPath, ownerCandidate] of angularAreasByOwner) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
