import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

const NEXT_FRONTEND_SIGNAL_SCORES = {
  'next-config': 4,
  'app-router-core': 4,
  'pages-router-special': 4,
  'pages-router-route': 3,
  'app-router-support': 2,
  'route-directory': 1,
} as const;

type NextFrontendSignal = keyof typeof NEXT_FRONTEND_SIGNAL_SCORES;

/**
 * Adds `Frontend app` candidates from Next.js path evidence.
 * Framework-specific evidence stays internal while emitted areas remain role-based.
 */
export function addNextFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<NextFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'Next.js',
    relatedTechs: ['React'],
    signalScores: NEXT_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'next-config',
        regex: /^next\.config\./,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'app-router-core',
        regex:
          /(^|\/)(src\/)?app\/(?:.*\/)?(page|layout|route)\.(js|jsx|ts|tsx|mdx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'app-router-support',
        regex:
          /(^|\/)(src\/)?app\/(?:.*\/)?(loading|error|global-error|not-found|template|default)\.(js|jsx|ts|tsx|mdx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'pages-router-special',
        regex: /(^|\/)(src\/)?pages\/(_app|_document|_error)\.(js|jsx|ts|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'pages-router-route',
        regex:
          /(^|\/)(src\/)?pages\/(?!_app\.|_document\.|_error\.).+\.(js|jsx|ts|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'route-directory',
        regex: /(^|\/)(src\/)?(app|pages)$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: ['next-config', 'app-router-core', 'pages-router-special'],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
