import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const VUE_FRONTEND_SIGNAL_SCORES = {
  'vue-root-component': 4,
  'vue-main-entry': 3,
  'vue-router': 3,
  'vue-vite-config': 2,
  'vue-cli-config': 2,
  'vue-view-component': 2,
  'vue-component': 1,
} as const;

type VueFrontendSignal = keyof typeof VUE_FRONTEND_SIGNAL_SCORES;

/**
 * Adds `Frontend app` candidates from Vue path evidence.
 * Vue-specific signals stay internal while emitted areas remain role-based.
 */
export function addVueFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<VueFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'Vue',
    signalScores: VUE_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'vue-vite-config',
        regex: /^vite\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'vue-cli-config',
        regex: /^vue\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'vue-root-component',
        regex: /(^|\/)src\/app\.vue$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vue-main-entry',
        regex: /(^|\/)src\/main\.(js|mjs|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vue-router',
        regex: /(^|\/)src\/router(\/index)?\.(js|mjs|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vue-view-component',
        regex: /(^|\/)src\/(views|pages)\/(?:.*\/)?.+\.vue$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'vue-component',
        regex: /(^|\/)src\/components\/(?:.*\/)?.+\.vue$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          has: 'vue-root-component',
          or: [
            {
              has: 'vue-router',
            },
            {
              has: 'vue-cli-config',
            },
            {
              has: 'vue-main-entry',
            },
          ],
        },
      },
    },
    competingProofSchemas: [
      {
        indexMethod: 'findFilesByNameMatching',
        regex: /^nuxt\.config\.(js|mjs|cjs|ts)$/,
      },
      {
        indexMethod: 'findEntriesByPathMatching',
        regex:
          /^(app\.vue|app\/app\.vue|apps\/[^/]+\/(app\.vue|app\/app\.vue)|packages\/[^/]+\/(app\.vue|app\/app\.vue))$/,
      },
    ],
  });
}
