import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

/**
 * Adds `Frontend app` candidates from Next.js path evidence.
 * Framework-specific evidence stays internal while emitted areas remain role-based.
 */
export function addNextFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const nextConfigFiles = index.findFilesByNameMatching({
    pattern: /^next\.config\./,
  });
  const appRouterFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(src\/)?app\/(.+\/)?(page|layout|loading|error|not-found)\.(js|jsx|ts|tsx|mdx)$/,
  });
  const pagesRouterFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(src\/)?pages\/.*\.(js|jsx|ts|tsx|mdx)$/,
  });
  const routeDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)(src\/)?(app|pages)$/,
  });

  for (const entry of nextConfigFiles) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPathForApplicationArea({ path: entry.path }),
      score: 4,
      evidence: [entry.path],
    });
  }

  for (const entry of appRouterFiles) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPathForApplicationArea({ path: entry.path }),
      score: 4,
      evidence: [entry.path],
    });
  }

  for (const entry of pagesRouterFiles) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPathForApplicationArea({ path: entry.path }),
      score: 4,
      evidence: [entry.path],
    });
  }

  for (const entry of routeDirectories) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPathForApplicationArea({ path: entry.path }),
      score: 3,
      evidence: [entry.path],
    });
  }
}
