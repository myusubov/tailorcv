import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

type VueFrontendSignal =
  | 'vue-vite-config'
  | 'vue-cli-config'
  | 'vue-root-component'
  | 'vue-main-entry'
  | 'vue-router'
  | 'vue-view-component'
  | 'vue-component';

type VueAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<VueFrontendSignal>;
};

const VUE_FRONTEND_SIGNAL_SCORES = {
  'vue-root-component': 4,
  'vue-main-entry': 3,
  'vue-router': 3,
  'vue-vite-config': 2,
  'vue-cli-config': 2,
  'vue-view-component': 2,
  'vue-component': 1,
} satisfies Record<VueFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from Vue path evidence.
 * Vue-specific signals stay internal while emitted areas remain role-based.
 */
export function addVueFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const vueAreasByOwner = new Map<string, VueAreaCandidate>();
  const nuxtProofOwners = new Set<string>();

  const nuxtConfigFiles = index.findFilesByNameMatching({
    pattern: /^nuxt\.config\.(js|mjs|cjs|ts)$/,
  });

  const nuxtAppEntryFiles = index.findEntriesByPathMatching({
    pattern:
      /^(app\.vue|app\/app\.vue|apps\/[^/]+\/(app\.vue|app\/app\.vue)|packages\/[^/]+\/(app\.vue|app\/app\.vue))$/,
  });

  for (const nuxtProofFile of [...nuxtConfigFiles, ...nuxtAppEntryFiles]) {
    nuxtProofOwners.add(
      ownerPathForApplicationArea({ path: nuxtProofFile.path }),
    );
  }

  const vueViteConfigFiles = index.findFilesByNameMatching({
    pattern: /^vite\.config\.(js|mjs|cjs|ts)$/,
  });

  const vueCliConfigFiles = index.findFilesByNameMatching({
    pattern: /^vue\.config\.(js|mjs|cjs|ts)$/,
  });

  const vueRootComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.vue$/,
  });

  const vueMainEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/main\.(js|mjs|ts)$/,
  });

  const vueRouterFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/router(\/index)?\.(js|mjs|ts)$/,
  });

  const vueViewComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/(views|pages)\/(?:.*\/)?.+\.vue$/,
  });

  const vueComponentFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/components\/(?:.*\/)?.+\.vue$/,
  });

  for (const vueViteConfigFile of vueViteConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: vueViteConfigFile.path,
    });
    const ownerCandidate =
      vueAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<VueFrontendSignal>(),
      } satisfies VueAreaCandidate);

    if (!ownerCandidate.countedSignals.has('vue-vite-config')) {
      ownerCandidate.score += VUE_FRONTEND_SIGNAL_SCORES['vue-vite-config'];
      ownerCandidate.evidence.push(vueViteConfigFile.path);
      ownerCandidate.countedSignals.add('vue-vite-config');
    }

    vueAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const vueCliConfigFile of vueCliConfigFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: vueCliConfigFile.path,
    });
    const ownerCandidate =
      vueAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<VueFrontendSignal>(),
      } satisfies VueAreaCandidate);

    if (!ownerCandidate.countedSignals.has('vue-cli-config')) {
      ownerCandidate.score += VUE_FRONTEND_SIGNAL_SCORES['vue-cli-config'];
      ownerCandidate.evidence.push(vueCliConfigFile.path);
      ownerCandidate.countedSignals.add('vue-cli-config');
    }

    vueAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const vueRootComponentFile of vueRootComponentFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: vueRootComponentFile.path,
    });
    const ownerCandidate =
      vueAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<VueFrontendSignal>(),
      } satisfies VueAreaCandidate);

    if (!ownerCandidate.countedSignals.has('vue-root-component')) {
      ownerCandidate.score +=
        VUE_FRONTEND_SIGNAL_SCORES['vue-root-component'];
      ownerCandidate.evidence.push(vueRootComponentFile.path);
      ownerCandidate.countedSignals.add('vue-root-component');
    }

    vueAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const vueMainEntryFile of vueMainEntryFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: vueMainEntryFile.path,
    });
    const ownerCandidate =
      vueAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<VueFrontendSignal>(),
      } satisfies VueAreaCandidate);

    if (!ownerCandidate.countedSignals.has('vue-main-entry')) {
      ownerCandidate.score += VUE_FRONTEND_SIGNAL_SCORES['vue-main-entry'];
      ownerCandidate.evidence.push(vueMainEntryFile.path);
      ownerCandidate.countedSignals.add('vue-main-entry');
    }

    vueAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const vueRouterFile of vueRouterFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: vueRouterFile.path,
    });
    const ownerCandidate =
      vueAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<VueFrontendSignal>(),
      } satisfies VueAreaCandidate);

    if (!ownerCandidate.countedSignals.has('vue-router')) {
      ownerCandidate.score += VUE_FRONTEND_SIGNAL_SCORES['vue-router'];
      ownerCandidate.evidence.push(vueRouterFile.path);
      ownerCandidate.countedSignals.add('vue-router');
    }

    vueAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const vueViewComponentFile of vueViewComponentFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: vueViewComponentFile.path,
    });
    const ownerCandidate =
      vueAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<VueFrontendSignal>(),
      } satisfies VueAreaCandidate);

    if (!ownerCandidate.countedSignals.has('vue-view-component')) {
      ownerCandidate.score += VUE_FRONTEND_SIGNAL_SCORES['vue-view-component'];
      ownerCandidate.evidence.push(vueViewComponentFile.path);
      ownerCandidate.countedSignals.add('vue-view-component');
    }

    vueAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const vueComponentFile of vueComponentFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: vueComponentFile.path,
    });
    const ownerCandidate =
      vueAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<VueFrontendSignal>(),
      } satisfies VueAreaCandidate);

    if (!ownerCandidate.countedSignals.has('vue-component')) {
      ownerCandidate.score += VUE_FRONTEND_SIGNAL_SCORES['vue-component'];
      ownerCandidate.evidence.push(vueComponentFile.path);
      ownerCandidate.countedSignals.add('vue-component');
    }

    vueAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const [ownerPath, ownerCandidate] of vueAreasByOwner) {
    if (nuxtProofOwners.has(ownerPath)) continue;

    const hasVueRoot = ownerCandidate.countedSignals.has(
      'vue-root-component',
    );
    const hasVueMainEntry =
      ownerCandidate.countedSignals.has('vue-main-entry');
    const hasVueRouter = ownerCandidate.countedSignals.has('vue-router');
    const hasVueCliConfig =
      ownerCandidate.countedSignals.has('vue-cli-config');

    const hasVueAppShape = hasVueRoot && hasVueMainEntry;
    const hasVueRouterAppShape = hasVueRoot && hasVueRouter;
    const hasVueCliAppShape = hasVueCliConfig && hasVueRoot;

    if (!hasVueAppShape && !hasVueRouterAppShape && !hasVueCliAppShape) {
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
