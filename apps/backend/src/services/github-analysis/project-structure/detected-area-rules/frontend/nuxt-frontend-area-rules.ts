import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type NuxtFrontendSignal =
  | 'nuxt-config'
  | 'nuxt-app-entry'
  | 'nuxt-vue-page'
  | 'nuxt-script-page'
  | 'nuxt-layout'
  | 'nuxt-server-route'
  | 'nuxt-pages-directory';

const NUXT_FRONTEND_SIGNAL_SCORES = {
  'nuxt-config': 4,
  'nuxt-app-entry': 3,
  'nuxt-vue-page': 3,
  'nuxt-layout': 2,
  'nuxt-script-page': 1,
  'nuxt-server-route': 1,
  'nuxt-pages-directory': 1,
} satisfies AreaRuleSignalScores<NuxtFrontendSignal>;

function hasNuxtAppShape({
  countedSignals,
}: {
  countedSignals: Set<NuxtFrontendSignal>;
}): boolean {
  const hasNuxtConfig = countedSignals.has('nuxt-config');
  const hasNuxtAppEntry = countedSignals.has('nuxt-app-entry');

  return hasNuxtConfig || hasNuxtAppEntry;
}

/**
 * Adds `Frontend app` candidates from Nuxt path evidence.
 * Nuxt-specific signals stay internal while emitted areas remain role-based.
 */
export function addNuxtFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const nuxtAreasByOwner = createAreaRuleCandidateMap<NuxtFrontendSignal>();

  const nuxtConfigFiles = index.findFilesByNameMatching({
    pattern: /^nuxt\.config\.(js|mjs|cjs|ts)$/,
  });

  const nuxtAppEntryFiles = index.findEntriesByPathMatching({
    pattern:
      /^(app\.vue|app\/app\.vue|apps\/[^/]+\/(app\.vue|app\/app\.vue)|packages\/[^/]+\/(app\.vue|app\/app\.vue))$/,
  });

  const nuxtVuePageFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(app\/)?pages\/(?:.*\/)?.+\.vue$/,
  });

  const nuxtScriptPageFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(app\/)?pages\/(?:.*\/)?.+\.(js|jsx|mjs|ts|tsx)$/,
  });

  const nuxtLayoutFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(app\/)?layouts\/(?:.*\/)?.+\.vue$/,
  });

  const nuxtServerRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)server\/(api|routes|middleware)\/(?:.*\/)?.+\.(js|mjs|ts)$/,
  });

  const nuxtPagesDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)(app\/)?pages$/,
  });

  for (const nuxtConfigFile of nuxtConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: nuxtAreasByOwner,
      entry: nuxtConfigFile,
      signal: 'nuxt-config',
      score: NUXT_FRONTEND_SIGNAL_SCORES['nuxt-config'],
    });
  }

  for (const nuxtAppEntryFile of nuxtAppEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: nuxtAreasByOwner,
      entry: nuxtAppEntryFile,
      signal: 'nuxt-app-entry',
      score: NUXT_FRONTEND_SIGNAL_SCORES['nuxt-app-entry'],
    });
  }

  for (const nuxtVuePageFile of nuxtVuePageFiles) {
    countAreaRuleSignal({
      areasByOwner: nuxtAreasByOwner,
      entry: nuxtVuePageFile,
      signal: 'nuxt-vue-page',
      score: NUXT_FRONTEND_SIGNAL_SCORES['nuxt-vue-page'],
    });
  }

  for (const nuxtScriptPageFile of nuxtScriptPageFiles) {
    countAreaRuleSignal({
      areasByOwner: nuxtAreasByOwner,
      entry: nuxtScriptPageFile,
      signal: 'nuxt-script-page',
      score: NUXT_FRONTEND_SIGNAL_SCORES['nuxt-script-page'],
    });
  }

  for (const nuxtLayoutFile of nuxtLayoutFiles) {
    countAreaRuleSignal({
      areasByOwner: nuxtAreasByOwner,
      entry: nuxtLayoutFile,
      signal: 'nuxt-layout',
      score: NUXT_FRONTEND_SIGNAL_SCORES['nuxt-layout'],
    });
  }

  for (const nuxtServerRouteFile of nuxtServerRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: nuxtAreasByOwner,
      entry: nuxtServerRouteFile,
      signal: 'nuxt-server-route',
      score: NUXT_FRONTEND_SIGNAL_SCORES['nuxt-server-route'],
    });
  }

  for (const nuxtPagesDirectory of nuxtPagesDirectories) {
    countAreaRuleSignal({
      areasByOwner: nuxtAreasByOwner,
      entry: nuxtPagesDirectory,
      signal: 'nuxt-pages-directory',
      score: NUXT_FRONTEND_SIGNAL_SCORES['nuxt-pages-directory'],
    });
  }

  for (const [ownerPath, ownerCandidate] of nuxtAreasByOwner) {
    if (!hasNuxtAppShape({ countedSignals: ownerCandidate.countedSignals })) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
