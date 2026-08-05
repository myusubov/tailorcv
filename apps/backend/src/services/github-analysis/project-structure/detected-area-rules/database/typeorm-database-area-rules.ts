import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForTypeOrmDatabaseArea } from '../../project-structure-path-utils';

type TypeOrmDatabaseSignal =
  | 'typeorm-legacy-config-file'
  | 'typeorm-example-config-file'
  | 'typeorm-data-source-file'
  | 'typeorm-entity-file'
  | 'typeorm-migration-file';

const TYPEORM_DATABASE_SIGNAL_SCORES = {
  'typeorm-legacy-config-file': 4,
  'typeorm-data-source-file': 3,
  'typeorm-example-config-file': 2,
  'typeorm-entity-file': 2,
  'typeorm-migration-file': 2,
} satisfies AreaRuleSignalScores<TypeOrmDatabaseSignal>;

const hasTypeOrmDatabaseAppShape = (
  countedSignals: Set<TypeOrmDatabaseSignal>,
): boolean => {
  const hasStrongConfig =
    countedSignals.has('typeorm-legacy-config-file') ||
    countedSignals.has('typeorm-data-source-file');

  const hasExampleConfig = countedSignals.has('typeorm-example-config-file');
  const hasEntityFile = countedSignals.has('typeorm-entity-file');
  const hasMigrationFile = countedSignals.has('typeorm-migration-file');

  const hasStrongConfigBackedEntity = hasStrongConfig && hasEntityFile;
  const hasStrongConfigBackedMigration = hasStrongConfig && hasMigrationFile;
  const hasExampleConfigBackedEntity = hasExampleConfig && hasEntityFile;
  const hasEntityBackedMigration = hasEntityFile && hasMigrationFile;

  return (
    hasStrongConfigBackedEntity ||
    hasStrongConfigBackedMigration ||
    hasExampleConfigBackedEntity ||
    hasEntityBackedMigration
  );
};

/**
 * Adds TypeORM database schema areas from path-only config, entity, and migration evidence.
 * Entity-schema files are intentionally excluded because `*.schema.*` is too broad
 * without source-content confirmation.
 */
export function addTypeOrmDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const typeOrmDatabaseAreasByOwner =
    createAreaRuleCandidateMap<TypeOrmDatabaseSignal>();

  const typeOrmLegacyConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)ormconfig\.(?:json|js|cjs|mjs|ts|cts|mts)$/,
  });

  const typeOrmExampleConfigFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:ormconfig\.(?:json|js|cjs|mjs|ts|cts|mts)\.example|ormconfig\.example\.(?:json|js|cjs|mjs|ts|cts|mts))$/,
  });

  const typeOrmDataSourceFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(?:data-source|datasource|app-data-source)\.(?:ts|js|mjs|cjs|mts|cts)$/,
  });

  const typeOrmEntityFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:[^/]+\.entity|(?:entities?|entity)\/(?:.+\/)?[^/]+)\.(?:ts|js|mjs|cjs|mts|cts)$/,
  });

  const typeOrmMigrationFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)migrations?(?:\/[^/]+)*\/(?:\d{10,}[-_][^/]+|migration\d{8,}[^/]*)\.(?:ts|js|mjs|cjs|mts|cts)$/,
  });

  for (const typeOrmLegacyConfigFile of typeOrmLegacyConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: typeOrmDatabaseAreasByOwner,
      entry: typeOrmLegacyConfigFile,
      score: TYPEORM_DATABASE_SIGNAL_SCORES['typeorm-legacy-config-file'],
      signal: 'typeorm-legacy-config-file',
      resolveOwnerPath: ownerPathForTypeOrmDatabaseArea,
    });
  }

  for (const typeOrmExampleConfigFile of typeOrmExampleConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: typeOrmDatabaseAreasByOwner,
      entry: typeOrmExampleConfigFile,
      score: TYPEORM_DATABASE_SIGNAL_SCORES['typeorm-example-config-file'],
      signal: 'typeorm-example-config-file',
      resolveOwnerPath: ownerPathForTypeOrmDatabaseArea,
    });
  }

  for (const typeOrmDataSourceFile of typeOrmDataSourceFiles) {
    countAreaRuleSignal({
      areasByOwner: typeOrmDatabaseAreasByOwner,
      entry: typeOrmDataSourceFile,
      score: TYPEORM_DATABASE_SIGNAL_SCORES['typeorm-data-source-file'],
      signal: 'typeorm-data-source-file',
      resolveOwnerPath: ownerPathForTypeOrmDatabaseArea,
    });
  }

  for (const typeOrmEntityFile of typeOrmEntityFiles) {
    countAreaRuleSignal({
      areasByOwner: typeOrmDatabaseAreasByOwner,
      entry: typeOrmEntityFile,
      score: TYPEORM_DATABASE_SIGNAL_SCORES['typeorm-entity-file'],
      signal: 'typeorm-entity-file',
      resolveOwnerPath: ownerPathForTypeOrmDatabaseArea,
    });
  }

  for (const typeOrmMigrationFile of typeOrmMigrationFiles) {
    countAreaRuleSignal({
      areasByOwner: typeOrmDatabaseAreasByOwner,
      entry: typeOrmMigrationFile,
      score: TYPEORM_DATABASE_SIGNAL_SCORES['typeorm-migration-file'],
      signal: 'typeorm-migration-file',
      resolveOwnerPath: ownerPathForTypeOrmDatabaseArea,
    });
  }

  for (const [ownerPath, ownerCandidate] of typeOrmDatabaseAreasByOwner) {
    if (!hasTypeOrmDatabaseAppShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Database schema',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'TypeORM',
      relatedTechnologies: [],
    });
  }
}
