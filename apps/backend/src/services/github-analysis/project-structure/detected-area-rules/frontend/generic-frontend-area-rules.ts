import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

/**
 * Adds `Frontend app` candidates from generic frontend tooling evidence.
 * Vite-specific evidence is handled first; React SPA and static site rules come later.
 */
export function addGenericFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const reactEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/index\.(js|jsx|ts|tsx)$/,
  });

  for (const entry of reactEntryFiles) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPathForApplicationArea({ path: entry.path }),
      score: 3,
      evidence: [entry.path],
      primaryTechnology: 'React',
      relatedTechnologies: [],
    });
  }
}
