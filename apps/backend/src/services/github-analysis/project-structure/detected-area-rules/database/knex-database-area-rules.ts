import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

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
 *
 * Evidence is grouped by owner through `resolveUnitRootOwner`, anchored on the
 * `knexfile.*` that `knex init` writes to -- and the Knex CLI reads from -- the
 * project root. A Knex setup in a non-`apps`/`packages` subdirectory, and
 * sibling Knex setups in one repo, then resolve to their own owner instead of
 * collapsing to the repository root; Knex's `migrations/` and `seeds/` folders
 * default to the project root rather than under `src/`, so the generic resolver
 * has no boundary to group them by on its own. A `knexfile` relocated with
 * `--knexfile` to a non-root directory is not a real unit root, so its owner
 * degrades to the generic resolver. The gate always requires a config signal,
 * so an owner never emits without its anchor present.
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
        isAnchorSignal: true,
      },
      {
        signalType: 'knex-custom-config-file',
        regex:
          /(^|\/)(?:_knexfile|knex\.config|knexfile\.[^/]+)\.(?:js|mjs|cjs|ts|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
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
    ownerAdapter: resolveUnitRootOwner,
  });
}
