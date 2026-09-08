import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

const SVELTEKIT_FRONTEND_SIGNAL_SCORES = {
  'sveltekit-config': 1,
  'sveltekit-page-component': 4,
  'sveltekit-layout-component': 4,
  'sveltekit-server-route': 3,
  'sveltekit-page-load': 2,
  'sveltekit-layout-load': 2,
  'sveltekit-app-template': 2,
  'sveltekit-routes-directory': 1,
} as const;

type SvelteKitFrontendSignal = keyof typeof SVELTEKIT_FRONTEND_SIGNAL_SCORES;

/**
 * Adds `Frontend app` candidates from SvelteKit path evidence.
 * SvelteKit-specific signals stay internal while emitted areas remain role-based.
 */
export function addSvelteKitFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<SvelteKitFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'SvelteKit',
    relatedTechs: ['Svelte'],
    signalScores: SVELTEKIT_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'sveltekit-config',
        regex: /^svelte\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'sveltekit-page-component',
        regex: /(^|\/)src\/routes\/(?:.*\/)?\+page\.svelte$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sveltekit-layout-component',
        regex: /(^|\/)src\/routes\/(?:.*\/)?\+layout\.svelte$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sveltekit-page-load',
        regex: /(^|\/)src\/routes\/(?:.*\/)?\+page\.(js|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sveltekit-layout-load',
        regex: /(^|\/)src\/routes\/(?:.*\/)?\+layout\.(js|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sveltekit-server-route',
        regex: /(^|\/)src\/routes\/(?:.*\/)?\+server\.(js|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sveltekit-app-template',
        regex: /(^|\/)src\/app\.html$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'sveltekit-routes-directory',
        regex: /(^|\/)src\/routes$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            { has: 'sveltekit-page-component' },
            { has: 'sveltekit-layout-component' },
            { hasAllOf: ['sveltekit-server-route', 'sveltekit-app-template'] },
            { hasAllOf: ['sveltekit-page-load', 'sveltekit-app-template'] },
            { hasAllOf: ['sveltekit-layout-load', 'sveltekit-app-template'] },
          ],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
