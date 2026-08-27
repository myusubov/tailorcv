import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const KNEX_DATABASE_SIGNAL_SCORES = {
  'knex-config-file': 4,
  'knex-custom-config-file': 3,
  'knex-migration-file': 2,
  'knex-seed-file': 2,
} as const;

type KnexDatabaseSignal = keyof typeof KNEX_DATABASE_SIGNAL_SCORES;

/**
 * Adds `Database schema` candidates from Knex path evidence. Knex config is
 * always required because migration and seed folders are too generic to
 * prove Knex usage by themselves.
 */
export function addKnexDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<KnexDatabaseSignal>({
    candidates,
    index,
    detectedArea: 'Database schema',
    primaryTech: 'Knex',
    signalScores: KNEX_DATABASE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'knex-config-file',
        regex: /(^|\/)knexfile\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'knex-custom-config-file',
        regex:
          /(^|\/)(?:_knexfile|knex\.config|knexfile\.[^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'knex-migration-file',
        regex:
          /(^|\/)(?:(?:db|database)\/)?migrations?\/(?:.+\/)?(?:\d{12,}[-_][^/]+|\d{1,4}[-_][^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'knex-seed-file',
        regex:
          /(^|\/)(?:(?:db|database)\/)?seeds?\/(?:.+\/)?[^/]+\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: ['knex-config-file', 'knex-custom-config-file'],
          or: [{ has: 'knex-migration-file' }, { has: 'knex-seed-file' }],
        },
      },
    },
  });
}
