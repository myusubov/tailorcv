import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type PrismaDatabaseSignal =
  | 'prisma-schema'
  | 'prisma-schema-fragment'
  | 'prisma-config'
  | 'prisma-migrations-directory'
  | 'prisma-migration-file'
  | 'prisma-migration-lock';

const PRISMA_DATABASE_SIGNAL_SCORES = {
  'prisma-schema': 4,
  'prisma-migration-file': 4,
  'prisma-config': 3,
  'prisma-schema-fragment': 2,
  'prisma-migrations-directory': 2,
  'prisma-migration-lock': 2,
} satisfies AreaRuleSignalScores<PrismaDatabaseSignal>;

const hasPrismaDatabaseAppShape = (
  countedSignals: Set<PrismaDatabaseSignal>,
): boolean => {
  const hasSchema = countedSignals.has('prisma-schema');
  const hasSchemaFragment = countedSignals.has('prisma-schema-fragment');
  const hasConfig = countedSignals.has('prisma-config');
  const hasMigrationFile = countedSignals.has('prisma-migration-file');
  const hasMigrationLock = countedSignals.has('prisma-migration-lock');

  const hasMigrationHistory = hasMigrationFile;

  const hasConfigBackedSchema = hasConfig && hasSchemaFragment;

  const hasConfigBackedMigration = hasConfig && hasMigrationLock;

  return (
    hasSchema ||
    hasMigrationHistory ||
    hasConfigBackedSchema ||
    hasConfigBackedMigration
  );
};

export function addPrismaDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext) {
  const prismaAreasByOwner = createAreaRuleCandidateMap<PrismaDatabaseSignal>();

  const prismaSchemaFiles = index.findFilesByNameMatching({
    pattern: /^schema\.prisma$/,
  });

  const prismaSchemaFragmentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)prisma\/(?:.+\/)?(?!schema\.prisma$)[^/]+\.prisma$/,
  });

  const prismaConfigFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:prisma\.config|\.config\/prisma)\.(?:ts|js|mjs|cjs|mts|cts)$/,
  });

  const prismaMigrationsDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)prisma\/migrations$/,
  });

  const prismaMigrationFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)prisma\/migrations\/[^/]+\/migration\.sql$/,
  });

  const prismaMigrationLockFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)prisma\/migrations\/migration_lock\.toml$/,
  });

  for (const prismaSchemaFile of prismaSchemaFiles) {
    countAreaRuleSignal({
      areasByOwner: prismaAreasByOwner,
      entry: prismaSchemaFile,
      score: PRISMA_DATABASE_SIGNAL_SCORES['prisma-schema'],
      signal: 'prisma-schema',
    });
  }

  for (const prismaSchemaFragmentFile of prismaSchemaFragmentFiles) {
    countAreaRuleSignal({
      areasByOwner: prismaAreasByOwner,
      entry: prismaSchemaFragmentFile,
      score: PRISMA_DATABASE_SIGNAL_SCORES['prisma-schema-fragment'],
      signal: 'prisma-schema-fragment',
    });
  }

  for (const prismaConfigFile of prismaConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: prismaAreasByOwner,
      entry: prismaConfigFile,
      score: PRISMA_DATABASE_SIGNAL_SCORES['prisma-config'],
      signal: 'prisma-config',
    });
  }

  for (const prismaMigrationsDirectory of prismaMigrationsDirectories) {
    countAreaRuleSignal({
      areasByOwner: prismaAreasByOwner,
      entry: prismaMigrationsDirectory,
      score: PRISMA_DATABASE_SIGNAL_SCORES['prisma-migrations-directory'],
      signal: 'prisma-migrations-directory',
    });
  }

  for (const prismaMigrationFile of prismaMigrationFiles) {
    countAreaRuleSignal({
      areasByOwner: prismaAreasByOwner,
      entry: prismaMigrationFile,
      score: PRISMA_DATABASE_SIGNAL_SCORES['prisma-migration-file'],
      signal: 'prisma-migration-file',
    });
  }

  for (const prismaMigrationLockFile of prismaMigrationLockFiles) {
    countAreaRuleSignal({
      areasByOwner: prismaAreasByOwner,
      entry: prismaMigrationLockFile,
      score: PRISMA_DATABASE_SIGNAL_SCORES['prisma-migration-lock'],
      signal: 'prisma-migration-lock',
    });
  }

  for (const [ownerPath, ownerCandidate] of prismaAreasByOwner) {
    if (!hasPrismaDatabaseAppShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Database schema',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Prisma',
      relatedTechnologies: [],
    });
  }
}
