import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

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

type StaticAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<StaticFrontendSignal>;
};

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
} satisfies Record<StaticFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from plain HTML/CSS/JavaScript path evidence.
 * Static frontend signals stay internal while detected areas remain role-based.
 */
export function addStaticFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const staticAreasByOwner = new Map<string, StaticAreaCandidate>();
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
    const ownerPath = ownerPathForApplicationArea({ path: indexHtmlFile.path });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-root-index-html')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-root-index-html'];
      ownerCandidate.evidence.push(indexHtmlFile.path);
      ownerCandidate.countedSignals.add('static-root-index-html');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const rootHtmlPageFile of rootHtmlPageFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: rootHtmlPageFile.path,
    });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-root-html-page')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-root-html-page'];
      ownerCandidate.evidence.push(rootHtmlPageFile.path);
      ownerCandidate.countedSignals.add('static-root-html-page');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const rootStyleCssFile of rootStyleCssFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: rootStyleCssFile.path,
    });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-root-style-file')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-root-style-file'];
      ownerCandidate.evidence.push(rootStyleCssFile.path);
      ownerCandidate.countedSignals.add('static-root-style-file');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const rootScriptJsFile of rootScriptJsFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: rootScriptJsFile.path,
    });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-root-script-file')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-root-script-file'];
      ownerCandidate.evidence.push(rootScriptJsFile.path);
      ownerCandidate.countedSignals.add('static-root-script-file');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const directoryCssFile of directoryCssFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: directoryCssFile.path,
    });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-css-directory-file')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-css-directory-file'];
      ownerCandidate.evidence.push(directoryCssFile.path);
      ownerCandidate.countedSignals.add('static-css-directory-file');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const directoryJsFile of directoryJsFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: directoryJsFile.path,
    });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-js-directory-file')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-js-directory-file'];
      ownerCandidate.evidence.push(directoryJsFile.path);
      ownerCandidate.countedSignals.add('static-js-directory-file');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const srcCssFile of srcCssFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: srcCssFile.path,
    });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-src-style-file')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-src-style-file'];
      ownerCandidate.evidence.push(srcCssFile.path);
      ownerCandidate.countedSignals.add('static-src-style-file');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const srcMainJsFile of srcMainJsFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: srcMainJsFile.path,
    });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-src-main-script')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-src-main-script'];
      ownerCandidate.evidence.push(srcMainJsFile.path);
      ownerCandidate.countedSignals.add('static-src-main-script');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const viteConfigFile of viteConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: viteConfigFile.path,
    });
    const ownerCandidate =
      staticAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<StaticFrontendSignal>(),
      } satisfies StaticAreaCandidate);

    if (!ownerCandidate.countedSignals.has('static-vite-config')) {
      ownerCandidate.score +=
        STATIC_FRONTEND_SIGNAL_SCORES['static-vite-config'];
      ownerCandidate.evidence.push(viteConfigFile.path);
      ownerCandidate.countedSignals.add('static-vite-config');
    }

    staticAreasByOwner.set(ownerPath, ownerCandidate);
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
