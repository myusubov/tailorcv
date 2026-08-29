import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

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
} as const;

type ExpressBackendSignal = keyof typeof EXPRESS_BACKEND_SIGNAL_SCORES;

/**
 * Adds owner-scoped `Backend API` candidates from conservative Express.js path
 * evidence.
 *
 * Express runs after every stronger backend framework detector, and
 * `checkForExistingCandidate` makes the engine skip an owner that already has a
 * `Backend API` claim so weak Express-like folder structure never pollutes
 * NestJS or other framework metadata.
 *
 * Express has no mandatory path conventions, so an owner passes the gate only
 * via a generator shape or an app/server entry paired with real route and
 * handler files: generator `bin/www` + root `app.*` + a route file + generator
 * support (`views/`, `public/`, or a default `routes/index|users` file); a root
 * or `src/` `app.*` entry + a route file + a controller file + support (a
 * middleware file, a `*.service.*` file, or a `services/` directory); or a
 * `server.*` entry + a route file + a controller file + support + a
 * `package.json`. `Node.js` is always related; package contents and source
 * calls such as `express()` are left for later analyzers.
 */
export function addExpressBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<ExpressBackendSignal>({
    candidates,
    index,
    detectedArea: 'Backend API',
    primaryTech: 'Express.js',
    relatedTechs: ['Node.js'],
    checkForExistingCandidate: true,
    signalScores: EXPRESS_BACKEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'express-generator-bin-www',
        regex: /(^|\/)bin\/www$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-root-app-entry',
        regex:
          /^(app\.(?:js|cjs|mjs|ts|cts|mts)|(?:apps|packages)\/[^/]+\/app\.(?:js|cjs|mjs|ts|cts|mts))$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-src-app-entry',
        regex: /(^|\/)src\/app\.(?:js|cjs|mjs|ts|cts|mts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-server-entry',
        regex:
          /^(server\.(?:js|cjs|mjs|ts|cts|mts)|(?:apps|packages)\/[^/]+\/server\.(?:js|cjs|mjs|ts|cts|mts)|(?:^|.*\/)src\/server\.(?:js|cjs|mjs|ts|cts|mts))$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-package-manifest',
        regex: /^package\.json$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'express-routes-directory',
        regex: /(^|\/)src\/routes$|(^|\/)routes$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'express-route-file',
        regex:
          /(^|\/)(?:src\/)?routes\/(?:.*\/)?[^/]+\.(?:js|cjs|mjs|ts|cts|mts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-generator-default-route',
        regex:
          /(^|\/)(?:src\/)?routes\/(?:index|users)\.(?:js|cjs|mjs|ts|cts|mts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-controllers-directory',
        regex: /(^|\/)src\/controllers$|(^|\/)controllers$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'express-controller-file',
        regex:
          /(^|\/)(?:src\/)?controllers\/(?:.*\/)?[^/]+\.(?:js|cjs|mjs|ts|cts|mts)$|(^|\/)[^/]+\.controller\.(?:js|cjs|mjs|ts|cts|mts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-middleware-directory',
        regex: /(^|\/)src\/middlewares?$|(^|\/)middlewares?$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'express-middleware-file',
        regex:
          /(^|\/)(?:src\/)?middlewares?\/(?:.*\/)?[^/]+\.(?:js|cjs|mjs|ts|cts|mts)$|(^|\/)[^/]+\.middleware\.(?:js|cjs|mjs|ts|cts|mts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-services-directory',
        regex: /(^|\/)src\/services$|(^|\/)services$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'express-service-file',
        regex:
          /(^|\/)(?:src\/)?services\/(?:.*\/)?[^/]+\.service\.(?:js|cjs|mjs|ts|cts|mts)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'express-public-directory',
        regex: /(^|\/)public$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'express-views-directory',
        regex: /(^|\/)views$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              hasAllOf: [
                'express-generator-bin-www',
                'express-root-app-entry',
                'express-route-file',
              ],
              hasOneOf: [
                'express-views-directory',
                'express-public-directory',
                'express-generator-default-route',
              ],
            },
            {
              hasAllOf: ['express-route-file', 'express-controller-file'],
              hasOneOf: ['express-root-app-entry', 'express-src-app-entry'],
              or: [
                { has: 'express-middleware-file' },
                { has: 'express-service-file' },
                { has: 'express-services-directory' },
              ],
            },
            {
              hasAllOf: [
                'express-server-entry',
                'express-route-file',
                'express-controller-file',
                'express-package-manifest',
              ],
              hasOneOf: [
                'express-middleware-file',
                'express-service-file',
                'express-services-directory',
              ],
            },
          ],
        },
      },
    },
  });
}
