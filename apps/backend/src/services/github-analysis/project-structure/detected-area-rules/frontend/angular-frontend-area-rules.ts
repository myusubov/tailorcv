import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

const ANGULAR_FRONTEND_SIGNAL_SCORES = {
  'angular-workspace-config': 4,
  'angular-root-component-ts': 4,
  'angular-app-module': 3,
  'angular-app-config': 2,
  'angular-main-entry': 2,
  'angular-root-component-view': 1,
  'angular-project-config': 1,
  'angular-app-directory': 1,
} as const;

type AngularFrontendSignal = keyof typeof ANGULAR_FRONTEND_SIGNAL_SCORES;

/**
 * Adds `Frontend app` candidates from Angular path evidence.
 * Angular-specific signals stay internal while emitted areas remain role-based.
 */
export function addAngularFrontendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<AngularFrontendSignal>({
    candidates,
    index,
    detectedArea: 'Frontend app',
    primaryTech: 'Angular',
    signalScores: ANGULAR_FRONTEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'angular-workspace-config',
        regex: /^angular\.json$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'angular-root-component-ts',
        regex: /(^|\/)src\/app\/app\.component\.ts$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'angular-root-component-view',
        regex: /(^|\/)src\/app\/app\.component\.(html|css|scss|sass|less)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'angular-app-module',
        regex: /(^|\/)src\/app\/app\.module\.ts$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'angular-app-config',
        regex: /(^|\/)src\/app\/app\.config\.ts$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'angular-main-entry',
        regex: /(^|\/)src\/main\.ts$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'angular-project-config',
        regex: /^project\.json$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'angular-app-directory',
        regex: /(^|\/)src\/app$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            { has: 'angular-workspace-config' },
            {
              has: 'angular-root-component-ts',
              hasOneOf: [
                'angular-main-entry',
                'angular-app-module',
                'angular-app-config',
              ],
            },
            { hasAllOf: ['angular-app-module', 'angular-main-entry'] },
          ],
        },
      },
    },
    ownerAdapter: resolveUnitRootOwner,
  });
}
