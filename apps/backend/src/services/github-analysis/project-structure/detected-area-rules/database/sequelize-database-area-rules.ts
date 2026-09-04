import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

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
 *
 * Evidence is grouped by owner through `resolveUnitRootOwner`, anchored on the
 * `.sequelizerc` file that sequelize-cli only honours when run from the
 * directory containing it (the project root). A Sequelize setup in a
 * non-`apps`/`packages` subdirectory, and sibling Sequelize setups in one repo,
 * then resolve to their own owner instead of collapsing to the repository root
 * -- sequelize-cli places `config/`, `models/`, `migrations/`, and `seeders/`
 * at the project root rather than under `src/`, so the generic resolver has no
 * boundary to group them by on its own. When no `.sequelizerc` is committed
 * every signal falls back to the generic resolver and the config-plus-model
 * gate branches still apply.
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
        isAnchorSignal: true,
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
              hasAllOf: [
                'sequelize-cli-config-file',
                'sequelize-migration-file',
              ],
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
    ownerAdapter: resolveUnitRootOwner,
  });
}
