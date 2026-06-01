import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type SvelteKitFrontendSignal =
  | 'sveltekit-config'
  | 'sveltekit-page-component'
  | 'sveltekit-layout-component'
  | 'sveltekit-page-load'
  | 'sveltekit-layout-load'
  | 'sveltekit-server-route'
  | 'sveltekit-app-template'
  | 'sveltekit-routes-directory';

const SVELTEKIT_FRONTEND_SIGNAL_SCORES = {
  'sveltekit-config': 4,
  'sveltekit-page-component': 4,
  'sveltekit-layout-component': 4,
  'sveltekit-server-route': 3,
  'sveltekit-page-load': 2,
  'sveltekit-layout-load': 2,
  'sveltekit-app-template': 2,
  'sveltekit-routes-directory': 1,
} satisfies AreaRuleSignalScores<SvelteKitFrontendSignal>;

function hasSvelteKitAppShape({
  countedSignals,
}: {
  countedSignals: Set<SvelteKitFrontendSignal>;
}): boolean {
  const hasSvelteKitConfig = countedSignals.has('sveltekit-config');
  const hasPageComponent = countedSignals.has('sveltekit-page-component');
  const hasLayoutComponent = countedSignals.has('sveltekit-layout-component');
  const hasPageLoad = countedSignals.has('sveltekit-page-load');
  const hasLayoutLoad = countedSignals.has('sveltekit-layout-load');
  const hasServerRoute = countedSignals.has('sveltekit-server-route');
  const hasAppTemplate = countedSignals.has('sveltekit-app-template');

  return (
    hasSvelteKitConfig ||
    hasPageComponent ||
    hasLayoutComponent ||
    (hasServerRoute && hasAppTemplate) ||
    (hasPageLoad && hasAppTemplate) ||
    (hasLayoutLoad && hasAppTemplate)
  );
}

/**
 * Adds `Frontend app` candidates from SvelteKit path evidence.
 * SvelteKit-specific signals stay internal while emitted areas remain role-based.
 */
export function addSvelteKitFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const svelteKitAreasByOwner =
    createAreaRuleCandidateMap<SvelteKitFrontendSignal>();

  const svelteKitConfigFiles = index.findFilesByNameMatching({
    pattern: /^svelte\.config\.(js|mjs|ts)$/,
  });

  const svelteKitPageComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+page\.svelte$/,
  });

  const svelteKitLayoutComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+layout\.svelte$/,
  });

  const svelteKitPageLoadFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+page\.(js|ts)$/,
  });

  const svelteKitLayoutLoadFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+layout\.(js|ts)$/,
  });

  const svelteKitServerRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+server\.(js|ts)$/,
  });

  const svelteKitAppTemplateFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.html$/,
  });

  const svelteKitRoutesDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)src\/routes$/,
  });

  for (const svelteKitConfigFile of svelteKitConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitConfigFile,
      signal: 'sveltekit-config',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-config'],
    });
  }

  for (const svelteKitPageComponentFile of svelteKitPageComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitPageComponentFile,
      signal: 'sveltekit-page-component',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-page-component'],
    });
  }

  for (const svelteKitLayoutComponentFile of svelteKitLayoutComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitLayoutComponentFile,
      signal: 'sveltekit-layout-component',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-layout-component'],
    });
  }

  for (const svelteKitPageLoadFile of svelteKitPageLoadFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitPageLoadFile,
      signal: 'sveltekit-page-load',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-page-load'],
    });
  }

  for (const svelteKitLayoutLoadFile of svelteKitLayoutLoadFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitLayoutLoadFile,
      signal: 'sveltekit-layout-load',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-layout-load'],
    });
  }

  for (const svelteKitServerRouteFile of svelteKitServerRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitServerRouteFile,
      signal: 'sveltekit-server-route',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-server-route'],
    });
  }

  for (const svelteKitAppTemplateFile of svelteKitAppTemplateFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitAppTemplateFile,
      signal: 'sveltekit-app-template',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-app-template'],
    });
  }

  for (const svelteKitRoutesDirectory of svelteKitRoutesDirectories) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitRoutesDirectory,
      signal: 'sveltekit-routes-directory',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-routes-directory'],
    });
  }

  for (const [ownerPath, ownerCandidate] of svelteKitAreasByOwner) {
    if (
      !hasSvelteKitAppShape({
        countedSignals: ownerCandidate.countedSignals,
      })
    ) {
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
