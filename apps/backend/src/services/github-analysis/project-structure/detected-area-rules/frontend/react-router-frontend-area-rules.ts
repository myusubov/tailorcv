import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

type ReactRouterFrontendSignal =
  | 'react-router-config'
  | 'react-router-root-route'
  | 'react-router-routes-config'
  | 'react-router-entry-client'
  | 'react-router-entry-server'
  | 'react-router-file-route'
  | 'react-router-routes-directory'
  | 'react-router-vite-config';

type ReactRouterAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<ReactRouterFrontendSignal>;
};

const REACT_ROUTER_FRONTEND_SIGNAL_SCORES = {
  'react-router-config': 4,
  'react-router-root-route': 4,
  'react-router-routes-config': 4,
  'react-router-entry-client': 3,
  'react-router-entry-server': 3,
  'react-router-file-route': 3,
  'react-router-routes-directory': 1,
  'react-router-vite-config': 1,
} satisfies Record<ReactRouterFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from React Router framework path evidence.
 * React Router-specific signals stay internal while detected areas remain role-based.
 */
export function addReactRouterFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const reactRouterAreasByOwner = new Map<
    string,
    ReactRouterAreaCandidate
  >();

  const reactRouterConfigFiles = index.findFilesByNameMatching({
    pattern: /^react-router\.config\.(js|mjs|cjs|ts)$/,
  });

  const reactRouterRootRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/root\.(js|jsx|ts|tsx)$/,
  });

  const reactRouterRoutesConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/routes\.(js|ts)$/,
  });

  const reactRouterEntryClientFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/entry\.client\.(js|jsx|ts|tsx)$/,
  });

  const reactRouterEntryServerFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/entry\.server\.(js|jsx|ts|tsx)$/,
  });

  const reactRouterFileRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/routes\/(?:.*\/)?.+\.(js|jsx|ts|tsx)$/,
  });

  const reactRouterRoutesDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)app\/routes$/,
  });

  const reactRouterViteConfigFiles = index.findFilesByNameMatching({
    pattern: /^vite\.config\.(js|mjs|cjs|ts)$/,
  });

  for (const reactRouterConfigFile of reactRouterConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouterConfigFile.path,
    });
    const ownerCandidate =
      reactRouterAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactRouterFrontendSignal>(),
      } satisfies ReactRouterAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-router-config')) {
      ownerCandidate.score +=
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-config'];
      ownerCandidate.evidence.push(reactRouterConfigFile.path);
      ownerCandidate.countedSignals.add('react-router-config');
    }

    reactRouterAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRouterRootRouteFile of reactRouterRootRouteFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouterRootRouteFile.path,
    });
    const ownerCandidate =
      reactRouterAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactRouterFrontendSignal>(),
      } satisfies ReactRouterAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-router-root-route')) {
      ownerCandidate.score +=
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-root-route'];
      ownerCandidate.evidence.push(reactRouterRootRouteFile.path);
      ownerCandidate.countedSignals.add('react-router-root-route');
    }

    reactRouterAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRouterRoutesConfigFile of reactRouterRoutesConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouterRoutesConfigFile.path,
    });
    const ownerCandidate =
      reactRouterAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactRouterFrontendSignal>(),
      } satisfies ReactRouterAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-router-routes-config')) {
      ownerCandidate.score +=
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-routes-config'];
      ownerCandidate.evidence.push(reactRouterRoutesConfigFile.path);
      ownerCandidate.countedSignals.add('react-router-routes-config');
    }

    reactRouterAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRouterEntryClientFile of reactRouterEntryClientFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouterEntryClientFile.path,
    });
    const ownerCandidate =
      reactRouterAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactRouterFrontendSignal>(),
      } satisfies ReactRouterAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-router-entry-client')) {
      ownerCandidate.score +=
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-entry-client'];
      ownerCandidate.evidence.push(reactRouterEntryClientFile.path);
      ownerCandidate.countedSignals.add('react-router-entry-client');
    }

    reactRouterAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRouterEntryServerFile of reactRouterEntryServerFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouterEntryServerFile.path,
    });
    const ownerCandidate =
      reactRouterAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactRouterFrontendSignal>(),
      } satisfies ReactRouterAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-router-entry-server')) {
      ownerCandidate.score +=
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-entry-server'];
      ownerCandidate.evidence.push(reactRouterEntryServerFile.path);
      ownerCandidate.countedSignals.add('react-router-entry-server');
    }

    reactRouterAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRouterFileRouteFile of reactRouterFileRouteFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouterFileRouteFile.path,
    });
    const ownerCandidate =
      reactRouterAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactRouterFrontendSignal>(),
      } satisfies ReactRouterAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-router-file-route')) {
      ownerCandidate.score +=
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-file-route'];
      ownerCandidate.evidence.push(reactRouterFileRouteFile.path);
      ownerCandidate.countedSignals.add('react-router-file-route');
    }

    reactRouterAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRouterRoutesDirectory of reactRouterRoutesDirectories) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouterRoutesDirectory.path,
    });
    const ownerCandidate =
      reactRouterAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactRouterFrontendSignal>(),
      } satisfies ReactRouterAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-router-routes-directory')) {
      ownerCandidate.score +=
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES[
          'react-router-routes-directory'
        ];
      ownerCandidate.evidence.push(reactRouterRoutesDirectory.path);
      ownerCandidate.countedSignals.add('react-router-routes-directory');
    }

    reactRouterAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRouterViteConfigFile of reactRouterViteConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouterViteConfigFile.path,
    });
    const ownerCandidate =
      reactRouterAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactRouterFrontendSignal>(),
      } satisfies ReactRouterAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-router-vite-config')) {
      ownerCandidate.score +=
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-vite-config'];
      ownerCandidate.evidence.push(reactRouterViteConfigFile.path);
      ownerCandidate.countedSignals.add('react-router-vite-config');
    }

    reactRouterAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const [ownerPath, ownerCandidate] of reactRouterAreasByOwner) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
