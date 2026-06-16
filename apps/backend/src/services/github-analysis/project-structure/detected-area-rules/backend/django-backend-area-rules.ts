import type { RepoTreeEntry } from '../../project-structure-analyzer.types';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleCandidate,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

type DjangoBackendSignal =
  | 'django-manage-entry'
  | 'django-settings-module'
  | 'django-settings-package'
  | 'django-root-urlconf'
  | 'django-wsgi-entry'
  | 'django-asgi-entry'
  | 'django-app-config'
  | 'django-models'
  | 'django-migration'
  | 'django-admin'
  | 'django-views'
  | 'django-app-urlconf';

const DJANGO_BACKEND_SIGNAL_SCORES = {
  'django-manage-entry': 4,
  'django-settings-module': 3,
  'django-settings-package': 3,
  'django-root-urlconf': 2,
  'django-wsgi-entry': 3,
  'django-asgi-entry': 3,
  'django-app-config': 2,
  'django-models': 2,
  'django-migration': 2,
  'django-admin': 1,
  'django-views': 1,
  'django-app-urlconf': 1,
} satisfies AreaRuleSignalScores<DjangoBackendSignal>;

const IGNORED_DJANGO_EVIDENCE_PREFIXES = [
  'docs/',
  'test/',
  'tests/',
  'fixtures/',
] as const;

function hasDjangoBackendShape({
  countedSignals,
}: {
  countedSignals: Set<DjangoBackendSignal>;
}): boolean {
  const hasManageEntry = countedSignals.has('django-manage-entry');
  const hasSettings =
    countedSignals.has('django-settings-module') ||
    countedSignals.has('django-settings-package');
  const hasRootUrlconf = countedSignals.has('django-root-urlconf');
  const hasServerEntry =
    countedSignals.has('django-wsgi-entry') ||
    countedSignals.has('django-asgi-entry');
  const hasAppConfig = countedSignals.has('django-app-config');
  const hasModels = countedSignals.has('django-models');
  const hasMigration = countedSignals.has('django-migration');

  const hasManageBackedProject =
    hasManageEntry && (hasSettings || hasRootUrlconf || hasServerEntry);

  const hasDeployableProjectShape =
    hasSettings && hasRootUrlconf && hasServerEntry;

  const hasManageBackedAppShape =
    hasManageEntry && hasAppConfig && (hasModels || hasMigration);

  const hasSettingsBackedAppShape = hasSettings && hasAppConfig && hasMigration;

  return (
    hasManageBackedProject ||
    hasDeployableProjectShape ||
    hasManageBackedAppShape ||
    hasSettingsBackedAppShape
  );
}

function isIgnoredDjangoEvidencePath({
  entry,
}: {
  entry: Pick<RepoTreeEntry, 'path'>;
}): boolean {
  const path = entry.path.toLowerCase();

  return IGNORED_DJANGO_EVIDENCE_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  );
}

function countDjangoBackendSignal({
  areasByOwner,
  entry,
  signal,
}: {
  areasByOwner: Map<string, AreaRuleCandidate<DjangoBackendSignal>>;
  entry: RepoTreeEntry;
  signal: DjangoBackendSignal;
}): void {
  if (isIgnoredDjangoEvidencePath({ entry })) return;

  countAreaRuleSignal({
    areasByOwner,
    entry,
    signal,
    score: DJANGO_BACKEND_SIGNAL_SCORES[signal],
  });
}

/**
 * Adds `Backend API` candidates from Django path evidence.
 */
export function addDjangoBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const djangoAreasByOwner = createAreaRuleCandidateMap<DjangoBackendSignal>();

  const djangoManageEntryFiles = index.findFilesByNameMatching({
    pattern: /^manage\.py$/,
  });

  const djangoSettingsModuleFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)settings\.py$/,
  });

  const djangoSettingsPackageFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)settings\/(base|local|production|test)\.py$/,
  });

  const djangoRootUrlconfFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(config|mysite|project|core|server)\/urls\.py$/,
  });

  const djangoWsgiEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)wsgi\.py$/,
  });

  const djangoAsgiEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)asgi\.py$/,
  });

  const djangoAppConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)apps\.py$/,
  });

  const djangoModelFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)models\.py$/,
  });

  const djangoMigrationFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)migrations\/0001_initial\.py$/,
  });

  const djangoAdminFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)admin\.py$/,
  });

  const djangoViewFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)views\.py$/,
  });

  const djangoAppUrlconfFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(?!(config|mysite|project|core|server)\/)urls\.py$/,
  });

  for (const djangoManageEntryFile of djangoManageEntryFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoManageEntryFile,
      signal: 'django-manage-entry',
    });
  }

  for (const djangoSettingsModuleFile of djangoSettingsModuleFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoSettingsModuleFile,
      signal: 'django-settings-module',
    });
  }

  for (const djangoSettingsPackageFile of djangoSettingsPackageFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoSettingsPackageFile,
      signal: 'django-settings-package',
    });
  }

  for (const djangoRootUrlconfFile of djangoRootUrlconfFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoRootUrlconfFile,
      signal: 'django-root-urlconf',
    });
  }

  for (const djangoWsgiEntryFile of djangoWsgiEntryFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoWsgiEntryFile,
      signal: 'django-wsgi-entry',
    });
  }

  for (const djangoAsgiEntryFile of djangoAsgiEntryFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoAsgiEntryFile,
      signal: 'django-asgi-entry',
    });
  }

  for (const djangoAppConfigFile of djangoAppConfigFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoAppConfigFile,
      signal: 'django-app-config',
    });
  }

  for (const djangoModelFile of djangoModelFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoModelFile,
      signal: 'django-models',
    });
  }

  for (const djangoMigrationFile of djangoMigrationFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoMigrationFile,
      signal: 'django-migration',
    });
  }

  for (const djangoAdminFile of djangoAdminFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoAdminFile,
      signal: 'django-admin',
    });
  }

  for (const djangoViewFile of djangoViewFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoViewFile,
      signal: 'django-views',
    });
  }

  for (const djangoAppUrlconfFile of djangoAppUrlconfFiles) {
    countDjangoBackendSignal({
      areasByOwner: djangoAreasByOwner,
      entry: djangoAppUrlconfFile,
      signal: 'django-app-urlconf',
    });
  }

  for (const [ownerPath, ownerCandidate] of djangoAreasByOwner) {
    if (
      !hasDjangoBackendShape({
        countedSignals: ownerCandidate.countedSignals,
      })
    ) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Backend API',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Django',
      relatedTechnologies: ['Python'],
    });
  }
}
