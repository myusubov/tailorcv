import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type SequelizeDatabaseSignal =
  | 'sequelize-cli-config-file'
  | 'sequelize-config-file'
  | 'sequelize-model-file'
  | 'sequelize-model-index-file'
  | 'sequelize-migration-file'
  | 'sequelize-seeder-file';

const SEQUELIZE_DATABASE_SIGNAL_SCORES = {
  'sequelize-cli-config-file': 4,
  'sequelize-config-file': 2,
  'sequelize-model-file': 2,
  'sequelize-model-index-file': 2,
  'sequelize-migration-file': 2,
  'sequelize-seeder-file': 2,
} satisfies AreaRuleSignalScores<SequelizeDatabaseSignal>;

const hasSequelizeDatabaseAppShape = (
  countedSignals: Set<SequelizeDatabaseSignal>,
): boolean => {
  const hasCliConfig = countedSignals.has('sequelize-cli-config-file');
  const hasConfig = countedSignals.has('sequelize-config-file');
  const hasModel =
    countedSignals.has('sequelize-model-file') ||
    countedSignals.has('sequelize-model-index-file');
  const hasMigration = countedSignals.has('sequelize-migration-file');
  const hasSeeder = countedSignals.has('sequelize-seeder-file');

  const hasCliBackedModel = hasCliConfig && hasModel;
  const hasCliBackedMigration = hasCliConfig && hasMigration;
  const hasCliBackedSeeder = hasCliConfig && hasSeeder;
  const hasConfigBackedModelMigration = hasConfig && hasModel && hasMigration;
  const hasModelBackedMigration = hasModel && hasMigration;
  const hasConfigBackedMigrationSeeder = hasConfig && hasMigration && hasSeeder;

  return (
    hasCliBackedModel ||
    hasCliBackedMigration ||
    hasCliBackedSeeder ||
    hasConfigBackedModelMigration ||
    hasModelBackedMigration ||
    hasConfigBackedMigrationSeeder
  );
};

/**
 * Adds Sequelize database schema areas from path-only CLI config, model,
 * migration, and seeder evidence. Generic model, migration, config, and seeder
 * paths remain support signals and do not emit Sequelize unless combined.
 */
export function addSequelizeDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const sequelizeDatabaseAreasByOwner =
    createAreaRuleCandidateMap<SequelizeDatabaseSignal>();

  const sequelizeCliConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)\.sequelizerc(?:\.js)?$/,
  });

  const sequelizeConfigFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:(?:config|sequelize|db|database)\/(?:config|database)|(?:sequelize|db|database)\/config\/(?:config|database)|(?:[^/]+\/)*(?:sequelize|db|database)\/config\/(?:config|database))\.(?:json|js|mjs|cjs|ts|mts|cts)$/,
  });

  const sequelizeModelIndexFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:(?:models?|sequelize\/models|db\/models|database\/models)\/index|(?:[^/]+\/)*sequelize\/models\/index|(?:[^/]+\/)*(?:db|database)\/models\/index)\.(?:js|mjs|cjs|ts|mts|cts)$/,
  });

  const sequelizeModelFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:(?:models?|sequelize\/models|db\/models|database\/models)\/(?:.+\/)?(?!index\.)[^/]+|(?:[^/]+\/)*sequelize\/models\/(?:.+\/)?(?!index\.)[^/]+|(?:[^/]+\/)*(?:db|database)\/models\/(?:.+\/)?(?!index\.)[^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
  });

  const sequelizeMigrationFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:(?:migrations?|sequelize\/migrations?|db\/migrations?|database\/migrations?)\/(?:.+\/)?|(?:[^/]+\/)*(?:sequelize|db|database)\/migrations?\/(?:.+\/)?)(?:\d{12,}[-_][^/]+|\d{1,4}[-_][^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
  });

  const sequelizeSeederFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:(?:seeders?|sequelize\/seeders?|db\/seeders?|database\/seeders?)\/(?:.+\/)?|(?:[^/]+\/)*(?:sequelize|db|database)\/seeders?\/(?:.+\/)?)(?:\d{12,}[-_][^/]+|\d{1,4}[-_][^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
  });

  for (const sequelizeCliConfigFile of sequelizeCliConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: sequelizeDatabaseAreasByOwner,
      entry: sequelizeCliConfigFile,
      score: SEQUELIZE_DATABASE_SIGNAL_SCORES['sequelize-cli-config-file'],
      signal: 'sequelize-cli-config-file',
    });
  }

  for (const sequelizeConfigFile of sequelizeConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: sequelizeDatabaseAreasByOwner,
      entry: sequelizeConfigFile,
      score: SEQUELIZE_DATABASE_SIGNAL_SCORES['sequelize-config-file'],
      signal: 'sequelize-config-file',
    });
  }

  for (const sequelizeModelIndexFile of sequelizeModelIndexFiles) {
    countAreaRuleSignal({
      areasByOwner: sequelizeDatabaseAreasByOwner,
      entry: sequelizeModelIndexFile,
      score: SEQUELIZE_DATABASE_SIGNAL_SCORES['sequelize-model-index-file'],
      signal: 'sequelize-model-index-file',
    });
  }

  for (const sequelizeModelFile of sequelizeModelFiles) {
    countAreaRuleSignal({
      areasByOwner: sequelizeDatabaseAreasByOwner,
      entry: sequelizeModelFile,
      score: SEQUELIZE_DATABASE_SIGNAL_SCORES['sequelize-model-file'],
      signal: 'sequelize-model-file',
    });
  }

  for (const sequelizeMigrationFile of sequelizeMigrationFiles) {
    countAreaRuleSignal({
      areasByOwner: sequelizeDatabaseAreasByOwner,
      entry: sequelizeMigrationFile,
      score: SEQUELIZE_DATABASE_SIGNAL_SCORES['sequelize-migration-file'],
      signal: 'sequelize-migration-file',
    });
  }

  for (const sequelizeSeederFile of sequelizeSeederFiles) {
    countAreaRuleSignal({
      areasByOwner: sequelizeDatabaseAreasByOwner,
      entry: sequelizeSeederFile,
      score: SEQUELIZE_DATABASE_SIGNAL_SCORES['sequelize-seeder-file'],
      signal: 'sequelize-seeder-file',
    });
  }

  for (const [ownerPath, ownerCandidate] of sequelizeDatabaseAreasByOwner) {
    if (!hasSequelizeDatabaseAppShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Database schema',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Sequelize',
      relatedTechnologies: [],
    });
  }
}
