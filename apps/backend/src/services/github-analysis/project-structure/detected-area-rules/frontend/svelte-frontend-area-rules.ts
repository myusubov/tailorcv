import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const SVELTE_FRONTEND_SIGNAL_SCORES = {
  'svelte-root-component': 4,
  'svelte-main-entry': 3,
  'svelte-vite-config': 2,
  'svelte-config': 1,
  'svelte-rollup-config': 1,
  'svelte-html-entry': 1,
  'svelte-component': 1,
} as const;

type SvelteFrontendSignal = keyof typeof SVELTE_FRONTEND_SIGNAL_SCORES;

/**
 * Adds standalone Svelte `Frontend app` candidates from owner-scoped path
 * evidence. SvelteKit and earlier framework claims take precedence, while
 * configuration and nested component files remain support-only signals.
 */
export function addSvelteFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<SvelteFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'Svelte',
    signalScores: SVELTE_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'svelte-root-component',
        regex: /(^|\/)src\/app\.svelte$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'svelte-main-entry',
        regex: /(^|\/)src\/main\.(js|mjs|ts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'svelte-vite-config',
        regex: /^vite\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'svelte-config',
        regex: /^svelte\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'svelte-rollup-config',
        regex: /^rollup\.config\.(js|mjs|cjs|ts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'svelte-html-entry',
        regex:
          /^(index\.html|public\/index\.html|apps\/[^/]+\/(index\.html|public\/index\.html)|packages\/[^/]+\/(index\.html|public\/index\.html))$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'svelte-component',
        regex: /(^|\/)src\/(components|lib)\/(?:.*\/)?.+\.svelte$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasAllOf: ['svelte-root-component', 'svelte-main-entry'],
        },
      },
    },
    competingProofSchemas: [
      {
        indexMethod: 'findEntriesByPathMatching',
        regex: /(^|\/)src\/routes\/(?:.*\/)?\+page\.svelte$/,
      },
      {
        indexMethod: 'findEntriesByPathMatching',
        regex: /(^|\/)src\/routes\/(?:.*\/)?\+layout\.svelte$/,
      },
    ],
  });
}
