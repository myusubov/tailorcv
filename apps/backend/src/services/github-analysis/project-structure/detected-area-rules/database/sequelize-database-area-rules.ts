import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const SEQUELIZE_DATABASE_SIGNAL_SCORES = {
  'sequelize-cli-config-file': 4,
  'sequelize-config-file': 2,
  'sequelize-model-file': 2,
  'sequelize-model-index-file': 2,
  'sequelize-migration-file': 2,
  'sequelize-seeder-file': 2,
} as const;

type SequelizeDatabaseSignal = keyof typeof SEQUELIZE_DATABASE_SIGNAL_SCORES;

/**
 * Adds `Database schema` candidates from Sequelize path evidence. Generic
 * model, migration, config, and seeder paths remain support signals and do
 * not emit Sequelize unless combined.
 */
export function addSequelizeDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<SequelizeDatabaseSignal>({
    candidates,
    index,
    detectedArea: 'Database schema',
    primaryTech: 'Sequelize',
    signalScores: SEQUELIZE_DATABASE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'sequelize-cli-config-file',
        regex: /(^|\/)\.sequelizerc(?:\.js)?$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sequelize-config-file',
        regex:
          /(^|\/)(?:(?:config|sequelize|db|database)\/(?:config|database)|(?:sequelize|db|database)\/config\/(?:config|database)|(?:[^/]+\/)*(?:sequelize|db|database)\/config\/(?:config|database))\.(?:json|js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sequelize-model-index-file',
        regex:
          /(^|\/)(?:(?:models?|sequelize\/models|db\/models|database\/models)\/index|(?:[^/]+\/)*sequelize\/models\/index|(?:[^/]+\/)*(?:db|database)\/models\/index)\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sequelize-model-file',
        regex:
          /(^|\/)(?:(?:models?|sequelize\/models|db\/models|database\/models)\/(?:.+\/)?(?!index\.)[^/]+|(?:[^/]+\/)*sequelize\/models\/(?:.+\/)?(?!index\.)[^/]+|(?:[^/]+\/)*(?:db|database)\/models\/(?:.+\/)?(?!index\.)[^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sequelize-migration-file',
        regex:
          /(^|\/)(?:(?:migrations?|sequelize\/migrations?|db\/migrations?|database\/migrations?)\/(?:.+\/)?|(?:[^/]+\/)*(?:sequelize|db|database)\/migrations?\/(?:.+\/)?)(?:\d{12,}[-_][^/]+|\d{1,4}[-_][^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sequelize-seeder-file',
        regex:
          /(^|\/)(?:(?:seeders?|sequelize\/seeders?|db\/seeders?|database\/seeders?)\/(?:.+\/)?|(?:[^/]+\/)*(?:sequelize|db|database)\/seeders?\/(?:.+\/)?)(?:\d{12,}[-_][^/]+|\d{1,4}[-_][^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              has: 'sequelize-cli-config-file',
              hasOneOf: ['sequelize-model-file', 'sequelize-model-index-file'],
            },
            {
              hasAllOf: ['sequelize-cli-config-file', 'sequelize-migration-file'],
            },
            {
              hasAllOf: ['sequelize-cli-config-file', 'sequelize-seeder-file'],
            },
            {
              hasAllOf: ['sequelize-config-file', 'sequelize-migration-file'],
              hasOneOf: ['sequelize-model-file', 'sequelize-model-index-file'],
            },
            {
              hasOneOf: ['sequelize-model-file', 'sequelize-model-index-file'],
              has: 'sequelize-migration-file',
            },
            {
              hasAllOf: [
                'sequelize-config-file',
                'sequelize-migration-file',
                'sequelize-seeder-file',
              ],
            },
          ],
        },
      },
    },
  });
}
