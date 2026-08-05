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

/**
 * Finds blocker-grade Nuxt proof entries for broad Vue-family detectors.
 * Returned entries are specific enough to indicate that the owner should be
 * treated as Nuxt instead of a generic Vue app.
 */
export function findNuxtFrontendProofEntries({
  index,
}: {
  index: EntryIndex;
}): Pick<RepoTreeEntry, 'path'>[] {
  const nuxtConfigFiles = index.findFilesByNameMatching({
    pattern: /^nuxt\.config\.(js|mjs|cjs|ts)$/,
  });

  const nuxtAppEntryFiles = index.findEntriesByPathMatching({
    pattern:
      /^(app\.vue|app\/app\.vue|apps\/[^/]+\/(app\.vue|app\/app\.vue)|packages\/[^/]+\/(app\.vue|app\/app\.vue))$/,
  });

  return [...nuxtConfigFiles, ...nuxtAppEntryFiles];
}

/**
 * Finds blocker-grade SvelteKit proof entries for the standalone Svelte
 * detector. Shared Svelte configuration and support files are intentionally
 * excluded because standalone Svelte projects may contain them too.
 */
export function findSvelteKitFrontendProofEntries({
  index,
}: {
  index: EntryIndex;
}): Pick<RepoTreeEntry, 'path'>[] {
  const svelteKitPageComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+page\.svelte$/,
  });

  const svelteKitLayoutComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/routes\/(?:.*\/)?\+layout\.svelte$/,
  });

  return [...svelteKitPageComponentFiles, ...svelteKitLayoutComponentFiles];
}
