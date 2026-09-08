import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

const REACT_ROUTER_FRONTEND_SIGNAL_SCORES = {
  'react-router-config': 4,
  'react-router-root-route': 4,
  'react-router-routes-config': 4,
  'react-router-entry-client': 3,
  'react-router-entry-server': 3,
  'react-router-file-route': 3,
  'react-router-routes-directory': 1,
  'react-router-vite-config': 1,
} as const;

type ReactRouterFrontendSignal =
  keyof typeof REACT_ROUTER_FRONTEND_SIGNAL_SCORES;

/**
 * Adds `Frontend app` candidates from React Router framework path evidence.
 * React Router-specific signals stay internal while detected areas remain
 * role-based.
 */
export function addReactRouterFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<ReactRouterFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'React Router',
    relatedTechs: ['React'],
    signalScores: REACT_ROUTER_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'react-router-config',
        regex: /^react-router\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'react-router-root-route',
        regex: /(^|\/)app\/root\.(js|jsx|ts|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-router-routes-config',
        regex: /(^|\/)app\/routes\.(js|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-router-entry-client',
        regex: /(^|\/)app\/entry\.client\.(js|jsx|ts|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-router-entry-server',
        regex: /(^|\/)app\/entry\.server\.(js|jsx|ts|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-router-file-route',
        regex: /(^|\/)app\/routes\/(?:.*\/)?.+\.(js|jsx|ts|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-router-routes-directory',
        regex: /(^|\/)app\/routes$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'react-router-vite-config',
        regex: /^vite\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            { has: 'react-router-config' },
            {
              hasAllOf: [
                'react-router-root-route',
                'react-router-routes-config',
              ],
            },
            {
              hasAllOf: ['react-router-root-route', 'react-router-file-route'],
            },
            {
              has: 'react-router-root-route',
              or: [
                { has: 'react-router-entry-client' },
                { has: 'react-router-entry-server' },
              ],
            },
          ],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
