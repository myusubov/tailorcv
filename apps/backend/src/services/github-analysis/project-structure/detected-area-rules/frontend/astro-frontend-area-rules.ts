import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type AstroFrontendSignal =
  | 'astro-config'
  | 'astro-page'
  | 'astro-content-page'
  | 'astro-endpoint'
  | 'astro-layout'
  | 'astro-component'
  | 'astro-pages-directory';

const ASTRO_FRONTEND_SIGNAL_SCORES = {
  'astro-config': 4,
  'astro-page': 4,
  'astro-layout': 2,
  'astro-endpoint': 2,
  'astro-component': 2,
  'astro-content-page': 1,
  'astro-pages-directory': 1,
} satisfies AreaRuleSignalScores<AstroFrontendSignal>;

function hasAstroAppShape({
  countedSignals,
}: {
  countedSignals: Set<AstroFrontendSignal>;
}): boolean {
  const hasAstroConfig = countedSignals.has('astro-config');
  const hasAstroPage = countedSignals.has('astro-page');

  return hasAstroConfig || hasAstroPage;
}

/**
 * Adds `Frontend app` candidates from Astro path evidence.
 * Astro-specific signals stay internal while emitted areas remain role-based.
 */
export function addAstroFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const astroAreasByOwner = createAreaRuleCandidateMap<AstroFrontendSignal>();

  const astroConfigFiles = index.findFilesByNameMatching({
    pattern: /^astro\.config\.(js|mjs|cjs|ts)$/,
  });

  const astroPageFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/pages\/(?:.*\/)?.+\.astro$/,
  });

  const astroContentPageFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/pages\/(?:.*\/)?.+\.(md|mdx|html)$/,
  });

  const astroEndpointFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/pages\/(?:.*\/)?.+\.(js|ts)$/,
  });

  const astroLayoutFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/layouts\/(?:.*\/)?.+\.astro$/,
  });

  const astroComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/components\/(?:.*\/)?.+\.astro$/,
  });

  const astroPagesDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)src\/pages$/,
  });

  for (const astroConfigFile of astroConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: astroAreasByOwner,
      entry: astroConfigFile,
      signal: 'astro-config',
      score: ASTRO_FRONTEND_SIGNAL_SCORES['astro-config'],
    });
  }

  for (const astroPageFile of astroPageFiles) {
    countAreaRuleSignal({
      areasByOwner: astroAreasByOwner,
      entry: astroPageFile,
      signal: 'astro-page',
      score: ASTRO_FRONTEND_SIGNAL_SCORES['astro-page'],
    });
  }

  for (const astroContentPageFile of astroContentPageFiles) {
    countAreaRuleSignal({
      areasByOwner: astroAreasByOwner,
      entry: astroContentPageFile,
      signal: 'astro-content-page',
      score: ASTRO_FRONTEND_SIGNAL_SCORES['astro-content-page'],
    });
  }

  for (const astroEndpointFile of astroEndpointFiles) {
    countAreaRuleSignal({
      areasByOwner: astroAreasByOwner,
      entry: astroEndpointFile,
      signal: 'astro-endpoint',
      score: ASTRO_FRONTEND_SIGNAL_SCORES['astro-endpoint'],
    });
  }

  for (const astroLayoutFile of astroLayoutFiles) {
    countAreaRuleSignal({
      areasByOwner: astroAreasByOwner,
      entry: astroLayoutFile,
      signal: 'astro-layout',
      score: ASTRO_FRONTEND_SIGNAL_SCORES['astro-layout'],
    });
  }

  for (const astroComponentFile of astroComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: astroAreasByOwner,
      entry: astroComponentFile,
      signal: 'astro-component',
      score: ASTRO_FRONTEND_SIGNAL_SCORES['astro-component'],
    });
  }

  for (const astroPagesDirectory of astroPagesDirectories) {
    countAreaRuleSignal({
      areasByOwner: astroAreasByOwner,
      entry: astroPagesDirectory,
      signal: 'astro-pages-directory',
      score: ASTRO_FRONTEND_SIGNAL_SCORES['astro-pages-directory'],
    });
  }

  for (const [ownerPath, ownerCandidate] of astroAreasByOwner) {
    if (!hasAstroAppShape({ countedSignals: ownerCandidate.countedSignals })) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Astro',
      relatedTechnologies: [],
    });
  }
}
