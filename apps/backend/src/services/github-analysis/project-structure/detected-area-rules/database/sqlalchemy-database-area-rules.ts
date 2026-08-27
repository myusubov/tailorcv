import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const SQLALCHEMY_DATABASE_SIGNAL_SCORES = {
  'alembic-config-file': 3,
  'alembic-env-file': 3,
  'alembic-version-file': 3,
  'alembic-script-template': 2,
  'sqlalchemy-model-file': 2,
  'sqlalchemy-db-file': 2,
} as const;

type SqlAlchemyDatabaseSignal = keyof typeof SQLALCHEMY_DATABASE_SIGNAL_SCORES;

/**
 * Adds `Database schema` candidates from SQLAlchemy and Alembic path
 * evidence. Alembic is treated as migration support for SQLAlchemy-owned
 * database areas.
 */
export function addSqlAlchemyDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<SqlAlchemyDatabaseSignal>({
    candidates,
    index,
    detectedArea: 'Database schema',
    primaryTech: 'SQLAlchemy',
    relatedTechs: ['Alembic', 'Python'],
    signalScores: SQLALCHEMY_DATABASE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'alembic-config-file',
        regex: /(^|\/)alembic\.ini$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'alembic-env-file',
        regex: /(^|\/)(?:alembic|migrations|_migrations)\/env\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'alembic-version-file',
        regex:
          /(^|\/)(?:alembic|migrations|_migrations)\/versions(?:\/[^/]+)*\/[^/]+\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'alembic-script-template',
        regex: /(^|\/)(?:alembic|migrations|_migrations)\/script\.py\.mako$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sqlalchemy-model-file',
        regex: /(^|\/)(?:models\.py|orm_models\.py|models\/.+\.py)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sqlalchemy-db-file',
        regex: /(^|\/)(?:db|database|session|base|base_class)\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            { hasAllOf: ['alembic-env-file', 'alembic-version-file'] },
            {
              hasOneOf: [
                'alembic-config-file',
                'alembic-env-file',
                'alembic-version-file',
              ],
              or: [
                { has: 'sqlalchemy-model-file' },
                { has: 'sqlalchemy-db-file' },
              ],
            },
          ],
        },
      },
    },
  });
}
