import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

const ASTRO_FRONTEND_SIGNAL_SCORES = {
  'astro-config': 4,
  'astro-page': 4,
  'astro-layout': 2,
  'astro-endpoint': 2,
  'astro-component': 2,
  'astro-content-page': 1,
  'astro-pages-directory': 1,
} as const;

type AstroFrontendSignal = keyof typeof ASTRO_FRONTEND_SIGNAL_SCORES;

/**
 * Adds `Frontend app` candidates from Astro path evidence.
 * Astro-specific signals stay internal while emitted areas remain role-based.
 */
export function addAstroFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<AstroFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'Astro',
    signalScores: ASTRO_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'astro-config',
        regex: /^astro\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'astro-page',
        regex: /(^|\/)src\/pages\/(?:.*\/)?.+\.astro$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'astro-content-page',
        regex: /(^|\/)src\/pages\/(?:.*\/)?.+\.(md|mdx|html)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'astro-endpoint',
        regex: /(^|\/)src\/pages\/(?:.*\/)?.+\.(js|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'astro-layout',
        regex: /(^|\/)src\/layouts\/(?:.*\/)?.+\.astro$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'astro-component',
        regex: /(^|\/)src\/components\/(?:.*\/)?.+\.astro$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'astro-pages-directory',
        regex: /(^|\/)src\/pages$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: ['astro-config', 'astro-page'],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
