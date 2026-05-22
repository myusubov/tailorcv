import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

type NextFrontendSignal =
  | 'next-config'
  | 'app-router-core'
  | 'app-router-support'
  | 'pages-router-special'
  | 'pages-router-route'
  | 'route-directory';

type NextAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<NextFrontendSignal>;
};

const NEXT_FRONTEND_SIGNAL_SCORES = {
  'next-config': 4,
  'app-router-core': 4,
  'app-router-support': 2,
  'pages-router-special': 4,
  'pages-router-route': 3,
  'route-directory': 1,
} satisfies Record<NextFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from Next.js path evidence.
 * Framework-specific evidence stays internal while emitted areas remain role-based.
 */
export function addNextFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const nextAreasByOwner = new Map<string, NextAreaCandidate>();

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
    const ownerPath = ownerPathForApplicationArea({
      path: nextConfigFile.path,
    });
    const ownerCandidate =
      nextAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NextFrontendSignal>(),
      } satisfies NextAreaCandidate);

    if (!ownerCandidate.countedSignals.has('next-config')) {
      ownerCandidate.score += NEXT_FRONTEND_SIGNAL_SCORES['next-config'];
      ownerCandidate.evidence.push(nextConfigFile.path);
      ownerCandidate.countedSignals.add('next-config');
    }

    nextAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const appRouterCoreFile of appRouterCoreFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: appRouterCoreFile.path,
    });
    const ownerCandidate =
      nextAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NextFrontendSignal>(),
      } satisfies NextAreaCandidate);

    if (!ownerCandidate.countedSignals.has('app-router-core')) {
      ownerCandidate.score += NEXT_FRONTEND_SIGNAL_SCORES['app-router-core'];
      ownerCandidate.evidence.push(appRouterCoreFile.path);
      ownerCandidate.countedSignals.add('app-router-core');
    }

    nextAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const appRouterSupportFile of appRouterSupportFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: appRouterSupportFile.path,
    });
    const ownerCandidate =
      nextAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NextFrontendSignal>(),
      } satisfies NextAreaCandidate);

    if (!ownerCandidate.countedSignals.has('app-router-support')) {
      ownerCandidate.score += NEXT_FRONTEND_SIGNAL_SCORES['app-router-support'];
      ownerCandidate.evidence.push(appRouterSupportFile.path);
      ownerCandidate.countedSignals.add('app-router-support');
    }

    nextAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const pagesRouterSpecialFile of pagesRouterSpecialFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: pagesRouterSpecialFile.path,
    });
    const ownerCandidate =
      nextAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NextFrontendSignal>(),
      } satisfies NextAreaCandidate);

    if (!ownerCandidate.countedSignals.has('pages-router-special')) {
      ownerCandidate.score +=
        NEXT_FRONTEND_SIGNAL_SCORES['pages-router-special'];
      ownerCandidate.evidence.push(pagesRouterSpecialFile.path);
      ownerCandidate.countedSignals.add('pages-router-special');
    }

    nextAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const pagesRouterRouteFile of pagesRouterRouteFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: pagesRouterRouteFile.path,
    });
    const ownerCandidate =
      nextAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NextFrontendSignal>(),
      } satisfies NextAreaCandidate);

    if (!ownerCandidate.countedSignals.has('pages-router-route')) {
      ownerCandidate.score += NEXT_FRONTEND_SIGNAL_SCORES['pages-router-route'];
      ownerCandidate.evidence.push(pagesRouterRouteFile.path);
      ownerCandidate.countedSignals.add('pages-router-route');
    }

    nextAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const routeDirectory of routeDirectories) {
    const ownerPath = ownerPathForApplicationArea({
      path: routeDirectory.path,
    });
    const ownerCandidate =
      nextAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NextFrontendSignal>(),
      } satisfies NextAreaCandidate);

    if (!ownerCandidate.countedSignals.has('route-directory')) {
      ownerCandidate.score += NEXT_FRONTEND_SIGNAL_SCORES['route-directory'];
      ownerCandidate.evidence.push(routeDirectory.path);
      ownerCandidate.countedSignals.add('route-directory');
    }

    nextAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const [ownerPath, ownerCandidate] of nextAreasByOwner) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
