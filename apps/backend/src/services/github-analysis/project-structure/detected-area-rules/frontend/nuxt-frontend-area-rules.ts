import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

const NUXT_FRONTEND_SIGNAL_SCORES = {
  'nuxt-config': 4,
  'nuxt-app-entry': 3,
  'nuxt-vue-page': 3,
  'nuxt-layout': 2,
  'nuxt-script-page': 1,
  'nuxt-server-route': 1,
  'nuxt-pages-directory': 1,
} as const;

type NuxtFrontendSignal = keyof typeof NUXT_FRONTEND_SIGNAL_SCORES;

/**
 * Adds `Frontend app` candidates from Nuxt path evidence.
 * Nuxt-specific signals stay internal while emitted areas remain role-based.
 */
export function addNuxtFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<NuxtFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'Nuxt',
    relatedTechs: ['Vue'],
    signalScores: NUXT_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'nuxt-config',
        regex: /^nuxt\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'nuxt-app-entry',
        regex:
          /^(app\.vue|app\/app\.vue|apps\/[^/]+\/(app\.vue|app\/app\.vue)|packages\/[^/]+\/(app\.vue|app\/app\.vue))$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nuxt-vue-page',
        regex: /(^|\/)(app\/)?pages\/(?:.*\/)?.+\.vue$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nuxt-script-page',
        regex: /(^|\/)(app\/)?pages\/(?:.*\/)?.+\.(js|jsx|mjs|ts|tsx)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nuxt-layout',
        regex: /(^|\/)(app\/)?layouts\/(?:.*\/)?.+\.vue$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nuxt-server-route',
        regex: /(^|\/)server\/(api|routes|middleware)\/(?:.*\/)?.+\.(js|mjs|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nuxt-pages-directory',
        regex: /(^|\/)(app\/)?pages$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasOneOf: ['nuxt-config', 'nuxt-app-entry'],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner
  });
}
