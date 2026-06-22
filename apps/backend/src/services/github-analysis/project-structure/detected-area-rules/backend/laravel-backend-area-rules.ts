import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

type LaravelBackendSignal =
  | 'laravel-artisan-entry'
  | 'laravel-bootstrap-app'
  | 'laravel-bootstrap-providers'
  | 'laravel-app-service-provider'
  | 'laravel-route-service-provider'
  | 'laravel-http-kernel'
  | 'laravel-web-routes'
  | 'laravel-api-routes'
  | 'laravel-console-routes'
  | 'laravel-broadcast-routes'
  | 'laravel-public-entry'
  | 'laravel-controller'
  | 'laravel-blade-view'
  | 'laravel-model'
  | 'laravel-migration'
  | 'laravel-database-seeder'
  | 'laravel-config-app'
  | 'php-composer-manifest';

const LARAVEL_BACKEND_SIGNAL_SCORES = {
  'laravel-artisan-entry': 4,
  'laravel-bootstrap-app': 4,
  'laravel-bootstrap-providers': 3,
  'laravel-app-service-provider': 3,
  'laravel-route-service-provider': 3,
  'laravel-http-kernel': 3,
  'laravel-web-routes': 3,
  'laravel-api-routes': 2,
  'laravel-console-routes': 3,
  'laravel-broadcast-routes': 2,
  'laravel-public-entry': 1,
  'laravel-controller': 2,
  'laravel-blade-view': 2,
  'laravel-model': 1,
  'laravel-migration': 2,
  'laravel-database-seeder': 2,
  'laravel-config-app': 2,
  'php-composer-manifest': 1,
} satisfies AreaRuleSignalScores<LaravelBackendSignal>;

/**
 * Returns whether one owner has an anchored Laravel application shape.
 * Score-only application files cannot satisfy the gate without Laravel
 * bootstrap, provider, kernel, or route ownership evidence.
 */
function hasLaravelBackendShape({
  countedSignals,
}: {
  countedSignals: Set<LaravelBackendSignal>;
}): boolean {
  const hasArtisanEntry = countedSignals.has('laravel-artisan-entry');
  const hasBootstrapApp = countedSignals.has('laravel-bootstrap-app');
  const hasBootstrapProviders = countedSignals.has(
    'laravel-bootstrap-providers',
  );
  const hasAppServiceProvider = countedSignals.has(
    'laravel-app-service-provider',
  );
  const hasRouteServiceProvider = countedSignals.has(
    'laravel-route-service-provider',
  );
  const hasHttpKernel = countedSignals.has('laravel-http-kernel');
  const hasWebRoutes = countedSignals.has('laravel-web-routes');
  const hasApiRoutes = countedSignals.has('laravel-api-routes');
  const hasConsoleRoutes = countedSignals.has('laravel-console-routes');

  const hasStandardRoute = hasWebRoutes || hasApiRoutes || hasConsoleRoutes;

  const hasCanonicalShape = hasArtisanEntry && hasBootstrapApp;

  const hasModernShape =
    hasBootstrapApp &&
    hasBootstrapProviders &&
    (hasAppServiceProvider || hasStandardRoute);

  const hasLegacyShape =
    hasBootstrapApp &&
    hasHttpKernel &&
    (hasRouteServiceProvider || hasStandardRoute);

  const hasArtisanOwnedShape =
    hasArtisanEntry && hasAppServiceProvider && hasStandardRoute;

  return (
    hasCanonicalShape ||
    hasModernShape ||
    hasLegacyShape ||
    hasArtisanOwnedShape
  );
}

/**
 * Adds owner-scoped `Backend API` candidates from Laravel path evidence.
 * Mutates the shared candidate map only for owners that pass the Laravel
 * application-shape gate.
 */
export function addLaravelBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const laravelAreasByOwner =
    createAreaRuleCandidateMap<LaravelBackendSignal>();

  const laravelArtisanEntries = index.findFilesByNameMatching({
    pattern: /^artisan$/,
  });

  const laravelBootstrapAppFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)bootstrap\/app\.php$/,
  });

  const laravelBootstrapProviderFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)bootstrap\/providers\.php$/,
  });

  const laravelAppServiceProviderFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/providers\/appserviceprovider\.php$/,
  });

  const laravelRouteServiceProviderFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/providers\/routeserviceprovider\.php$/,
  });

  const laravelHttpKernelFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/http\/kernel\.php$/,
  });

  const laravelWebRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)routes\/web\.php$/,
  });

  const laravelApiRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)routes\/api\.php$/,
  });

  const laravelConsoleRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)routes\/console\.php$/,
  });

  const laravelBroadcastRouteFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)routes\/channels\.php$/,
  });

  const laravelPublicEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)public\/index\.php$/,
  });

  const laravelControllerFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/http\/controllers\/(?:.*\/)?[^/]+controller\.php$/,
  });

  const laravelBladeViewFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)resources\/views\/(?:.*\/)?[^/]+\.blade\.php$/,
  });

  const laravelModelFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)app\/models\/(?:.*\/)?[^/]+\.php$/,
  });

  const laravelMigrationFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)database\/migrations\/\d{4}_\d{2}_\d{2}_\d{6}_[^/]+\.php$/,
  });

  const laravelDatabaseSeederFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)database\/(?:seeders|seeds)\/databaseseeder\.php$/,
  });

  const laravelConfigAppFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)config\/app\.php$/,
  });

  const phpComposerManifestFiles = index.findFilesByNameMatching({
    pattern: /^composer\.json$/,
  });

  for (const laravelArtisanEntry of laravelArtisanEntries) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelArtisanEntry,
      signal: 'laravel-artisan-entry',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-artisan-entry'],
    });
  }

  for (const laravelBootstrapAppFile of laravelBootstrapAppFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelBootstrapAppFile,
      signal: 'laravel-bootstrap-app',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-bootstrap-app'],
    });
  }

  for (const laravelBootstrapProviderFile of laravelBootstrapProviderFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelBootstrapProviderFile,
      signal: 'laravel-bootstrap-providers',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-bootstrap-providers'],
    });
  }

  for (const laravelAppServiceProviderFile of laravelAppServiceProviderFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelAppServiceProviderFile,
      signal: 'laravel-app-service-provider',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-app-service-provider'],
    });
  }

  for (const laravelRouteServiceProviderFile of laravelRouteServiceProviderFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelRouteServiceProviderFile,
      signal: 'laravel-route-service-provider',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-route-service-provider'],
    });
  }

  for (const laravelHttpKernelFile of laravelHttpKernelFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelHttpKernelFile,
      signal: 'laravel-http-kernel',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-http-kernel'],
    });
  }

  for (const laravelWebRouteFile of laravelWebRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelWebRouteFile,
      signal: 'laravel-web-routes',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-web-routes'],
    });
  }

  for (const laravelApiRouteFile of laravelApiRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelApiRouteFile,
      signal: 'laravel-api-routes',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-api-routes'],
    });
  }

  for (const laravelConsoleRouteFile of laravelConsoleRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelConsoleRouteFile,
      signal: 'laravel-console-routes',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-console-routes'],
    });
  }

  for (const laravelBroadcastRouteFile of laravelBroadcastRouteFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelBroadcastRouteFile,
      signal: 'laravel-broadcast-routes',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-broadcast-routes'],
    });
  }

  for (const laravelPublicEntryFile of laravelPublicEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelPublicEntryFile,
      signal: 'laravel-public-entry',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-public-entry'],
    });
  }

  for (const laravelControllerFile of laravelControllerFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelControllerFile,
      signal: 'laravel-controller',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-controller'],
    });
  }

  for (const laravelBladeViewFile of laravelBladeViewFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelBladeViewFile,
      signal: 'laravel-blade-view',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-blade-view'],
    });
  }

  for (const laravelModelFile of laravelModelFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelModelFile,
      signal: 'laravel-model',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-model'],
    });
  }

  for (const laravelMigrationFile of laravelMigrationFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelMigrationFile,
      signal: 'laravel-migration',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-migration'],
    });
  }

  for (const laravelDatabaseSeederFile of laravelDatabaseSeederFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelDatabaseSeederFile,
      signal: 'laravel-database-seeder',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-database-seeder'],
    });
  }

  for (const laravelConfigAppFile of laravelConfigAppFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: laravelConfigAppFile,
      signal: 'laravel-config-app',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['laravel-config-app'],
    });
  }

  for (const phpComposerManifestFile of phpComposerManifestFiles) {
    countAreaRuleSignal({
      areasByOwner: laravelAreasByOwner,
      entry: phpComposerManifestFile,
      signal: 'php-composer-manifest',
      score: LARAVEL_BACKEND_SIGNAL_SCORES['php-composer-manifest'],
    });
  }

  for (const [ownerPath, ownerCandidate] of laravelAreasByOwner) {
    if (
      !hasLaravelBackendShape({
        countedSignals: ownerCandidate.countedSignals,
      })
    ) {
      continue;
    }

    const hasBladeView =
      ownerCandidate.countedSignals.has('laravel-blade-view');

    addAreaScore({
      candidates,
      name: 'Backend API',
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: 'Laravel',
      relatedTechnologies: hasBladeView ? ['PHP', 'Blade'] : ['PHP'],
    });
  }
}
