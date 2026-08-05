import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  hasCompetingAreaProof,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { findNuxtFrontendProofEntries } from './frontend-area-competing-proof';

type VueFrontendSignal =
  | 'vue-vite-config'
  | 'vue-cli-config'
  | 'vue-root-component'
  | 'vue-main-entry'
  | 'vue-router'
  | 'vue-view-component'
  | 'vue-component';

const VUE_FRONTEND_SIGNAL_SCORES = {
  'vue-root-component': 4,
  'vue-main-entry': 3,
  'vue-router': 3,
  'vue-vite-config': 2,
  'vue-cli-config': 2,
  'vue-view-component': 2,
  'vue-component': 1,
} satisfies AreaRuleSignalScores<VueFrontendSignal>;

function hasVueAppShape({
  countedSignals,
}: {
  countedSignals: Set<VueFrontendSignal>;
}): boolean {
  const hasVueRoot = countedSignals.has('vue-root-component');
  const hasVueMainEntry = countedSignals.has('vue-main-entry');
  const hasVueRouter = countedSignals.has('vue-router');
  const hasVueCliConfig = countedSignals.has('vue-cli-config');

  const hasVueAppShape = hasVueRoot && hasVueMainEntry;
  const hasVueRouterAppShape = hasVueRoot && hasVueRouter;
  const hasVueCliAppShape = hasVueCliConfig && hasVueRoot;

  return hasVueAppShape || hasVueRouterAppShape || hasVueCliAppShape;
}

/**
 * Adds `Frontend app` candidates from Vue path evidence.
 * Vue-specific signals stay internal while emitted areas remain role-based.
 */
export function addVueFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const vueAreasByOwner = createAreaRuleCandidateMap<VueFrontendSignal>();
  const vueCompetingProofEntries = findNuxtFrontendProofEntries({ index });

  const vueViteConfigFiles = index.findFilesByNameMatching({
    pattern: /^vite\.config\.(js|mjs|cjs|ts)$/,
  });

  const vueCliConfigFiles = index.findFilesByNameMatching({
    pattern: /^vue\.config\.(js|mjs|cjs|ts)$/,
  });

  const vueRootComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.vue$/,
  });

  const vueMainEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/main\.(js|mjs|ts)$/,
  });

  const vueRouterFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/router(\/index)?\.(js|mjs|ts)$/,
  });

  const vueViewComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/(views|pages)\/(?:.*\/)?.+\.vue$/,
  });

  const vueComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/components\/(?:.*\/)?.+\.vue$/,
  });

  for (const vueViteConfigFile of vueViteConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: vueAreasByOwner,
      entry: vueViteConfigFile,
      signal: 'vue-vite-config',
      score: VUE_FRONTEND_SIGNAL_SCORES['vue-vite-config'],
    });
  }

  for (const vueCliConfigFile of vueCliConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: vueAreasByOwner,
      entry: vueCliConfigFile,
      signal: 'vue-cli-config',
      score: VUE_FRONTEND_SIGNAL_SCORES['vue-cli-config'],
    });
  }

  for (const vueRootComponentFile of vueRootComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: vueAreasByOwner,
      entry: vueRootComponentFile,
      signal: 'vue-root-component',
      score: VUE_FRONTEND_SIGNAL_SCORES['vue-root-component'],
    });
  }

  for (const vueMainEntryFile of vueMainEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: vueAreasByOwner,
      entry: vueMainEntryFile,
      signal: 'vue-main-entry',
      score: VUE_FRONTEND_SIGNAL_SCORES['vue-main-entry'],
    });
  }

  for (const vueRouterFile of vueRouterFiles) {
    countAreaRuleSignal({
      areasByOwner: vueAreasByOwner,
      entry: vueRouterFile,
      signal: 'vue-router',
      score: VUE_FRONTEND_SIGNAL_SCORES['vue-router'],
    });
  }

  for (const vueViewComponentFile of vueViewComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: vueAreasByOwner,
      entry: vueViewComponentFile,
      signal: 'vue-view-component',
      score: VUE_FRONTEND_SIGNAL_SCORES['vue-view-component'],
    });
  }

  for (const vueComponentFile of vueComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: vueAreasByOwner,
      entry: vueComponentFile,
      signal: 'vue-component',
      score: VUE_FRONTEND_SIGNAL_SCORES['vue-component'],
    });
  }

  for (const [ownerPath, ownerCandidate] of vueAreasByOwner) {
    const hasCompetingProof = hasCompetingAreaProof({
      ownerPath,
      evidenceEntries: vueCompetingProofEntries,
    });

    if (hasCompetingProof) continue;

    if (!hasVueAppShape({ countedSignals: ownerCandidate.countedSignals })) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Vue',
      relatedTechnologies: [],
    });
  }
}
