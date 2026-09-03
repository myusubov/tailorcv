import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const TYPEORM_DATABASE_SIGNAL_SCORES = {
  'typeorm-legacy-config-file': 4,
  'typeorm-data-source-file': 3,
  'typeorm-example-config-file': 2,
  'typeorm-entity-file': 2,
  'typeorm-migration-file': 2,
} as const;

type TypeOrmDatabaseSignal = keyof typeof TYPEORM_DATABASE_SIGNAL_SCORES;

/**
 * Adds `Database schema` candidates from TypeORM path evidence.
 * Entity-schema files are intentionally excluded because `*.schema.*` is too
 * broad without source-content confirmation.
 */
export function addTypeOrmDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<TypeOrmDatabaseSignal>({
    candidates,
    index,
    detectedArea: 'Database schema',
    primaryTech: 'TypeORM',
    signalScores: TYPEORM_DATABASE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'typeorm-legacy-config-file',
        regex: /(^|\/)ormconfig\.(?:json|js|cjs|mjs|ts|cts|mts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'typeorm-example-config-file',
        regex:
          /(^|\/)(?:ormconfig\.(?:json|js|cjs|mjs|ts|cts|mts)\.example|ormconfig\.example\.(?:json|js|cjs|mjs|ts|cts|mts))$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'typeorm-data-source-file',
        regex:
          /(^|\/)(?:data-source|datasource|app-data-source)\.(?:ts|js|mjs|cjs|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'typeorm-entity-file',
        regex:
          /(^|\/)(?:[^/]+\.entity|(?:entities?|entity)\/(?:.+\/)?[^/]+)\.(?:ts|js|mjs|cjs|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'typeorm-migration-file',
        regex:
          /(^|\/)migrations?(?:\/[^/]+)*\/(?:\d{10,}[-_][^/]+|migration\d{8,}[^/]*)\.(?:ts|js|mjs|cjs|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              hasOneOf: [
                'typeorm-legacy-config-file',
                'typeorm-data-source-file',
              ],
              has: 'typeorm-entity-file',
            },
            {
              hasOneOf: [
                'typeorm-legacy-config-file',
                'typeorm-data-source-file',
              ],
              has: 'typeorm-migration-file',
            },
            {
              hasAllOf: ['typeorm-example-config-file', 'typeorm-entity-file'],
            },
            {
              hasAllOf: ['typeorm-entity-file', 'typeorm-migration-file'],
            },
          ],
        },
      },
    },
  });
}
