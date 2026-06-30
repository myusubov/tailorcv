import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addPrismaDatabaseAreas } from './prisma-database-area-rules';

/**
 * Applies database-specific detected-area rules.
 * Database detectors identify schema and migration ownership separately from
 * frontend or backend application ownership.
 */
export function addDatabaseAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addPrismaDatabaseAreas({ candidates, index });
}
