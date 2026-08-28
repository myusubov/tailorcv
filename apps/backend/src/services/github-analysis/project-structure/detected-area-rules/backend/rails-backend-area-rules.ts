import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const RAILS_BACKEND_SIGNAL_SCORES = {
  'rails-bin-entry': 4,
  'rails-application-config': 4,
  'rails-boot-config': 3,
  'rails-environment-entry': 3,
  'rails-environment-config': 2,
  'rails-routes': 3,
  'rails-rack-entry': 2,
  'rails-application-controller': 3,
  'rails-controller': 2,
  'rails-application-record': 2,
  'rails-model': 1,
  'rails-erb-view': 2,
  'rails-migration': 2,
  'rails-schema': 2,
  'rails-database-config': 2,
  'rails-application-job': 2,
  'rails-application-mailer': 2,
  'ruby-gemfile': 1,
  'ruby-rakefile': 1,
} as const;

type RailsBackendSignal = keyof typeof RAILS_BACKEND_SIGNAL_SCORES;

/**
 * Adds owner-scoped `Backend API` candidates from Ruby on Rails path
 * evidence. Only repository-root, `apps/*`, and `packages/*` application
 * paths are considered, preventing nested test or generator applications
 * from claiming their containing repository. An owner passes the gate via
 * any one of: application config + bin entry plus boot config or an
 * environment entry; application config + environment entry + Rack entry;
 * application config + routes + application controller; or application
 * config + boot config + routes. `Ruby` is always related; `ERB` is added
 * only for owners with a counted ERB view.
 */
export function addRailsBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<RailsBackendSignal>({
    candidates,
    index,
    detectedArea: 'Backend API',
    primaryTech: 'Ruby on Rails',
    relatedTechs: ['Ruby'],
    dynamicRelatedTechMap: {
      'rails-erb-view': 'ERB',
    },
    signalScores: RAILS_BACKEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'rails-bin-entry',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?bin\/rails$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-application-config',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?config\/application\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-boot-config',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?config\/boot\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-environment-entry',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?config\/environment\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-environment-config',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?config\/environments\/(?:development|production|test)\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-routes',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?config\/routes\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-rack-entry',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?config\.ru$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-application-controller',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?app\/controllers\/application_controller\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-controller',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?app\/controllers\/(?:.*\/)?(?!application_controller\.rb$)[^/]+_controller\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-application-record',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?app\/models\/application_record\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-model',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?app\/models\/(?:.*\/)?(?!application_record\.rb$)[^/]+\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-erb-view',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?app\/views\/(?:.*\/)?[^/]+\.html\.erb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-migration',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?db\/migrate\/\d{14}_[^/]+\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-schema',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?db\/(?:schema\.rb|structure\.sql)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-database-config',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?config\/database\.yml$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-application-job',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?app\/jobs\/application_job\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'rails-application-mailer',
        regex:
          /^(?:(?:apps|packages)\/[^/]+\/)?app\/mailers\/application_mailer\.rb$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ruby-gemfile',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?gemfile$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ruby-rakefile',
        regex: /^(?:(?:apps|packages)\/[^/]+\/)?rakefile$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              hasAllOf: ['rails-application-config', 'rails-bin-entry'],
              hasOneOf: ['rails-boot-config', 'rails-environment-entry'],
            },
            {
              hasAllOf: [
                'rails-application-config',
                'rails-environment-entry',
                'rails-rack-entry',
              ],
            },
            {
              hasAllOf: [
                'rails-application-config',
                'rails-routes',
                'rails-application-controller',
              ],
            },
            {
              hasAllOf: [
                'rails-application-config',
                'rails-boot-config',
                'rails-routes',
              ],
            },
          ],
        },
      },
    },
  });
}
