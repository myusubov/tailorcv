import {
  addAreaRuleCandidates,
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type SvelteKitFrontendSignal =
  | 'sveltekit-config'
  | 'sveltekit-page-route'
  | 'sveltekit-layout-route'
  | 'sveltekit-server-route'
  | 'sveltekit-app-template'
  | 'sveltekit-routes-directory';

const SVELTEKIT_FRONTEND_SIGNAL_SCORES = {
  'sveltekit-config': 4,
  'sveltekit-page-route': 4,
  'sveltekit-layout-route': 4,
  'sveltekit-server-route': 3,
  'sveltekit-app-template': 3,
  'sveltekit-routes-directory': 1,
} satisfies AreaRuleSignalScores<SvelteKitFrontendSignal>;

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

  const svelteKitPageRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+page\.(svelte|js|ts)$/,
  });

  const svelteKitLayoutRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+layout\.(svelte|js|ts)$/,
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

  for (const svelteKitPageRouteFile of svelteKitPageRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitPageRouteFile,
      signal: 'sveltekit-page-route',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-page-route'],
    });
  }

  for (const svelteKitLayoutRouteFile of svelteKitLayoutRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: svelteKitAreasByOwner,
      entry: svelteKitLayoutRouteFile,
      signal: 'sveltekit-layout-route',
      score: SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-layout-route'],
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

  addAreaRuleCandidates({
    areasByOwner: svelteKitAreasByOwner,
    candidates,
    name: 'Frontend app',
  });
}
