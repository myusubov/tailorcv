import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

type NuxtFrontendSignal =
  | 'nuxt-config'
  | 'nuxt-app-entry'
  | 'nuxt-vue-page'
  | 'nuxt-script-page'
  | 'nuxt-layout'
  | 'nuxt-server-route'
  | 'nuxt-pages-directory';

type NuxtAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<NuxtFrontendSignal>;
};

const NUXT_FRONTEND_SIGNAL_SCORES = {
  'nuxt-config': 4,
  'nuxt-app-entry': 3,
  'nuxt-vue-page': 3,
  'nuxt-layout': 2,
  'nuxt-script-page': 1,
  'nuxt-server-route': 1,
  'nuxt-pages-directory': 1,
} satisfies Record<NuxtFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from Nuxt path evidence.
 * Nuxt-specific signals stay internal while emitted areas remain role-based.
 */
export function addNuxtFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const nuxtAreasByOwner = new Map<string, NuxtAreaCandidate>();

  const nuxtConfigFiles = index.findFilesByNameMatching({
    pattern: /^nuxt\.config\.(js|mjs|cjs|ts)$/,
  });

  const nuxtAppEntryFiles = index.findEntriesByPathMatching({
    pattern:
      /^(app\.vue|app\/app\.vue|apps\/[^/]+\/(app\.vue|app\/app\.vue)|packages\/[^/]+\/(app\.vue|app\/app\.vue))$/,
  });

  const nuxtVuePageFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(app\/)?pages\/(?:.*\/)?.+\.vue$/,
  });

  const nuxtScriptPageFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(app\/)?pages\/(?:.*\/)?.+\.(js|jsx|mjs|ts|tsx)$/,
  });

  const nuxtLayoutFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)(app\/)?layouts\/(?:.*\/)?.+\.vue$/,
  });

  const nuxtServerRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)server\/(api|routes|middleware)\/(?:.*\/)?.+\.(js|mjs|ts)$/,
  });

  const nuxtPagesDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)(app\/)?pages$/,
  });

  for (const nuxtConfigFile of nuxtConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: nuxtConfigFile.path,
    });
    const ownerCandidate =
      nuxtAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NuxtFrontendSignal>(),
      } satisfies NuxtAreaCandidate);

    if (!ownerCandidate.countedSignals.has('nuxt-config')) {
      ownerCandidate.score += NUXT_FRONTEND_SIGNAL_SCORES['nuxt-config'];
      ownerCandidate.evidence.push(nuxtConfigFile.path);
      ownerCandidate.countedSignals.add('nuxt-config');
    }

    nuxtAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const nuxtAppEntryFile of nuxtAppEntryFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: nuxtAppEntryFile.path,
    });
    const ownerCandidate =
      nuxtAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NuxtFrontendSignal>(),
      } satisfies NuxtAreaCandidate);

    if (!ownerCandidate.countedSignals.has('nuxt-app-entry')) {
      ownerCandidate.score += NUXT_FRONTEND_SIGNAL_SCORES['nuxt-app-entry'];
      ownerCandidate.evidence.push(nuxtAppEntryFile.path);
      ownerCandidate.countedSignals.add('nuxt-app-entry');
    }

    nuxtAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const nuxtVuePageFile of nuxtVuePageFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: nuxtVuePageFile.path,
    });
    const ownerCandidate =
      nuxtAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NuxtFrontendSignal>(),
      } satisfies NuxtAreaCandidate);

    if (!ownerCandidate.countedSignals.has('nuxt-vue-page')) {
      ownerCandidate.score += NUXT_FRONTEND_SIGNAL_SCORES['nuxt-vue-page'];
      ownerCandidate.evidence.push(nuxtVuePageFile.path);
      ownerCandidate.countedSignals.add('nuxt-vue-page');
    }

    nuxtAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const nuxtScriptPageFile of nuxtScriptPageFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: nuxtScriptPageFile.path,
    });
    const ownerCandidate =
      nuxtAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NuxtFrontendSignal>(),
      } satisfies NuxtAreaCandidate);

    if (!ownerCandidate.countedSignals.has('nuxt-script-page')) {
      ownerCandidate.score += NUXT_FRONTEND_SIGNAL_SCORES['nuxt-script-page'];
      ownerCandidate.evidence.push(nuxtScriptPageFile.path);
      ownerCandidate.countedSignals.add('nuxt-script-page');
    }

    nuxtAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const nuxtLayoutFile of nuxtLayoutFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: nuxtLayoutFile.path,
    });
    const ownerCandidate =
      nuxtAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NuxtFrontendSignal>(),
      } satisfies NuxtAreaCandidate);

    if (!ownerCandidate.countedSignals.has('nuxt-layout')) {
      ownerCandidate.score += NUXT_FRONTEND_SIGNAL_SCORES['nuxt-layout'];
      ownerCandidate.evidence.push(nuxtLayoutFile.path);
      ownerCandidate.countedSignals.add('nuxt-layout');
    }

    nuxtAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const nuxtServerRouteFile of nuxtServerRouteFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: nuxtServerRouteFile.path,
    });
    const ownerCandidate =
      nuxtAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NuxtFrontendSignal>(),
      } satisfies NuxtAreaCandidate);

    if (!ownerCandidate.countedSignals.has('nuxt-server-route')) {
      ownerCandidate.score += NUXT_FRONTEND_SIGNAL_SCORES['nuxt-server-route'];
      ownerCandidate.evidence.push(nuxtServerRouteFile.path);
      ownerCandidate.countedSignals.add('nuxt-server-route');
    }

    nuxtAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const nuxtPagesDirectory of nuxtPagesDirectories) {
    const ownerPath = ownerPathForApplicationArea({
      path: nuxtPagesDirectory.path,
    });
    const ownerCandidate =
      nuxtAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<NuxtFrontendSignal>(),
      } satisfies NuxtAreaCandidate);

    if (!ownerCandidate.countedSignals.has('nuxt-pages-directory')) {
      ownerCandidate.score +=
        NUXT_FRONTEND_SIGNAL_SCORES['nuxt-pages-directory'];
      ownerCandidate.evidence.push(nuxtPagesDirectory.path);
      ownerCandidate.countedSignals.add('nuxt-pages-directory');
    }

    nuxtAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const [ownerPath, ownerCandidate] of nuxtAreasByOwner) {
    const hasNuxtProof =
      ownerCandidate.countedSignals.has('nuxt-config') ||
      ownerCandidate.countedSignals.has('nuxt-app-entry');

    if (!hasNuxtProof) continue;

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
