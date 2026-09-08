import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

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
} as const;

type LaravelBackendSignal = keyof typeof LARAVEL_BACKEND_SIGNAL_SCORES;

/**
 * Adds owner-scoped `Backend API` candidates from Laravel path evidence.
 * Owners are resolved through `resolve-unit-root-owner` anchored on `artisan`
 * (the Laravel project root), otherwise the generic resolver, so a Laravel app
 * in a bare subdirectory and sibling Laravel apps in one repo each resolve to
 * their own owner.
 * An owner passes the gate via any one of: artisan entry + bootstrap app;
 * bootstrap app/providers plus a service provider or route file; bootstrap
 * app + HTTP kernel plus a route-service provider or route file; or artisan
 * entry + app service provider plus a route file. `PHP` is always related;
 * `Blade` is added only for owners with a counted Blade view.
 */
export function addLaravelBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<LaravelBackendSignal>({
    candidates,
    index,
    detectedArea: 'Backend API',
    primaryTech: 'Laravel',
    relatedTechs: ['PHP'],
    dynamicRelatedTechMap: {
      'laravel-blade-view': 'Blade',
    },
    signalScores: LARAVEL_BACKEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'laravel-artisan-entry',
        regex: /^artisan$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'laravel-bootstrap-app',
        regex: /(^|\/)bootstrap\/app\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-bootstrap-providers',
        regex: /(^|\/)bootstrap\/providers\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-app-service-provider',
        regex: /(^|\/)app\/providers\/appserviceprovider\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-route-service-provider',
        regex: /(^|\/)app\/providers\/routeserviceprovider\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-http-kernel',
        regex: /(^|\/)app\/http\/kernel\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-web-routes',
        regex: /(^|\/)routes\/web\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-api-routes',
        regex: /(^|\/)routes\/api\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-console-routes',
        regex: /(^|\/)routes\/console\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-broadcast-routes',
        regex: /(^|\/)routes\/channels\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-public-entry',
        regex: /(^|\/)public\/index\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-controller',
        regex: /(^|\/)app\/http\/controllers\/(?:.*\/)?[^/]+controller\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-blade-view',
        regex: /(^|\/)resources\/views\/(?:.*\/)?[^/]+\.blade\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-model',
        regex: /(^|\/)app\/models\/(?:.*\/)?[^/]+\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-migration',
        regex:
          /(^|\/)database\/migrations\/\d{4}_\d{2}_\d{2}_\d{6}_[^/]+\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-database-seeder',
        regex: /(^|\/)database\/(?:seeders|seeds)\/databaseseeder\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'laravel-config-app',
        regex: /(^|\/)config\/app\.php$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'php-composer-manifest',
        regex: /^composer\.json$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            { hasAllOf: ['laravel-artisan-entry', 'laravel-bootstrap-app'] },
            {
              hasAllOf: [
                'laravel-bootstrap-app',
                'laravel-bootstrap-providers',
              ],
              hasOneOf: [
                'laravel-app-service-provider',
                'laravel-web-routes',
                'laravel-api-routes',
                'laravel-console-routes',
              ],
            },
            {
              hasAllOf: ['laravel-bootstrap-app', 'laravel-http-kernel'],
              hasOneOf: [
                'laravel-route-service-provider',
                'laravel-web-routes',
                'laravel-api-routes',
                'laravel-console-routes',
              ],
            },
            {
              hasAllOf: [
                'laravel-artisan-entry',
                'laravel-app-service-provider',
              ],
              hasOneOf: [
                'laravel-web-routes',
                'laravel-api-routes',
                'laravel-console-routes',
              ],
            },
          ],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
