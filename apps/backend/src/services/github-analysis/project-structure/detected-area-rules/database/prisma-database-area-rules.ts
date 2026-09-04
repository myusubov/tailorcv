import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

const PRISMA_DATABASE_SIGNAL_SCORES = {
  'prisma-schema': 4,
  'prisma-migration-file': 4,
  'prisma-config': 3,
  'prisma-schema-fragment': 2,
  'prisma-migrations-directory': 2,
  'prisma-migration-lock': 2,
} as const;

type PrismaDatabaseSignal = keyof typeof PRISMA_DATABASE_SIGNAL_SCORES;

/**
 * Adds `Database schema` candidates from Prisma path evidence.
 *
 * Evidence is grouped by owner through `resolveUnitRootOwner`, anchored on a
 * root-level `prisma.config.ts` (the Prisma project root by CLI contract, where
 * `package.json` sits). A Prisma setup in a non-`apps`/`packages` subdirectory,
 * and sibling Prisma projects in one repo, then resolve to their own owner
 * instead of collapsing to the repository root. The `.config/prisma.ts` variant
 * stays a non-anchor `prisma-config` match -- it is one level below the project
 * root, so it only feeds the gate and score and its owner comes from the
 * generic resolver. When no config file is present -- the pre-Prisma-7
 * convention of a bare `prisma/schema.prisma` -- every signal falls back to the
 * generic resolver, so `packages/*` and `apps/*` layouts still resolve
 * correctly and other layouts degrade to the repository root as before.
 *
 * Prisma-specific signals stay internal while emitted areas remain role-based.
 */
export function addPrismaDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<PrismaDatabaseSignal>({
    candidates,
    index,
    detectedArea: 'Database schema',
    primaryTech: 'Prisma',
    signalScores: PRISMA_DATABASE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'prisma-schema',
        regex: /^schema\.prisma$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'prisma-schema-fragment',
        regex: /(^|\/)prisma\/(?:.+\/)?(?!schema\.prisma$)[^/]+\.prisma$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'prisma-config',
        regex: /(^|\/)prisma\.config\.(?:ts|js|mjs|cjs|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'prisma-config',
        regex: /(^|\/)\.config\/prisma\.(?:ts|js|mjs|cjs|mts|cts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'prisma-migrations-directory',
        regex: /(^|\/)prisma\/migrations$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'prisma-migration-file',
        regex: /(^|\/)prisma\/migrations\/[^/]+\/migration\.sql$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'prisma-migration-lock',
        regex: /(^|\/)prisma\/migrations\/migration_lock\.toml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            { has: 'prisma-schema' },
            { has: 'prisma-migration-file' },
            { hasAllOf: ['prisma-config', 'prisma-schema-fragment'] },
            { hasAllOf: ['prisma-config', 'prisma-migration-lock'] },
          ],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
