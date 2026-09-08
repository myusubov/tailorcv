import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

const DRIZZLE_DATABASE_SIGNAL_SCORES = {
  'drizzle-config': 4,
  'drizzle-custom-config': 4,
  'drizzle-schema-file': 2,
  'drizzle-migration-sql-file': 2,
  'drizzle-migration-journal': 2,
  'drizzle-migration-snapshot': 2,
} as const;

type DrizzleDatabaseSignal = keyof typeof DRIZZLE_DATABASE_SIGNAL_SCORES;

/**
 * Adds `Database schema` candidates from Drizzle path evidence.
 *
 * Evidence is grouped by owner through `resolveUnitRootOwner`, anchored on the
 * `drizzle.config.*` file (or a `drizzle-<name>.config.*` variant) that
 * drizzle-kit reads from the project root by default. A Drizzle setup in a
 * non-`apps`/`packages` subdirectory, and sibling Drizzle setups in one repo,
 * then resolve to their own owner instead of collapsing to the repository root.
 * A config relocated with `--config` to a non-root directory is not a real unit
 * root, so its owner degrades to the generic resolver; when no config file is
 * present every signal falls back to the generic resolver, so `packages/*` and
 * `apps/*` layouts still resolve correctly.
 *
 * Drizzle-specific signals stay internal while emitted areas remain role-based.
 */
export function addDrizzleDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<DrizzleDatabaseSignal>({
    candidates,
    index,
    detectedArea: 'Database schema',
    primaryTech: 'Drizzle',
    signalScores: DRIZZLE_DATABASE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'drizzle-config',
        regex: /(^|\/)drizzle\.config\.(?:ts|js|mjs|cjs|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'drizzle-custom-config',
        regex: /(^|\/)drizzle-[^/]+\.config\.(?:ts|js|mjs|cjs|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'drizzle-schema-file',
        regex:
          /(^|\/)(?:(?:src|lib)\/db\/schema(?:\/.+)?|src\/lib\/db\/schema(?:\/.+)?|db\/schema(?:\/.+)?|(?:[^/]+\/)*db\/src\/schema(?:\/.+)?|internal\/db\/src\/schema(?:\/.+)?)\.(?:ts|js|mjs|cjs|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'drizzle-migration-sql-file',
        regex: /(^|\/)(?:drizzle|migrations)(?:\/[^/]+)?\/[^/]+\.sql$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'drizzle-migration-journal',
        regex: /(^|\/)meta\/_journal\.json$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'drizzle-migration-snapshot',
        regex: /(^|\/)(?:meta\/[^/]+_snapshot\.json|[^/]+\/snapshot\.json)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              hasOneOf: ['drizzle-config', 'drizzle-custom-config'],
              has: 'drizzle-schema-file',
            },
            {
              hasOneOf: ['drizzle-config', 'drizzle-custom-config'],
              or: [
                { has: 'drizzle-migration-sql-file' },
                { has: 'drizzle-migration-journal' },
                { has: 'drizzle-migration-snapshot' },
              ],
            },
            {
              has: 'drizzle-migration-sql-file',
              hasOneOf: [
                'drizzle-migration-journal',
                'drizzle-migration-snapshot',
              ],
            },
          ],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
