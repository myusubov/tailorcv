import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const DJANGO_BACKEND_SIGNAL_SCORES = {
  'django-manage-entry': 4,
  'django-settings-module': 3,
  'django-settings-package': 3,
  'django-root-urlconf': 2,
  'django-wsgi-entry': 3,
  'django-asgi-entry': 3,
  'django-app-config': 2,
  'django-models': 2,
  'django-migration': 2,
  'django-admin': 1,
  'django-views': 1,
  'django-app-urlconf': 1,
} as const;

type DjangoBackendSignal = keyof typeof DJANGO_BACKEND_SIGNAL_SCORES;

/**
 * Adds `Backend API` candidates from Django path evidence.
 */
export function addDjangoBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<DjangoBackendSignal>({
    candidates,
    index,
    detectedArea: 'Backend API',
    primaryTech: 'Django',
    relatedTechs: ['Python'],
    signalScores: DJANGO_BACKEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'django-manage-entry',
        regex: /^manage\.py$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'django-settings-module',
        regex: /(^|\/)settings\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-settings-package',
        regex: /(^|\/)settings\/(base|local|production|test)\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-root-urlconf',
        regex: /(^|\/)(config|mysite|project|core|server)\/urls\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-wsgi-entry',
        regex: /(^|\/)wsgi\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-asgi-entry',
        regex: /(^|\/)asgi\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-app-config',
        regex: /(^|\/)apps\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-models',
        regex: /(^|\/)models\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-migration',
        regex: /(^|\/)migrations\/0001_initial\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-admin',
        regex: /(^|\/)admin\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-views',
        regex: /(^|\/)views\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'django-app-urlconf',
        regex: /(^|\/)(?!(config|mysite|project|core|server)\/)urls\.py$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              has: 'django-manage-entry',
              or: [
                { has: 'django-settings-module' },
                { has: 'django-settings-package' },
                { has: 'django-root-urlconf' },
                { has: 'django-wsgi-entry' },
                { has: 'django-asgi-entry' },
              ],
            },
            {
              hasOneOf: ['django-settings-module', 'django-settings-package'],
              has: 'django-root-urlconf',
              or: [{ has: 'django-wsgi-entry' }, { has: 'django-asgi-entry' }],
            },
            {
              hasAllOf: ['django-manage-entry', 'django-app-config'],
              or: [{ has: 'django-models' }, { has: 'django-migration' }],
            },
            {
              hasOneOf: ['django-settings-module', 'django-settings-package'],
              hasAllOf: ['django-app-config', 'django-migration'],
            },
          ],
        },
      },
    },
  });
}
