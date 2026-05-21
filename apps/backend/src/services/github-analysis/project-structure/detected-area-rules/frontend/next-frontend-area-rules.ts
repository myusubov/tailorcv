import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

type NextFrontendSignal =
  | 'next-config'
  | 'app-router'
  | 'pages-router'
  | 'route-directory';

interface NextFrontendEvidence {
  path: string;
  signals: Set<NextFrontendSignal>;
  evidenceBySignal: Map<NextFrontendSignal, string>;
}

const NEXT_FRONTEND_SIGNAL_SCORES = {
  'next-config': 4,
  'app-router': 4,
  'pages-router': 3,
  'route-directory': 2,
} satisfies Record<NextFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from Next.js path evidence.
 * Framework-specific evidence stays internal while emitted areas remain role-based.
 */
export function addNextFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const evidenceByOwner = new Map<string, NextFrontendEvidence>();
  const nextConfigFiles = index.findFilesByNameMatching({
    pattern: /^next\.config\./,
  });
  const appRouterFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(src\/)?app\/(?:.*\/)?(page|layout|loading|error|global-error|not-found|template|default|route)\.(js|jsx|ts|tsx|mdx)$/,
  });
  const pagesRouterFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(src\/)?pages\/.*\.(js|jsx|ts|tsx|mdx)$/,
  });
  const routeDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)(src\/)?(app|pages)$/,
  });

  for (const entry of nextConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({ path: entry.path });
    const ownerEvidence =
      evidenceByOwner.get(ownerPath) ??
      ({
        path: ownerPath,
        signals: new Set<NextFrontendSignal>(),
        evidenceBySignal: new Map<NextFrontendSignal, string>(),
      } satisfies NextFrontendEvidence);

    ownerEvidence.signals.add('next-config');
    if (!ownerEvidence.evidenceBySignal.has('next-config')) {
      ownerEvidence.evidenceBySignal.set('next-config', entry.path);
    }
    evidenceByOwner.set(ownerPath, ownerEvidence);
  }

  for (const entry of appRouterFiles) {
    const ownerPath = ownerPathForApplicationArea({ path: entry.path });
    const ownerEvidence =
      evidenceByOwner.get(ownerPath) ??
      ({
        path: ownerPath,
        signals: new Set<NextFrontendSignal>(),
        evidenceBySignal: new Map<NextFrontendSignal, string>(),
      } satisfies NextFrontendEvidence);

    ownerEvidence.signals.add('app-router');
    if (!ownerEvidence.evidenceBySignal.has('app-router')) {
      ownerEvidence.evidenceBySignal.set('app-router', entry.path);
    }
    evidenceByOwner.set(ownerPath, ownerEvidence);
  }

  for (const entry of pagesRouterFiles) {
    const ownerPath = ownerPathForApplicationArea({ path: entry.path });
    const ownerEvidence =
      evidenceByOwner.get(ownerPath) ??
      ({
        path: ownerPath,
        signals: new Set<NextFrontendSignal>(),
        evidenceBySignal: new Map<NextFrontendSignal, string>(),
      } satisfies NextFrontendEvidence);

    ownerEvidence.signals.add('pages-router');
    if (!ownerEvidence.evidenceBySignal.has('pages-router')) {
      ownerEvidence.evidenceBySignal.set('pages-router', entry.path);
    }
    evidenceByOwner.set(ownerPath, ownerEvidence);
  }

  for (const entry of routeDirectories) {
    const ownerPath = ownerPathForApplicationArea({ path: entry.path });
    const ownerEvidence =
      evidenceByOwner.get(ownerPath) ??
      ({
        path: ownerPath,
        signals: new Set<NextFrontendSignal>(),
        evidenceBySignal: new Map<NextFrontendSignal, string>(),
      } satisfies NextFrontendEvidence);

    ownerEvidence.signals.add('route-directory');
    if (!ownerEvidence.evidenceBySignal.has('route-directory')) {
      ownerEvidence.evidenceBySignal.set('route-directory', entry.path);
    }
    evidenceByOwner.set(ownerPath, ownerEvidence);
  }

  for (const ownerEvidence of evidenceByOwner.values()) {
    let score = 0;
    for (const signal of ownerEvidence.signals) {
      score += NEXT_FRONTEND_SIGNAL_SCORES[signal];
    }

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerEvidence.path,
      score,
      evidence: [...ownerEvidence.evidenceBySignal.values()],
    });
  }
}
