import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

type RailsBackendSignal =
  | 'rails-bin-entry'
  | 'rails-application-config'
  | 'rails-boot-config'
  | 'rails-environment-entry'
  | 'rails-environment-config'
  | 'rails-routes'
  | 'rails-rack-entry'
  | 'rails-application-controller'
  | 'rails-controller'
  | 'rails-application-record'
  | 'rails-model'
  | 'rails-erb-view'
  | 'rails-migration'
  | 'rails-schema'
  | 'rails-database-config'
  | 'rails-application-job'
  | 'rails-application-mailer'
  | 'ruby-gemfile'
  | 'ruby-rakefile';

const RAILS_BACKEND_SIGNAL_SCORES = {
  'rails-bin-entry': 4,
  'rails-application-config': 4,
  'rails-boot-config': 3,
  'rails-environment-entry': 3,
  'rails-environment-config': 2,
  'rails-routes': 3,
  'rails-rack-entry': 2,
  'rails-application-controller': 3,
  'rails-controller': 2,
  'rails-application-record': 2,
  'rails-model': 1,
  'rails-erb-view': 2,
  'rails-migration': 2,
  'rails-schema': 2,
  'rails-database-config': 2,
  'rails-application-job': 2,
  'rails-application-mailer': 2,
  'ruby-gemfile': 1,
  'ruby-rakefile': 1,
} satisfies AreaRuleSignalScores<RailsBackendSignal>;

/**
 * Returns whether one owner has a three-part Ruby on Rails application shape.
 * Every accepted combination requires the application config plus independent
 * boot, Rack, routing, or application-controller evidence.
 */
function hasRailsBackendShape({
  countedSignals,
}: {
  countedSignals: Set<RailsBackendSignal>;
}): boolean {
  const hasBinEntry = countedSignals.has('rails-bin-entry');
  const hasApplicationConfig = countedSignals.has('rails-application-config');
  const hasBootConfig = countedSignals.has('rails-boot-config');
  const hasEnvironmentEntry = countedSignals.has('rails-environment-entry');
  const hasRoutes = countedSignals.has('rails-routes');
  const hasRackEntry = countedSignals.has('rails-rack-entry');
  const hasApplicationController = countedSignals.has(
    'rails-application-controller',
  );

  const hasCanonicalBootShape =
    hasApplicationConfig &&
    hasBinEntry &&
    (hasBootConfig || hasEnvironmentEntry);

  const hasRackBootShape =
    hasApplicationConfig && hasEnvironmentEntry && hasRackEntry;

  const hasRoutedApplicationShape =
    hasApplicationConfig && hasRoutes && hasApplicationController;

  const hasConfiguredApplicationShape =
    hasApplicationConfig && hasBootConfig && hasRoutes;

  return (
    hasCanonicalBootShape ||
    hasRackBootShape ||
    hasRoutedApplicationShape ||
    hasConfiguredApplicationShape
  );
}

/**
 * Adds owner-scoped `Backend API` candidates from Ruby on Rails path evidence.
 * Only repository-root, `apps/*`, and `packages/*` application paths are
 * considered, preventing nested test or generator applications from claiming
 * their containing repository.
 */
export function addRailsBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const railsAreasByOwner = createAreaRuleCandidateMap<RailsBackendSignal>();

  const railsBinEntryFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?bin\/rails$/,
  });

  const railsApplicationConfigFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?config\/application\.rb$/,
  });

  const railsBootConfigFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?config\/boot\.rb$/,
  });

  const railsEnvironmentEntryFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?config\/environment\.rb$/,
  });

  const railsEnvironmentConfigFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?:(?:apps|packages)\/[^/]+\/)?config\/environments\/(?:development|production|test)\.rb$/,
  });

  const railsRouteFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?config\/routes\.rb$/,
  });

  const railsRackEntryFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?config\.ru$/,
  });

  const railsApplicationControllerFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?:(?:apps|packages)\/[^/]+\/)?app\/controllers\/application_controller\.rb$/,
  });

  const railsControllerFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?:(?:apps|packages)\/[^/]+\/)?app\/controllers\/(?:.*\/)?(?!application_controller\.rb$)[^/]+_controller\.rb$/,
  });

  const railsApplicationRecordFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?:(?:apps|packages)\/[^/]+\/)?app\/models\/application_record\.rb$/,
  });

  const railsModelFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?:(?:apps|packages)\/[^/]+\/)?app\/models\/(?:.*\/)?(?!application_record\.rb$)[^/]+\.rb$/,
  });

  const railsErbViewFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?:(?:apps|packages)\/[^/]+\/)?app\/views\/(?:.*\/)?[^/]+\.html\.erb$/,
  });

  const railsMigrationFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?db\/migrate\/\d{14}_[^/]+\.rb$/,
  });

  const railsSchemaFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?:(?:apps|packages)\/[^/]+\/)?db\/(?:schema\.rb|structure\.sql)$/,
  });

  const railsDatabaseConfigFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?config\/database\.yml$/,
  });

  const railsApplicationJobFiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?app\/jobs\/application_job\.rb$/,
  });

  const railsApplicationMailerFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?:(?:apps|packages)\/[^/]+\/)?app\/mailers\/application_mailer\.rb$/,
  });

  const rubyGemfiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?gemfile$/,
  });

  const rubyRakefiles = index.findEntriesByPathMatching({
    pattern: /^(?:(?:apps|packages)\/[^/]+\/)?rakefile$/,
  });

  for (const railsBinEntryFile of railsBinEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsBinEntryFile,
      signal: 'rails-bin-entry',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-bin-entry'],
    });
  }

  for (const railsApplicationConfigFile of railsApplicationConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsApplicationConfigFile,
      signal: 'rails-application-config',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-application-config'],
    });
  }

  for (const railsBootConfigFile of railsBootConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsBootConfigFile,
      signal: 'rails-boot-config',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-boot-config'],
    });
  }

  for (const railsEnvironmentEntryFile of railsEnvironmentEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsEnvironmentEntryFile,
      signal: 'rails-environment-entry',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-environment-entry'],
    });
  }

  for (const railsEnvironmentConfigFile of railsEnvironmentConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsEnvironmentConfigFile,
      signal: 'rails-environment-config',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-environment-config'],
    });
  }

  for (const railsRouteFile of railsRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsRouteFile,
      signal: 'rails-routes',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-routes'],
    });
  }

  for (const railsRackEntryFile of railsRackEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsRackEntryFile,
      signal: 'rails-rack-entry',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-rack-entry'],
    });
  }

  for (const railsApplicationControllerFile of railsApplicationControllerFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsApplicationControllerFile,
      signal: 'rails-application-controller',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-application-controller'],
    });
  }

  for (const railsControllerFile of railsControllerFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsControllerFile,
      signal: 'rails-controller',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-controller'],
    });
  }

  for (const railsApplicationRecordFile of railsApplicationRecordFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsApplicationRecordFile,
      signal: 'rails-application-record',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-application-record'],
    });
  }

  for (const railsModelFile of railsModelFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsModelFile,
      signal: 'rails-model',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-model'],
    });
  }

  for (const railsErbViewFile of railsErbViewFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsErbViewFile,
      signal: 'rails-erb-view',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-erb-view'],
    });
  }

  for (const railsMigrationFile of railsMigrationFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsMigrationFile,
      signal: 'rails-migration',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-migration'],
    });
  }

  for (const railsSchemaFile of railsSchemaFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsSchemaFile,
      signal: 'rails-schema',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-schema'],
    });
  }

  for (const railsDatabaseConfigFile of railsDatabaseConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsDatabaseConfigFile,
      signal: 'rails-database-config',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-database-config'],
    });
  }

  for (const railsApplicationJobFile of railsApplicationJobFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsApplicationJobFile,
      signal: 'rails-application-job',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-application-job'],
    });
  }

  for (const railsApplicationMailerFile of railsApplicationMailerFiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: railsApplicationMailerFile,
      signal: 'rails-application-mailer',
      score: RAILS_BACKEND_SIGNAL_SCORES['rails-application-mailer'],
    });
  }

  for (const rubyGemfile of rubyGemfiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: rubyGemfile,
      signal: 'ruby-gemfile',
      score: RAILS_BACKEND_SIGNAL_SCORES['ruby-gemfile'],
    });
  }

  for (const rubyRakefile of rubyRakefiles) {
    countAreaRuleSignal({
      areasByOwner: railsAreasByOwner,
      entry: rubyRakefile,
      signal: 'ruby-rakefile',
      score: RAILS_BACKEND_SIGNAL_SCORES['ruby-rakefile'],
    });
  }

  for (const [ownerPath, ownerCandidate] of railsAreasByOwner) {
    if (
      !hasRailsBackendShape({
        countedSignals: ownerCandidate.countedSignals,
      })
    ) {
      continue;
    }

    const hasErbView = ownerCandidate.countedSignals.has('rails-erb-view');

    addAreaScore({
      candidates,
      name: 'Backend API',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Ruby on Rails',
      relatedTechnologies: hasErbView ? ['Ruby', 'ERB'] : ['Ruby'],
    });
  }
}
