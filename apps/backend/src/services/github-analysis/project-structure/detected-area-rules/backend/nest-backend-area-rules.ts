import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import type { AreaRuleSignalScores } from '../project-structure-area-rule-candidates';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

type NestBackendSignal =
  | 'nest-cli-config'
  | 'nest-main-entry'
  | 'nest-root-module'
  | 'nest-standard-controller'
  | 'nest-standard-service'
  | 'nest-controller'
  | 'nest-feature-module'
  | 'nest-service'
  | 'nest-gateway'
  | 'nest-resolver';

const NEST_BACKEND_SIGNAL_SCORES = {
  'nest-cli-config': 4,
  'nest-main-entry': 1,
  'nest-root-module': 3,
  'nest-standard-controller': 2,
  'nest-standard-service': 1,
  'nest-controller': 2,
  'nest-feature-module': 2,
  'nest-service': 1,
  'nest-gateway': 2,
  'nest-resolver': 2,
} satisfies AreaRuleSignalScores<NestBackendSignal>;

/**
 * Adds `Backend API` candidates from NestJS path evidence.
 *
 * Inputs: `candidates` (shared candidate map) and `index` (repository entry
 * index) from `DetectedAreaRuleContext`.
 * Output: none; mutates `candidates` in place.
 * Side effects: adds one `Backend API` / `NestJS` candidate (related technology
 * `Node.js`) per owner path whose counted signals form a NestJS application
 * shape.
 *
 * Signals are grouped by the generic `ownerPathForApplicationArea` owner and
 * counted once per signal type across `nest-cli.json`, `src/main.*`,
 * `src/app.module.*`, the standard `src/app.controller.*` / `src/app.service.*`
 * files, and nested feature `*.controller.* ` / `*.module.* ` / `*.service.* ` /
 * `*.gateway.* ` / `*.resolver.*` files. The feature-controller, feature-module,
 * and feature-service schemas carry a leading negative lookahead so the
 * standard `src/app.*` files land only in their dedicated buckets and never
 * also count as broad feature signals.
 *
 * Gate: an owner emits only when its counted signals form one of four NestJS
 * shapes -- CLI config plus any other gate-capable signal; main entry plus root
 * module; main entry plus a feature module and a transport handler
 * (controller/gateway/resolver); or root module plus a transport handler.
 * Standard and feature services are score-only evidence and never satisfy the
 * gate on their own.
 */
export function addNestBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<NestBackendSignal>({
    candidates,
    index,
    detectedArea: 'Backend API',
    primaryTech: 'NestJS',
    relatedTechs: ['Node.js'],
    signalScores: NEST_BACKEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'nest-cli-config',
        regex: /^nest-cli\.json$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'nest-main-entry',
        regex: /(^|\/)src\/main\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nest-root-module',
        regex: /(^|\/)src\/app\.module\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nest-standard-controller',
        regex: /(^|\/)src\/app\.controller\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nest-standard-service',
        regex: /(^|\/)src\/app\.service\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nest-controller',
        regex:
          /(^|\/)src\/(?!app\.controller\.(ts|js)$)(?:.*\/)?[^/]+\.controller\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nest-feature-module',
        regex:
          /(^|\/)src\/(?!app\.module\.(ts|js)$)(?:.*\/)?[^/]+\.module\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nest-service',
        regex:
          /(^|\/)src\/(?!app\.service\.(ts|js)$)(?:.*\/)?[^/]+\.service\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nest-gateway',
        regex: /(^|\/)src\/(?:.*\/)?[^/]+\.gateway\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'nest-resolver',
        regex: /(^|\/)src\/(?:.*\/)?[^/]+\.resolver\.(ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              has: 'nest-cli-config',
              hasOneOf: [
                'nest-main-entry',
                'nest-root-module',
                'nest-standard-controller',
                'nest-controller',
                'nest-feature-module',
                'nest-gateway',
                'nest-resolver',
              ],
            },
            {
              hasAllOf: ['nest-main-entry', 'nest-root-module'],
            },
            {
              hasAllOf: ['nest-main-entry', 'nest-feature-module'],
              hasOneOf: [
                'nest-standard-controller',
                'nest-controller',
                'nest-gateway',
                'nest-resolver',
              ],
            },
            {
              has: 'nest-root-module',
              hasOneOf: [
                'nest-standard-controller',
                'nest-controller',
                'nest-gateway',
                'nest-resolver',
              ],
            },
          ],
        },
      },
    },
  });
}
