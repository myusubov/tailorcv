import {
  addAreaScore,
  hasAreaCandidate,
} from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

type ExpressBackendSignal =
  | 'express-generator-bin-www'
  | 'express-root-app-entry'
  | 'express-src-app-entry'
  | 'express-server-entry'
  | 'express-package-manifest'
  | 'express-routes-directory'
  | 'express-route-file'
  | 'express-generator-default-route'
  | 'express-controllers-directory'
  | 'express-controller-file'
  | 'express-middleware-directory'
  | 'express-middleware-file'
  | 'express-services-directory'
  | 'express-service-file'
  | 'express-public-directory'
  | 'express-views-directory';

const EXPRESS_BACKEND_SIGNAL_SCORES = {
  'express-generator-bin-www': 3,
  'express-root-app-entry': 2,
  'express-src-app-entry': 2,
  'express-server-entry': 1,
  'express-package-manifest': 1,
  'express-routes-directory': 1,
  'express-route-file': 2,
  'express-generator-default-route': 2,
  'express-controllers-directory': 1,
  'express-controller-file': 2,
  'express-middleware-directory': 1,
  'express-middleware-file': 1,
  'express-services-directory': 1,
  'express-service-file': 1,
  'express-public-directory': 1,
  'express-views-directory': 1,
} satisfies AreaRuleSignalScores<ExpressBackendSignal>;

/**
 * Returns whether one owner has a conservative Express.js backend shape.
 * Express has no mandatory path conventions, so accepted combinations require
 * a generator shape or an app/server entry plus actual route and handler files.
 */
function hasExpressBackendShape({
  countedSignals,
}: {
  countedSignals: Set<ExpressBackendSignal>;
}): boolean {
  const hasBinWww = countedSignals.has('express-generator-bin-www');
  const hasRootAppEntry = countedSignals.has('express-root-app-entry');
  const hasSrcAppEntry = countedSignals.has('express-src-app-entry');
  const hasServerEntry = countedSignals.has('express-server-entry');
  const hasPackageManifest = countedSignals.has('express-package-manifest');
  const hasRouteFile = countedSignals.has('express-route-file');
  const hasGeneratorDefaultRoute = countedSignals.has(
    'express-generator-default-route',
  );
  const hasControllerFile = countedSignals.has('express-controller-file');
  const hasMiddlewareFile = countedSignals.has('express-middleware-file');
  const hasServiceFile = countedSignals.has('express-service-file');
  const hasServicesDirectory = countedSignals.has('express-services-directory');
  const hasPublicDirectory = countedSignals.has('express-public-directory');
  const hasViewsDirectory = countedSignals.has('express-views-directory');

  const hasAppEntry = hasRootAppEntry || hasSrcAppEntry;
  const hasSupport =
    hasMiddlewareFile || hasServiceFile || hasServicesDirectory;

  const hasGeneratorShape =
    hasBinWww &&
    hasRootAppEntry &&
    hasRouteFile &&
    (hasViewsDirectory || hasPublicDirectory || hasGeneratorDefaultRoute);

  const hasLayeredApiShape =
    hasAppEntry && hasRouteFile && hasControllerFile && hasSupport;

  const hasServerOwnedApiShape =
    hasServerEntry &&
    hasRouteFile &&
    hasControllerFile &&
    hasSupport &&
    hasPackageManifest;

  return hasGeneratorShape || hasLayeredApiShape || hasServerOwnedApiShape;
}

/**
 * Adds owner-scoped `Backend API` candidates from conservative Express.js path
 * evidence. Mutates the shared candidate map only when no stronger backend
 * detector has already claimed the same owner.
 */
export function addExpressBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const expressAreasByOwner =
    createAreaRuleCandidateMap<ExpressBackendSignal>();

  const expressGeneratorBinWwwFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)bin\/www$/,
  });

  const expressRootAppEntryFiles = index.findEntriesByPathMatching({
    pattern:
      /^(app\.(?:js|cjs|mjs|ts|cts|mts)|(?:apps|packages)\/[^/]+\/app\.(?:js|cjs|mjs|ts|cts|mts))$/,
  });

  const expressSrcAppEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.(?:js|cjs|mjs|ts|cts|mts)$/,
  });

  const expressServerEntryFiles = index.findEntriesByPathMatching({
    pattern:
      /^(server\.(?:js|cjs|mjs|ts|cts|mts)|(?:apps|packages)\/[^/]+\/server\.(?:js|cjs|mjs|ts|cts|mts)|(?:^|.*\/)src\/server\.(?:js|cjs|mjs|ts|cts|mts))$/,
  });

  const expressPackageManifestFiles = index.findFilesByNameMatching({
    pattern: /^package\.json$/,
  });

  const expressRouteDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)src\/routes$|(^|\/)routes$/,
  });

  const expressRouteFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:src\/)?routes\/(?:.*\/)?[^/]+\.(?:js|cjs|mjs|ts|cts|mts)$/,
  });

  const expressGeneratorDefaultRouteFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:src\/)?routes\/(?:index|users)\.(?:js|cjs|mjs|ts|cts|mts)$/,
  });

  const expressControllerDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)src\/controllers$|(^|\/)controllers$/,
  });

  const expressControllerFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:src\/)?controllers\/(?:.*\/)?[^/]+\.(?:js|cjs|mjs|ts|cts|mts)$|(^|\/)[^/]+\.controller\.(?:js|cjs|mjs|ts|cts|mts)$/,
  });

  const expressMiddlewareDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)src\/middlewares?$|(^|\/)middlewares?$/,
  });

  const expressMiddlewareFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:src\/)?middlewares?\/(?:.*\/)?[^/]+\.(?:js|cjs|mjs|ts|cts|mts)$|(^|\/)[^/]+\.middleware\.(?:js|cjs|mjs|ts|cts|mts)$/,
  });

  const expressServiceDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)src\/services$|(^|\/)services$/,
  });

  const expressServiceFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)(?:src\/)?services\/(?:.*\/)?[^/]+\.service\.(?:js|cjs|mjs|ts|cts|mts)$/,
  });

  const expressPublicDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)public$/,
  });

  const expressViewDirectories = index.findDirectoriesByPathMatching({
    pattern: /(^|\/)views$/,
  });

  for (const expressGeneratorBinWwwFile of expressGeneratorBinWwwFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressGeneratorBinWwwFile,
      signal: 'express-generator-bin-www',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-generator-bin-www'],
    });
  }

  for (const expressRootAppEntryFile of expressRootAppEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressRootAppEntryFile,
      signal: 'express-root-app-entry',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-root-app-entry'],
    });
  }

  for (const expressSrcAppEntryFile of expressSrcAppEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressSrcAppEntryFile,
      signal: 'express-src-app-entry',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-src-app-entry'],
    });
  }

  for (const expressServerEntryFile of expressServerEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressServerEntryFile,
      signal: 'express-server-entry',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-server-entry'],
    });
  }

  for (const expressPackageManifestFile of expressPackageManifestFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressPackageManifestFile,
      signal: 'express-package-manifest',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-package-manifest'],
    });
  }

  for (const expressRouteDirectory of expressRouteDirectories) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressRouteDirectory,
      signal: 'express-routes-directory',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-routes-directory'],
    });
  }

  for (const expressRouteFile of expressRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressRouteFile,
      signal: 'express-route-file',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-route-file'],
    });
  }

  for (const expressGeneratorDefaultRouteFile of expressGeneratorDefaultRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressGeneratorDefaultRouteFile,
      signal: 'express-generator-default-route',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-generator-default-route'],
    });
  }

  for (const expressControllerDirectory of expressControllerDirectories) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressControllerDirectory,
      signal: 'express-controllers-directory',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-controllers-directory'],
    });
  }

  for (const expressControllerFile of expressControllerFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressControllerFile,
      signal: 'express-controller-file',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-controller-file'],
    });
  }

  for (const expressMiddlewareDirectory of expressMiddlewareDirectories) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressMiddlewareDirectory,
      signal: 'express-middleware-directory',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-middleware-directory'],
    });
  }

  for (const expressMiddlewareFile of expressMiddlewareFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressMiddlewareFile,
      signal: 'express-middleware-file',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-middleware-file'],
    });
  }

  for (const expressServiceDirectory of expressServiceDirectories) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressServiceDirectory,
      signal: 'express-services-directory',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-services-directory'],
    });
  }

  for (const expressServiceFile of expressServiceFiles) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressServiceFile,
      signal: 'express-service-file',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-service-file'],
    });
  }

  for (const expressPublicDirectory of expressPublicDirectories) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressPublicDirectory,
      signal: 'express-public-directory',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-public-directory'],
    });
  }

  for (const expressViewDirectory of expressViewDirectories) {
    countAreaRuleSignal({
      areasByOwner: expressAreasByOwner,
      entry: expressViewDirectory,
      signal: 'express-views-directory',
      score: EXPRESS_BACKEND_SIGNAL_SCORES['express-views-directory'],
    });
  }

  for (const [ownerPath, ownerCandidate] of expressAreasByOwner) {
    const hasExistingBackendCandidate = hasAreaCandidate({
      candidates,
      name: 'Backend API',
      path: ownerPath,
    });

    if (hasExistingBackendCandidate) continue;

    if (
      !hasExpressBackendShape({
        countedSignals: ownerCandidate.countedSignals,
      })
    ) {
      continue;
    }

    addAreaScore({
      candidates,
      name: 'Backend API',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Express.js',
      relatedTechnologies: ['Node.js'],
    });
  }
}
