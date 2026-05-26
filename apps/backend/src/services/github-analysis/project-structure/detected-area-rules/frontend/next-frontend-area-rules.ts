import {
  addAreaRuleCandidates,
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type NextFrontendSignal =
  | 'next-config'
  | 'app-router-core'
  | 'app-router-support'
  | 'pages-router-special'
  | 'pages-router-route'
  | 'route-directory';

const NEXT_FRONTEND_SIGNAL_SCORES = {
  'next-config': 4,
  'app-router-core': 4,
  'app-router-support': 2,
  'pages-router-special': 4,
  'pages-router-route': 3,
  'route-directory': 1,
} satisfies AreaRuleSignalScores<NextFrontendSignal>;

/**
 * Adds `Frontend app` candidates from Next.js path evidence.
 * Framework-specific evidence stays internal while emitted areas remain role-based.
 */
export function addNextFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const nextAreasByOwner = createAreaRuleCandidateMap<NextFrontendSignal>();

  const nextConfigFiles = index.findFilesByNameMatching({
    pattern: /^next\.config\./,
  });

  const appRouterCoreFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(src\/)?app\/(?:.*\/)?(page|layout|route)\.(js|jsx|ts|tsx|mdx)$/,
  });

  const appRouterSupportFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(src\/)?app\/(?:.*\/)?(loading|error|global-error|not-found|template|default)\.(js|jsx|ts|tsx|mdx)$/,
  });

  const pagesRouterSpecialFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(src\/)?pages\/(_app|_document|_error)\.(js|jsx|ts|tsx)$/,
  });

  const pagesRouterRouteFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(src\/)?pages\/(?!_app\.|_document\.|_error\.).+\.(js|jsx|ts|tsx)$/,
  });

  const routeDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)(src\/)?(app|pages)$/,
  });

  for (const nextConfigFile of nextConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: nextAreasByOwner,
      entry: nextConfigFile,
      signal: 'next-config',
      score: NEXT_FRONTEND_SIGNAL_SCORES['next-config'],
    });
  }

  for (const appRouterCoreFile of appRouterCoreFiles) {
    countAreaRuleSignal({
      areasByOwner: nextAreasByOwner,
      entry: appRouterCoreFile,
      signal: 'app-router-core',
      score: NEXT_FRONTEND_SIGNAL_SCORES['app-router-core'],
    });
  }

  for (const appRouterSupportFile of appRouterSupportFiles) {
    countAreaRuleSignal({
      areasByOwner: nextAreasByOwner,
      entry: appRouterSupportFile,
      signal: 'app-router-support',
      score: NEXT_FRONTEND_SIGNAL_SCORES['app-router-support'],
    });
  }

  for (const pagesRouterSpecialFile of pagesRouterSpecialFiles) {
    countAreaRuleSignal({
      areasByOwner: nextAreasByOwner,
      entry: pagesRouterSpecialFile,
      signal: 'pages-router-special',
      score: NEXT_FRONTEND_SIGNAL_SCORES['pages-router-special'],
    });
  }

  for (const pagesRouterRouteFile of pagesRouterRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: nextAreasByOwner,
      entry: pagesRouterRouteFile,
      signal: 'pages-router-route',
      score: NEXT_FRONTEND_SIGNAL_SCORES['pages-router-route'],
    });
  }

  for (const routeDirectory of routeDirectories) {
    countAreaRuleSignal({
      areasByOwner: nextAreasByOwner,
      entry: routeDirectory,
      signal: 'route-directory',
      score: NEXT_FRONTEND_SIGNAL_SCORES['route-directory'],
    });
  }

  addAreaRuleCandidates({
    areasByOwner: nextAreasByOwner,
    candidates,
    name: 'Frontend app',
  });
}
