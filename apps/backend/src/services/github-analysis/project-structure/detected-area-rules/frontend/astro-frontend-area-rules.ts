import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';

type AstroFrontendSignal =
  | 'astro-config'
  | 'astro-page'
  | 'astro-content-page'
  | 'astro-endpoint'
  | 'astro-layout'
  | 'astro-component'
  | 'astro-pages-directory';

type AstroAreaCandidate = {
  score: number;
  evidence: string[];
  countedSignals: Set<AstroFrontendSignal>;
};

const ASTRO_FRONTEND_SIGNAL_SCORES = {
  'astro-config': 4,
  'astro-page': 4,
  'astro-layout': 3,
  'astro-endpoint': 2,
  'astro-component': 2,
  'astro-content-page': 1,
  'astro-pages-directory': 1,
} satisfies Record<AstroFrontendSignal, number>;

/**
 * Adds `Frontend app` candidates from Astro path evidence.
 * Astro-specific signals stay internal while emitted areas remain role-based.
 */
export function addAstroFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const astroAreasByOwner = new Map<string, AstroAreaCandidate>();

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
    const ownerPath = ownerPathForApplicationArea({
      path: astroConfigFile.path,
    });
    const ownerCandidate =
      astroAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AstroFrontendSignal>(),
      } satisfies AstroAreaCandidate);

    if (!ownerCandidate.countedSignals.has('astro-config')) {
      ownerCandidate.score += ASTRO_FRONTEND_SIGNAL_SCORES['astro-config'];
      ownerCandidate.evidence.push(astroConfigFile.path);
      ownerCandidate.countedSignals.add('astro-config');
    }

    astroAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const astroPageFile of astroPageFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: astroPageFile.path,
    });
    const ownerCandidate =
      astroAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AstroFrontendSignal>(),
      } satisfies AstroAreaCandidate);

    if (!ownerCandidate.countedSignals.has('astro-page')) {
      ownerCandidate.score += ASTRO_FRONTEND_SIGNAL_SCORES['astro-page'];
      ownerCandidate.evidence.push(astroPageFile.path);
      ownerCandidate.countedSignals.add('astro-page');
    }

    astroAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const astroContentPageFile of astroContentPageFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: astroContentPageFile.path,
    });
    const ownerCandidate =
      astroAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AstroFrontendSignal>(),
      } satisfies AstroAreaCandidate);

    if (!ownerCandidate.countedSignals.has('astro-content-page')) {
      ownerCandidate.score +=
        ASTRO_FRONTEND_SIGNAL_SCORES['astro-content-page'];
      ownerCandidate.evidence.push(astroContentPageFile.path);
      ownerCandidate.countedSignals.add('astro-content-page');
    }

    astroAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const astroEndpointFile of astroEndpointFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: astroEndpointFile.path,
    });
    const ownerCandidate =
      astroAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AstroFrontendSignal>(),
      } satisfies AstroAreaCandidate);

    if (!ownerCandidate.countedSignals.has('astro-endpoint')) {
      ownerCandidate.score += ASTRO_FRONTEND_SIGNAL_SCORES['astro-endpoint'];
      ownerCandidate.evidence.push(astroEndpointFile.path);
      ownerCandidate.countedSignals.add('astro-endpoint');
    }

    astroAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const astroLayoutFile of astroLayoutFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: astroLayoutFile.path,
    });
    const ownerCandidate =
      astroAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AstroFrontendSignal>(),
      } satisfies AstroAreaCandidate);

    if (!ownerCandidate.countedSignals.has('astro-layout')) {
      ownerCandidate.score += ASTRO_FRONTEND_SIGNAL_SCORES['astro-layout'];
      ownerCandidate.evidence.push(astroLayoutFile.path);
      ownerCandidate.countedSignals.add('astro-layout');
    }

    astroAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const astroComponentFile of astroComponentFiles) {
    const ownerPath = ownerPathForApplicationArea({
      path: astroComponentFile.path,
    });
    const ownerCandidate =
      astroAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AstroFrontendSignal>(),
      } satisfies AstroAreaCandidate);

    if (!ownerCandidate.countedSignals.has('astro-component')) {
      ownerCandidate.score += ASTRO_FRONTEND_SIGNAL_SCORES['astro-component'];
      ownerCandidate.evidence.push(astroComponentFile.path);
      ownerCandidate.countedSignals.add('astro-component');
    }

    astroAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const astroPagesDirectory of astroPagesDirectories) {
    const ownerPath = ownerPathForApplicationArea({
      path: astroPagesDirectory.path,
    });
    const ownerCandidate =
      astroAreasByOwner.get(ownerPath) ??
      ({
        score: 0,
        evidence: [],
        countedSignals: new Set<AstroFrontendSignal>(),
      } satisfies AstroAreaCandidate);

    if (!ownerCandidate.countedSignals.has('astro-pages-directory')) {
      ownerCandidate.score +=
        ASTRO_FRONTEND_SIGNAL_SCORES['astro-pages-directory'];
      ownerCandidate.evidence.push(astroPagesDirectory.path);
      ownerCandidate.countedSignals.add('astro-pages-directory');
    }

    astroAreasByOwner.set(ownerPath, ownerCandidate);
  }

  for (const [ownerPath, ownerCandidate] of astroAreasByOwner) {
    const hasStrongSignal = Array.from(ownerCandidate.countedSignals).some(
      (signal) => ASTRO_FRONTEND_SIGNAL_SCORES[signal] >= 3,
    );

    if (!hasStrongSignal) continue;

    addAreaScore({
      candidates,
      name: 'Frontend app',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
    });
  }
}
