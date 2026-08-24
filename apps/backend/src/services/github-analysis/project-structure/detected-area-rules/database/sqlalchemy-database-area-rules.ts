import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type SqlAlchemyDatabaseSignal =
  | 'alembic-config-file'
  | 'alembic-env-file'
  | 'alembic-version-file'
  | 'alembic-script-template'
  | 'sqlalchemy-model-file'
  | 'sqlalchemy-db-file';

const SQLALCHEMY_DATABASE_SIGNAL_SCORES = {
  'alembic-config-file': 3,
  'alembic-env-file': 3,
  'alembic-version-file': 3,
  'alembic-script-template': 2,
  'sqlalchemy-model-file': 2,
  'sqlalchemy-db-file': 2,
} satisfies AreaRuleSignalScores<SqlAlchemyDatabaseSignal>;

const hasSqlAlchemyDatabaseAppShape = (
  countedSignals: Set<SqlAlchemyDatabaseSignal>,
): boolean => {
  const hasAlembicConfig = countedSignals.has('alembic-config-file');
  const hasAlembicEnv = countedSignals.has('alembic-env-file');
  const hasAlembicVersion = countedSignals.has('alembic-version-file');
  const hasSqlAlchemyModel = countedSignals.has('sqlalchemy-model-file');
  const hasSqlAlchemyDbFile = countedSignals.has('sqlalchemy-db-file');

  const hasAlembicMigrationEnvironment = hasAlembicEnv && hasAlembicVersion;
  const hasSqlAlchemyCode = hasSqlAlchemyModel || hasSqlAlchemyDbFile;
  const hasAlembicAnchor =
    hasAlembicConfig || hasAlembicEnv || hasAlembicVersion;

  const hasAlembicBackedSqlAlchemyCode =
    hasAlembicAnchor && hasSqlAlchemyCode;

  return hasAlembicMigrationEnvironment || hasAlembicBackedSqlAlchemyCode;
};

/**
 * Adds SQLAlchemy database schema areas from path-only SQLAlchemy and Alembic evidence.
 * Alembic is treated as migration support for SQLAlchemy-owned database areas.
 */
export function addSqlAlchemyDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const sqlAlchemyDatabaseAreasByOwner =
    createAreaRuleCandidateMap<SqlAlchemyDatabaseSignal>();

  const alembicConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)alembic\.ini$/,
  });

  const alembicEnvFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(?:alembic|migrations|_migrations)\/env\.py$/,
  });

  const alembicVersionFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:alembic|migrations|_migrations)\/versions(?:\/[^/]+)*\/[^/]+\.py$/,
  });

  const alembicScriptTemplateFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(?:alembic|migrations|_migrations)\/script\.py\.mako$/,
  });

  const sqlAlchemyModelFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(?:models\.py|orm_models\.py|models\/.+\.py)$/,
  });

  const sqlAlchemyDbFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(?:db|database|session|base|base_class)\.py$/,
  });

  for (const alembicConfigFile of alembicConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: sqlAlchemyDatabaseAreasByOwner,
      entry: alembicConfigFile,
      score: SQLALCHEMY_DATABASE_SIGNAL_SCORES['alembic-config-file'],
      signal: 'alembic-config-file',
    });
  }

  for (const alembicEnvFile of alembicEnvFiles) {
    countAreaRuleSignal({
      areasByOwner: sqlAlchemyDatabaseAreasByOwner,
      entry: alembicEnvFile,
      score: SQLALCHEMY_DATABASE_SIGNAL_SCORES['alembic-env-file'],
      signal: 'alembic-env-file',
    });
  }

  for (const alembicVersionFile of alembicVersionFiles) {
    countAreaRuleSignal({
      areasByOwner: sqlAlchemyDatabaseAreasByOwner,
      entry: alembicVersionFile,
      score: SQLALCHEMY_DATABASE_SIGNAL_SCORES['alembic-version-file'],
      signal: 'alembic-version-file',
    });
  }

  for (const alembicScriptTemplateFile of alembicScriptTemplateFiles) {
    countAreaRuleSignal({
      areasByOwner: sqlAlchemyDatabaseAreasByOwner,
      entry: alembicScriptTemplateFile,
      score: SQLALCHEMY_DATABASE_SIGNAL_SCORES['alembic-script-template'],
      signal: 'alembic-script-template',
    });
  }

  for (const sqlAlchemyModelFile of sqlAlchemyModelFiles) {
    countAreaRuleSignal({
      areasByOwner: sqlAlchemyDatabaseAreasByOwner,
      entry: sqlAlchemyModelFile,
      score: SQLALCHEMY_DATABASE_SIGNAL_SCORES['sqlalchemy-model-file'],
      signal: 'sqlalchemy-model-file',
    });
  }

  for (const sqlAlchemyDbFile of sqlAlchemyDbFiles) {
    countAreaRuleSignal({
      areasByOwner: sqlAlchemyDatabaseAreasByOwner,
      entry: sqlAlchemyDbFile,
      score: SQLALCHEMY_DATABASE_SIGNAL_SCORES['sqlalchemy-db-file'],
      signal: 'sqlalchemy-db-file',
    });
  }

  for (const [ownerPath, ownerCandidate] of sqlAlchemyDatabaseAreasByOwner) {
    if (!hasSqlAlchemyDatabaseAppShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Database schema',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'SQLAlchemy',
      relatedTechnologies: ['Alembic', 'Python'],
    });
  }
}
