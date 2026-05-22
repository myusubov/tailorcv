import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

type SvelteKitFrontendSignal =
  | 'sveltekit-config'
  | 'sveltekit-page-route'
  | 'sveltekit-layout-route'
  | 'sveltekit-server-route'
  | 'sveltekit-app-template'
  | 'sveltekit-routes-directory';

type SvelteKitAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<SvelteKitFrontendSignal>;
};

const SVELTEKIT_FRONTEND_SIGNAL_SCORES = {
  'sveltekit-config': 4,
  'sveltekit-page-route': 4,
  'sveltekit-layout-route': 4,
  'sveltekit-server-route': 3,
  'sveltekit-app-template': 3,
  'sveltekit-routes-directory': 1,
} satisfies Record<SvelteKitFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from SvelteKit path evidence.
 * SvelteKit-specific signals stay internal while emitted areas remain role-based.
 */
export function addSvelteKitFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const svelteKitAreasByOwner = new Map<string, SvelteKitAreaCandidate>();

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
    const ownerPath = ownerPathForApplicationArea({
      path: svelteKitConfigFile.path,
    });
    const ownerCandidate =
      svelteKitAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<SvelteKitFrontendSignal>(),
      } satisfies SvelteKitAreaCandidate);

    if (!ownerCandidate.countedSignals.has('sveltekit-config')) {
      ownerCandidate.score +=
        SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-config'];
      ownerCandidate.evidence.push(svelteKitConfigFile.path);
      ownerCandidate.countedSignals.add('sveltekit-config');
    }

    svelteKitAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const svelteKitPageRouteFile of svelteKitPageRouteFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: svelteKitPageRouteFile.path,
    });
    const ownerCandidate =
      svelteKitAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<SvelteKitFrontendSignal>(),
      } satisfies SvelteKitAreaCandidate);

    if (!ownerCandidate.countedSignals.has('sveltekit-page-route')) {
      ownerCandidate.score +=
        SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-page-route'];
      ownerCandidate.evidence.push(svelteKitPageRouteFile.path);
      ownerCandidate.countedSignals.add('sveltekit-page-route');
    }

    svelteKitAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const svelteKitLayoutRouteFile of svelteKitLayoutRouteFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: svelteKitLayoutRouteFile.path,
    });
    const ownerCandidate =
      svelteKitAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<SvelteKitFrontendSignal>(),
      } satisfies SvelteKitAreaCandidate);

    if (!ownerCandidate.countedSignals.has('sveltekit-layout-route')) {
      ownerCandidate.score +=
        SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-layout-route'];
      ownerCandidate.evidence.push(svelteKitLayoutRouteFile.path);
      ownerCandidate.countedSignals.add('sveltekit-layout-route');
    }

    svelteKitAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const svelteKitServerRouteFile of svelteKitServerRouteFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: svelteKitServerRouteFile.path,
    });
    const ownerCandidate =
      svelteKitAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<SvelteKitFrontendSignal>(),
      } satisfies SvelteKitAreaCandidate);

    if (!ownerCandidate.countedSignals.has('sveltekit-server-route')) {
      ownerCandidate.score +=
        SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-server-route'];
      ownerCandidate.evidence.push(svelteKitServerRouteFile.path);
      ownerCandidate.countedSignals.add('sveltekit-server-route');
    }

    svelteKitAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const svelteKitAppTemplateFile of svelteKitAppTemplateFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: svelteKitAppTemplateFile.path,
    });
    const ownerCandidate =
      svelteKitAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<SvelteKitFrontendSignal>(),
      } satisfies SvelteKitAreaCandidate);

    if (!ownerCandidate.countedSignals.has('sveltekit-app-template')) {
      ownerCandidate.score +=
        SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-app-template'];
      ownerCandidate.evidence.push(svelteKitAppTemplateFile.path);
      ownerCandidate.countedSignals.add('sveltekit-app-template');
    }

    svelteKitAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const svelteKitRoutesDirectory of svelteKitRoutesDirectories) {
    const ownerPath = ownerPathForApplicationArea({
      path: svelteKitRoutesDirectory.path,
    });
    const ownerCandidate =
      svelteKitAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<SvelteKitFrontendSignal>(),
      } satisfies SvelteKitAreaCandidate);

    if (!ownerCandidate.countedSignals.has('sveltekit-routes-directory')) {
      ownerCandidate.score +=
        SVELTEKIT_FRONTEND_SIGNAL_SCORES['sveltekit-routes-directory'];
      ownerCandidate.evidence.push(svelteKitRoutesDirectory.path);
      ownerCandidate.countedSignals.add('sveltekit-routes-directory');
    }

    svelteKitAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const [ownerPath, ownerCandidate] of svelteKitAreasByOwner) {
    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
