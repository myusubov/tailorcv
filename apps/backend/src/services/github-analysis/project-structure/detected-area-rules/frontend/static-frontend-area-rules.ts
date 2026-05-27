import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';

type StaticFrontendSignal =
  | 'static-root-index-html'
  | 'static-root-html-page'
  | 'static-root-style-file'
  | 'static-root-script-file'
  | 'static-css-directory-file'
  | 'static-js-directory-file'
  | 'static-vite-config'
  | 'static-src-main-script'
  | 'static-src-style-file';

const STATIC_FRONTEND_SIGNAL_SCORES = {
  'static-root-index-html': 2,
  'static-root-html-page': 1,
  'static-root-style-file': 1,
  'static-root-script-file': 1,
  'static-css-directory-file': 1,
  'static-js-directory-file': 1,
  'static-vite-config': 1,
  'static-src-main-script': 1,
  'static-src-style-file': 1,
} satisfies AreaRuleSignalScores<StaticFrontendSignal>;

/**
 * Adds `Frontend app` candidates from plain HTML/CSS/JavaScript path evidence.
 * Static frontend signals stay internal while detected areas remain role-based.
 */
export function addStaticFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const staticAreasByOwner = createAreaRuleCandidateMap<StaticFrontendSignal>();
  const rootIndexHtmlFiles = index.findEntriesByPathMatching({
    pattern:
      /^(index\.html|apps\/[^/]+\/index\.html|packages\/[^/]+\/index\.html)$/,
  });

  const rootHtmlPageFiles = index.findEntriesByPathMatching({
    pattern:
      /^(?!index\.html$)[^/]+\.html$|^apps\/[^/]+\/(?!index\.html$)[^/]+\.html$|^packages\/[^/]+\/(?!index\.html$)[^/]+\.html$/,
  });

  const rootStyleCssFiles = index.findEntriesByPathMatching({
    pattern:
      /^(style\.css|styles\.css|main\.css|apps\/[^/]+\/(style\.css|styles\.css|main\.css)|packages\/[^/]+\/(style\.css|styles\.css|main\.css))$/,
  });

  const rootScriptJsFiles = index.findEntriesByPathMatching({
    pattern:
      /^(script\.js|scripts\.js|main\.js|apps\/[^/]+\/(script\.js|scripts\.js|main\.js)|packages\/[^/]+\/(script\.js|scripts\.js|main\.js))$/,
  });

  const directoryCssFiles = index.findEntriesByPathMatching({
    pattern:
      /^(css\/[^/]+\.css|apps\/[^/]+\/css\/[^/]+\.css|packages\/[^/]+\/css\/[^/]+\.css)$/,
  });

  const directoryJsFiles = index.findEntriesByPathMatching({
    pattern:
      /^(js\/[^/]+\.js|apps\/[^/]+\/js\/[^/]+\.js|packages\/[^/]+\/js\/[^/]+\.js)$/,
  });

  const srcCssFiles = index.findEntriesByPathMatching({
    pattern:
      /^(src\/(style\.css|styles\.css|main\.css|app\.css|index\.css)|apps\/[^/]+\/src\/(style\.css|styles\.css|main\.css|app\.css|index\.css)|packages\/[^/]+\/src\/(style\.css|styles\.css|main\.css|app\.css|index\.css))$/,
  });

  const srcMainJsFiles = index.findEntriesByPathMatching({
    pattern:
      /^(src\/main\.js|apps\/[^/]+\/src\/main\.js|packages\/[^/]+\/src\/main\.js)$/,
  });

  const viteConfigFiles = index.findFilesByNameMatching({
    pattern: /^vite\.config\.(js|mjs|cjs|ts)$/,
  });

  for (const indexHtmlFile of rootIndexHtmlFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: indexHtmlFile,
      signal: 'static-root-index-html',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-root-index-html'],
    });
  }

  for (const rootHtmlPageFile of rootHtmlPageFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: rootHtmlPageFile,
      signal: 'static-root-html-page',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-root-html-page'],
    });
  }

  for (const rootStyleCssFile of rootStyleCssFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: rootStyleCssFile,
      signal: 'static-root-style-file',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-root-style-file'],
    });
  }

  for (const rootScriptJsFile of rootScriptJsFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: rootScriptJsFile,
      signal: 'static-root-script-file',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-root-script-file'],
    });
  }

  for (const directoryCssFile of directoryCssFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: directoryCssFile,
      signal: 'static-css-directory-file',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-css-directory-file'],
    });
  }

  for (const directoryJsFile of directoryJsFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: directoryJsFile,
      signal: 'static-js-directory-file',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-js-directory-file'],
    });
  }

  for (const srcCssFile of srcCssFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: srcCssFile,
      signal: 'static-src-style-file',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-src-style-file'],
    });
  }

  for (const srcMainJsFile of srcMainJsFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: srcMainJsFile,
      signal: 'static-src-main-script',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-src-main-script'],
    });
  }

  for (const viteConfigFile of viteConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: staticAreasByOwner,
      entry: viteConfigFile,
      signal: 'static-vite-config',
      score: STATIC_FRONTEND_SIGNAL_SCORES['static-vite-config'],
    });
  }

  for (const [ownerPath, ownerCandidate] of staticAreasByOwner) {
    const hasRootIndexHtml = ownerCandidate.countedSignals.has(
      'static-root-index-html',
    );
    const hasRootStyleFile = ownerCandidate.countedSignals.has(
      'static-root-style-file',
    );
    const hasRootHtmlPage = ownerCandidate.countedSignals.has(
      'static-root-html-page',
    );
    const hasDirectoryCssFile = ownerCandidate.countedSignals.has(
      'static-css-directory-file',
    );
    const hasSrcCssFile = ownerCandidate.countedSignals.has(
      'static-src-style-file',
    );
    const hasViteConfigFile =
      ownerCandidate.countedSignals.has('static-vite-config');

    const hasRootStaticPage = hasRootIndexHtml && hasRootStyleFile;
    const hasDirectoryStaticPage = hasRootIndexHtml && hasDirectoryCssFile;
    const hasCssEvidence =
      hasRootStyleFile || hasDirectoryCssFile || hasSrcCssFile;
    const hasMultiPageStaticSite =
      hasRootIndexHtml && hasRootHtmlPage && hasCssEvidence;
    const hasViteStaticPage =
      hasRootIndexHtml && hasSrcCssFile && hasViteConfigFile;

    if (
      !hasRootStaticPage &&
      !hasDirectoryStaticPage &&
      !hasMultiPageStaticSite &&
      !hasViteStaticPage
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
