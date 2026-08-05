import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  hasCompetingAreaProof,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import {
  addAreaScore,
} from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { findSvelteKitFrontendProofEntries } from './frontend-area-competing-proof';

type SvelteFrontendSignal =
  | 'svelte-root-component'
  | 'svelte-main-entry'
  | 'svelte-vite-config'
  | 'svelte-config'
  | 'svelte-rollup-config'
  | 'svelte-html-entry'
  | 'svelte-component';

const SVELTE_FRONTEND_SIGNAL_SCORES = {
  'svelte-root-component': 4,
  'svelte-main-entry': 3,
  'svelte-vite-config': 2,
  'svelte-config': 1,
  'svelte-rollup-config': 1,
  'svelte-html-entry': 1,
  'svelte-component': 1,
} satisfies AreaRuleSignalScores<SvelteFrontendSignal>;

function hasSvelteAppShape({
  countedSignals,
}: {
  countedSignals: Set<SvelteFrontendSignal>;
}): boolean {
  const hasRootComponent = countedSignals.has('svelte-root-component');
  const hasMainEntry = countedSignals.has('svelte-main-entry');

  return hasRootComponent && hasMainEntry;
}

/**
 * Adds standalone Svelte `Frontend app` candidates from owner-scoped path
 * evidence. SvelteKit and earlier framework claims take precedence, while
 * configuration and nested component files remain support-only signals.
 */
export function addSvelteFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const svelteAreasByOwner = createAreaRuleCandidateMap<SvelteFrontendSignal>();
  const svelteKitCompetingProofEntries = findSvelteKitFrontendProofEntries({
    index,
  });

  const svelteRootComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.svelte$/,
  });

  const svelteMainEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/main\.(js|mjs|ts)$/,
  });

  const svelteViteConfigFiles = index.findFilesByNameMatching({
    pattern: /^vite\.config\.(js|mjs|cjs|ts)$/,
  });

  const svelteConfigFiles = index.findFilesByNameMatching({
    pattern: /^svelte\.config\.(js|mjs|cjs|ts)$/,
  });

  const svelteRollupConfigFiles = index.findFilesByNameMatching({
    pattern: /^rollup\.config\.(js|mjs|cjs|ts)$/,
  });

  const svelteHtmlEntryFiles = index.findEntriesByPathMatching({
    pattern:
      /^(index\.html|public\/index\.html|apps\/[^/]+\/(index\.html|public\/index\.html)|packages\/[^/]+\/(index\.html|public\/index\.html))$/,
  });

  const svelteComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/(components|lib)\/(?:.*\/)?.+\.svelte$/,
  });

  for (const svelteRootComponentFile of svelteRootComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteAreasByOwner,
      entry: svelteRootComponentFile,
      signal: 'svelte-root-component',
      score: SVELTE_FRONTEND_SIGNAL_SCORES['svelte-root-component'],
    });
  }

  for (const svelteMainEntryFile of svelteMainEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteAreasByOwner,
      entry: svelteMainEntryFile,
      signal: 'svelte-main-entry',
      score: SVELTE_FRONTEND_SIGNAL_SCORES['svelte-main-entry'],
    });
  }

  for (const svelteViteConfigFile of svelteViteConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteAreasByOwner,
      entry: svelteViteConfigFile,
      signal: 'svelte-vite-config',
      score: SVELTE_FRONTEND_SIGNAL_SCORES['svelte-vite-config'],
    });
  }

  for (const svelteConfigFile of svelteConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteAreasByOwner,
      entry: svelteConfigFile,
      signal: 'svelte-config',
      score: SVELTE_FRONTEND_SIGNAL_SCORES['svelte-config'],
    });
  }

  for (const svelteRollupConfigFile of svelteRollupConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteAreasByOwner,
      entry: svelteRollupConfigFile,
      signal: 'svelte-rollup-config',
      score: SVELTE_FRONTEND_SIGNAL_SCORES['svelte-rollup-config'],
    });
  }

  for (const svelteHtmlEntryFile of svelteHtmlEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteAreasByOwner,
      entry: svelteHtmlEntryFile,
      signal: 'svelte-html-entry',
      score: SVELTE_FRONTEND_SIGNAL_SCORES['svelte-html-entry'],
    });
  }

  for (const svelteComponentFile of svelteComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteAreasByOwner,
      entry: svelteComponentFile,
      signal: 'svelte-component',
      score: SVELTE_FRONTEND_SIGNAL_SCORES['svelte-component'],
    });
  }

  for (const [ownerPath, ownerCandidate] of svelteAreasByOwner) {
    const hasSvelteKitProof = hasCompetingAreaProof({
      ownerPath,
      evidenceEntries: svelteKitCompetingProofEntries,
    });
    if (hasSvelteKitProof) continue;

    if (!hasSvelteAppShape({ countedSignals: ownerCandidate.countedSignals })) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Svelte',
      relatedTechnologies: [],
    });
  }
}
