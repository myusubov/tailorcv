import {
  addAreaRuleCandidates,
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type ReactRouterFrontendSignal =
  | 'react-router-config'
  | 'react-router-root-route'
  | 'react-router-routes-config'
  | 'react-router-entry-client'
  | 'react-router-entry-server'
  | 'react-router-file-route'
  | 'react-router-routes-directory'
  | 'react-router-vite-config';

const REACT_ROUTER_FRONTEND_SIGNAL_SCORES = {
  'react-router-config': 4,
  'react-router-root-route': 4,
  'react-router-routes-config': 4,
  'react-router-entry-client': 3,
  'react-router-entry-server': 3,
  'react-router-file-route': 3,
  'react-router-routes-directory': 1,
  'react-router-vite-config': 1,
} satisfies AreaRuleSignalScores<ReactRouterFrontendSignal>;

/**
 * Adds `Frontend app` candidates from React Router framework path evidence.
 * React Router-specific signals stay internal while detected areas remain role-based.
 */
export function addReactRouterFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const reactRouterAreasByOwner =
    createAreaRuleCandidateMap<ReactRouterFrontendSignal>();

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
    countAreaRuleSignal({
      areasByOwner: reactRouterAreasByOwner,
      entry: reactRouterConfigFile,
      signal: 'react-router-config',
      score: REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-config'],
    });
  }

  for (const reactRouterRootRouteFile of reactRouterRootRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: reactRouterAreasByOwner,
      entry: reactRouterRootRouteFile,
      signal: 'react-router-root-route',
      score: REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-root-route'],
    });
  }

  for (const reactRouterRoutesConfigFile of reactRouterRoutesConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: reactRouterAreasByOwner,
      entry: reactRouterRoutesConfigFile,
      signal: 'react-router-routes-config',
      score: REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-routes-config'],
    });
  }

  for (const reactRouterEntryClientFile of reactRouterEntryClientFiles) {
    countAreaRuleSignal({
      areasByOwner: reactRouterAreasByOwner,
      entry: reactRouterEntryClientFile,
      signal: 'react-router-entry-client',
      score: REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-entry-client'],
    });
  }

  for (const reactRouterEntryServerFile of reactRouterEntryServerFiles) {
    countAreaRuleSignal({
      areasByOwner: reactRouterAreasByOwner,
      entry: reactRouterEntryServerFile,
      signal: 'react-router-entry-server',
      score: REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-entry-server'],
    });
  }

  for (const reactRouterFileRouteFile of reactRouterFileRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: reactRouterAreasByOwner,
      entry: reactRouterFileRouteFile,
      signal: 'react-router-file-route',
      score: REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-file-route'],
    });
  }

  for (const reactRouterRoutesDirectory of reactRouterRoutesDirectories) {
    countAreaRuleSignal({
      areasByOwner: reactRouterAreasByOwner,
      entry: reactRouterRoutesDirectory,
      signal: 'react-router-routes-directory',
      score:
        REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-routes-directory'],
    });
  }

  for (const reactRouterViteConfigFile of reactRouterViteConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: reactRouterAreasByOwner,
      entry: reactRouterViteConfigFile,
      signal: 'react-router-vite-config',
      score: REACT_ROUTER_FRONTEND_SIGNAL_SCORES['react-router-vite-config'],
    });
  }

  addAreaRuleCandidates({
    areasByOwner: reactRouterAreasByOwner,
    candidates,
    name: 'Frontend app',
  });
}
