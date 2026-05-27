import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  hasCompetingAreaProof,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import {
  findNextFrontendProofEntries,
  findReactRouterFrontendProofEntries,
} from './frontend-area-competing-proof';

type ReactFrontendSignal =
  | 'react-vite-config'
  | 'react-root-index-html'
  | 'react-public-index-html'
  | 'react-main-jsx-entry'
  | 'react-index-jsx-entry'
  | 'react-index-js-entry'
  | 'react-root-app-jsx'
  | 'react-root-app-js'
  | 'react-style-file'
  | 'react-component-jsx'
  | 'react-route-component';

const REACT_FRONTEND_SIGNAL_SCORES = {
  'react-vite-config': 1,
  'react-root-index-html': 1,
  'react-public-index-html': 1,
  'react-main-jsx-entry': 2,
  'react-index-jsx-entry': 2,
  'react-index-js-entry': 1,
  'react-root-app-jsx': 3,
  'react-root-app-js': 2,
  'react-style-file': 1,
  'react-component-jsx': 1,
  'react-route-component': 1,
} satisfies AreaRuleSignalScores<ReactFrontendSignal>;

/**
 * Adds `Frontend app` candidates from non-framework React path evidence.
 * React-specific signals stay internal while detected areas remain role-based.
 */
export function addReactFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const reactAreasByOwner = createAreaRuleCandidateMap<ReactFrontendSignal>();
  const reactCompetingProofEntries = [
    ...findNextFrontendProofEntries({ index }),
    ...findReactRouterFrontendProofEntries({ index }),
  ];

  const reactViteConfigFiles = index.findFilesByNameMatching({
    pattern: /^vite\.config\.(js|mjs|cjs|ts)$/,
  });

  const reactRootIndexHtmlFiles = index.findEntriesByPathMatching({
    pattern:
      /^(index\.html|apps\/[^/]+\/index\.html|packages\/[^/]+\/index\.html)$/,
  });

  const reactPublicIndexHtmlFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)public\/index\.html$/,
  });

  const reactMainJsxEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/main\.(jsx|tsx)$/,
  });

  const reactIndexJsxEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/index\.(jsx|tsx)$/,
  });

  const reactIndexJsEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/index\.js$/,
  });

  const reactRootAppJsxFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.(jsx|tsx)$/,
  });

  const reactRootAppJsFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.js$/,
  });

  const reactStyleFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/(app|index)\.css$/,
  });

  const reactComponentJsxFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/components\/(?:.*\/)?.+\.(jsx|tsx)$/,
  });

  const reactRouteComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/(pages|views)\/(?:.*\/)?.+\.(jsx|tsx)$/,
  });

  for (const reactViteConfigFile of reactViteConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactViteConfigFile,
      signal: 'react-vite-config',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-vite-config'],
    });
  }

  for (const reactRootIndexHtmlFile of reactRootIndexHtmlFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactRootIndexHtmlFile,
      signal: 'react-root-index-html',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-root-index-html'],
    });
  }

  for (const reactPublicIndexHtmlFile of reactPublicIndexHtmlFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactPublicIndexHtmlFile,
      signal: 'react-public-index-html',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-public-index-html'],
    });
  }

  for (const reactMainJsxEntryFile of reactMainJsxEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactMainJsxEntryFile,
      signal: 'react-main-jsx-entry',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-main-jsx-entry'],
    });
  }

  for (const reactIndexJsxEntryFile of reactIndexJsxEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactIndexJsxEntryFile,
      signal: 'react-index-jsx-entry',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-index-jsx-entry'],
    });
  }

  for (const reactIndexJsEntryFile of reactIndexJsEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactIndexJsEntryFile,
      signal: 'react-index-js-entry',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-index-js-entry'],
    });
  }

  for (const reactRootAppJsxFile of reactRootAppJsxFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactRootAppJsxFile,
      signal: 'react-root-app-jsx',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-root-app-jsx'],
    });
  }

  for (const reactRootAppJsFile of reactRootAppJsFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactRootAppJsFile,
      signal: 'react-root-app-js',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-root-app-js'],
    });
  }

  for (const reactStyleFile of reactStyleFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactStyleFile,
      signal: 'react-style-file',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-style-file'],
    });
  }

  for (const reactComponentJsxFile of reactComponentJsxFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactComponentJsxFile,
      signal: 'react-component-jsx',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-component-jsx'],
    });
  }

  for (const reactRouteComponentFile of reactRouteComponentFiles) {
    countAreaRuleSignal({
      areasByOwner: reactAreasByOwner,
      entry: reactRouteComponentFile,
      signal: 'react-route-component',
      score: REACT_FRONTEND_SIGNAL_SCORES['react-route-component'],
    });
  }

  for (const [ownerPath, ownerCandidate] of reactAreasByOwner) {
    const hasCompetingProof = hasCompetingAreaProof({
      ownerPath,
      evidenceEntries: reactCompetingProofEntries,
    });

    if (hasCompetingProof) continue;

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
