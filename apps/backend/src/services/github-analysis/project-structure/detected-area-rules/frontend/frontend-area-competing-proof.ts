import type { RepoTreeEntry } from '../../project-structure-analyzer.types';
import type { EntryIndex } from '../../project-structure-entry-index';

/**
 * Finds blocker-grade Next.js proof entries for broad React-family detectors.
 * Returned entries are specific enough to indicate that the owner should be
 * treated as Next.js instead of a generic React app.
 */
export function findNextFrontendProofEntries({
  index,
}: {
  index: EntryIndex;
}): Pick<RepoTreeEntry, 'path'>[] {
  const nextConfigFiles = index.findFilesByNameMatching({
    pattern: /^next\.config\./,
  });

  const appRouterCoreFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(src\/)?app\/(?:.*\/)?(page|layout|route)\.(js|jsx|ts|tsx|mdx)$/,
  });

  const pagesRouterSpecialFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(src\/)?pages\/(_app|_document|_error)\.(js|jsx|ts|tsx)$/,
  });

  return [
    ...nextConfigFiles,
    ...appRouterCoreFiles,
    ...pagesRouterSpecialFiles,
  ];
}

/**
 * Finds blocker-grade React Router framework proof entries for broad React
 * detectors. Returned entries intentionally exclude weak support files.
 */
export function findReactRouterFrontendProofEntries({
  index,
}: {
  index: EntryIndex;
}): Pick<RepoTreeEntry, 'path'>[] {
  const reactRouterConfigFiles = index.findFilesByNameMatching({
    pattern: /^react-router\.config\.(js|mjs|cjs|ts)$/,
  });

  const reactRouterRootRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/root\.(js|jsx|ts|tsx)$/,
  });

  const reactRouterRoutesConfigFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/routes\.(js|ts)$/,
  });

  return [
    ...reactRouterConfigFiles,
    ...reactRouterRootRouteFiles,
    ...reactRouterRoutesConfigFiles,
  ];
}
