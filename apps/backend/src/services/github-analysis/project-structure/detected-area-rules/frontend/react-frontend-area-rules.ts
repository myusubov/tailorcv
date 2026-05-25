import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

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

type ReactAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<ReactFrontendSignal>;
};

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
} satisfies Record<ReactFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from non-framework React path evidence.
 * React-specific signals stay internal while detected areas remain role-based.
 */
export function addReactFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const reactAreasByOwner = new Map<string, ReactAreaCandidate>();

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
    const ownerPath = ownerPathForApplicationArea({
      path: reactViteConfigFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-vite-config')) {
      ownerCandidate.score += REACT_FRONTEND_SIGNAL_SCORES['react-vite-config'];
      ownerCandidate.evidence.push(reactViteConfigFile.path);
      ownerCandidate.countedSignals.add('react-vite-config');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRootIndexHtmlFile of reactRootIndexHtmlFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRootIndexHtmlFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-root-index-html')) {
      ownerCandidate.score +=
        REACT_FRONTEND_SIGNAL_SCORES['react-root-index-html'];
      ownerCandidate.evidence.push(reactRootIndexHtmlFile.path);
      ownerCandidate.countedSignals.add('react-root-index-html');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactPublicIndexHtmlFile of reactPublicIndexHtmlFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactPublicIndexHtmlFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-public-index-html')) {
      ownerCandidate.score +=
        REACT_FRONTEND_SIGNAL_SCORES['react-public-index-html'];
      ownerCandidate.evidence.push(reactPublicIndexHtmlFile.path);
      ownerCandidate.countedSignals.add('react-public-index-html');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactMainJsxEntryFile of reactMainJsxEntryFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactMainJsxEntryFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-main-jsx-entry')) {
      ownerCandidate.score +=
        REACT_FRONTEND_SIGNAL_SCORES['react-main-jsx-entry'];
      ownerCandidate.evidence.push(reactMainJsxEntryFile.path);
      ownerCandidate.countedSignals.add('react-main-jsx-entry');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactIndexJsxEntryFile of reactIndexJsxEntryFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactIndexJsxEntryFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-index-jsx-entry')) {
      ownerCandidate.score +=
        REACT_FRONTEND_SIGNAL_SCORES['react-index-jsx-entry'];
      ownerCandidate.evidence.push(reactIndexJsxEntryFile.path);
      ownerCandidate.countedSignals.add('react-index-jsx-entry');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactIndexJsEntryFile of reactIndexJsEntryFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactIndexJsEntryFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-index-js-entry')) {
      ownerCandidate.score +=
        REACT_FRONTEND_SIGNAL_SCORES['react-index-js-entry'];
      ownerCandidate.evidence.push(reactIndexJsEntryFile.path);
      ownerCandidate.countedSignals.add('react-index-js-entry');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRootAppJsxFile of reactRootAppJsxFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRootAppJsxFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-root-app-jsx')) {
      ownerCandidate.score += REACT_FRONTEND_SIGNAL_SCORES['react-root-app-jsx'];
      ownerCandidate.evidence.push(reactRootAppJsxFile.path);
      ownerCandidate.countedSignals.add('react-root-app-jsx');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRootAppJsFile of reactRootAppJsFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRootAppJsFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-root-app-js')) {
      ownerCandidate.score += REACT_FRONTEND_SIGNAL_SCORES['react-root-app-js'];
      ownerCandidate.evidence.push(reactRootAppJsFile.path);
      ownerCandidate.countedSignals.add('react-root-app-js');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactStyleFile of reactStyleFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactStyleFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-style-file')) {
      ownerCandidate.score += REACT_FRONTEND_SIGNAL_SCORES['react-style-file'];
      ownerCandidate.evidence.push(reactStyleFile.path);
      ownerCandidate.countedSignals.add('react-style-file');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactComponentJsxFile of reactComponentJsxFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactComponentJsxFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-component-jsx')) {
      ownerCandidate.score +=
        REACT_FRONTEND_SIGNAL_SCORES['react-component-jsx'];
      ownerCandidate.evidence.push(reactComponentJsxFile.path);
      ownerCandidate.countedSignals.add('react-component-jsx');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const reactRouteComponentFile of reactRouteComponentFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: reactRouteComponentFile.path,
    });
    const ownerCandidate =
      reactAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<ReactFrontendSignal>(),
      } satisfies ReactAreaCandidate);

    if (!ownerCandidate.countedSignals.has('react-route-component')) {
      ownerCandidate.score +=
        REACT_FRONTEND_SIGNAL_SCORES['react-route-component'];
      ownerCandidate.evidence.push(reactRouteComponentFile.path);
      ownerCandidate.countedSignals.add('react-route-component');
    }

    reactAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const [ownerPath, ownerCandidate] of reactAreasByOwner) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
