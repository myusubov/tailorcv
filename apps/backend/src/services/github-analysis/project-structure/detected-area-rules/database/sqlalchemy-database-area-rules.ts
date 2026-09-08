import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

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
 *
 * Evidence is grouped by owner through `resolveUnitRootOwner`, anchored on the
 * `alembic.ini` file that `alembic init` writes to the project root. A
 * per-service `alembic.ini` in a non-`apps`/`packages` subdirectory, and
 * sibling services each with their own `alembic.ini`, then resolve to their own
 * owner instead of collapsing to the repository root. A single repository-root
 * `alembic.ini` that fans out to several services via `version_locations`
 * anchors the repository root, whose `.` owner does not claim the sub-service
 * paths, so those still fall back to the generic resolver exactly as today.
 * When no `alembic.ini` is committed, every signal falls back to the generic
 * resolver and the env-plus-versions gate branch still applies.
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
        isAnchorSignal: true,
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
    ownerAdapter: resolveUnitRootOwner,
  });
}
