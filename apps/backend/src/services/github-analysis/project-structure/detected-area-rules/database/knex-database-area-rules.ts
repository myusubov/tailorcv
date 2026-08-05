import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForKnexDatabaseArea } from '../../project-structure-path-utils';

type KnexDatabaseSignal =
  | 'knex-config-file'
  | 'knex-custom-config-file'
  | 'knex-migration-file'
  | 'knex-seed-file';

const KNEX_DATABASE_SIGNAL_SCORES = {
  'knex-config-file': 4,
  'knex-custom-config-file': 3,
  'knex-migration-file': 2,
  'knex-seed-file': 2,
} satisfies AreaRuleSignalScores<KnexDatabaseSignal>;

const hasKnexDatabaseAppShape = (
  countedSignals: Set<KnexDatabaseSignal>,
): boolean => {
  const hasKnexConfig =
    countedSignals.has('knex-config-file') ||
    countedSignals.has('knex-custom-config-file');

  const hasKnexArtifact =
    countedSignals.has('knex-migration-file') ||
    countedSignals.has('knex-seed-file');

  return hasKnexConfig && hasKnexArtifact;
};

/**
 * Adds Knex database schema areas from path-only config, migration, and seed
 * evidence. Knex config is always required because migration and seed folders
 * are too generic to prove Knex usage by themselves.
 */
export function addKnexDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const knexDatabaseAreasByOwner =
    createAreaRuleCandidateMap<KnexDatabaseSignal>();

  const knexConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)knexfile\.(?:js|mjs|cjs|ts|mts|cts)$/,
  });

  const knexCustomConfigFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:_knexfile|knex\.config|knexfile\.[^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
  });

  const knexMigrationFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:(?:db|database)\/)?migrations?\/(?:.+\/)?(?:\d{12,}[-_][^/]+|\d{1,4}[-_][^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
  });

  const knexSeedFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:(?:db|database)\/)?seeds?\/(?:.+\/)?[^/]+\.(?:js|mjs|cjs|ts|mts|cts)$/,
  });

  for (const knexConfigFile of knexConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: knexDatabaseAreasByOwner,
      entry: knexConfigFile,
      score: KNEX_DATABASE_SIGNAL_SCORES['knex-config-file'],
      signal: 'knex-config-file',
      resolveOwnerPath: ownerPathForKnexDatabaseArea,
    });
  }

  for (const knexCustomConfigFile of knexCustomConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: knexDatabaseAreasByOwner,
      entry: knexCustomConfigFile,
      score: KNEX_DATABASE_SIGNAL_SCORES['knex-custom-config-file'],
      signal: 'knex-custom-config-file',
      resolveOwnerPath: ownerPathForKnexDatabaseArea,
    });
  }

  for (const knexMigrationFile of knexMigrationFiles) {
    countAreaRuleSignal({
      areasByOwner: knexDatabaseAreasByOwner,
      entry: knexMigrationFile,
      score: KNEX_DATABASE_SIGNAL_SCORES['knex-migration-file'],
      signal: 'knex-migration-file',
      resolveOwnerPath: ownerPathForKnexDatabaseArea,
    });
  }

  for (const knexSeedFile of knexSeedFiles) {
    countAreaRuleSignal({
      areasByOwner: knexDatabaseAreasByOwner,
      entry: knexSeedFile,
      score: KNEX_DATABASE_SIGNAL_SCORES['knex-seed-file'],
      signal: 'knex-seed-file',
      resolveOwnerPath: ownerPathForKnexDatabaseArea,
    });
  }

  for (const [ownerPath, ownerCandidate] of knexDatabaseAreasByOwner) {
    if (!hasKnexDatabaseAppShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Database schema',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Knex',
      relatedTechnologies: [],
    });
  }
}
