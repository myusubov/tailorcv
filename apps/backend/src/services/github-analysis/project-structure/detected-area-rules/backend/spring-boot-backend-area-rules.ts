import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

const SPRING_BOOT_BACKEND_SIGNAL_SCORES = {
  'spring-java-build-file': 1,
  'spring-boot-main-application-java': 3,
  'spring-boot-main-application-kotlin': 3,
  'spring-boot-application-config': 3,
  'spring-boot-profile-config': 2,
  'spring-web-controller-java': 2,
  'spring-web-controller-kotlin': 2,
  'spring-rest-resource-java': 2,
  'spring-rest-resource-kotlin': 2,
  'spring-data-repository-java': 1,
  'spring-data-repository-kotlin': 1,
  'spring-service-java': 1,
  'spring-service-kotlin': 1,
  'spring-configuration-class-java': 1,
  'spring-configuration-class-kotlin': 1,
} as const;

type SpringBootBackendSignal = keyof typeof SPRING_BOOT_BACKEND_SIGNAL_SCORES;

/**
 * Adds `Backend API` candidates from Spring Boot path evidence. Every source
 * signal that Java and Kotlin can both satisfy (main application, web
 * controller, REST resource, data repository, service, configuration class)
 * is split into a `-java`/`-kotlin` pair so related technology can be
 * derived purely from counted-signal presence, the same mechanism Laravel
 * and Rails use for Blade/ERB. An owner passes the gate via any one of:
 * a main application plus the application config; a main application plus a
 * controller or REST resource, plus the application/profile config, the
 * build file, a repository, a service, or a configuration class; or the
 * application config plus a controller or REST resource, plus the build
 * file, a repository, a service, or a configuration class.
 */
export function addSpringBootBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<SpringBootBackendSignal>({
    candidates,
    index,
    detectedArea: 'Backend API',
    primaryTech: 'Spring Boot',
    dynamicRelatedTechMap: {
      'spring-boot-main-application-java': 'Java',
      'spring-boot-main-application-kotlin': 'Kotlin',
      'spring-web-controller-java': 'Java',
      'spring-web-controller-kotlin': 'Kotlin',
      'spring-rest-resource-java': 'Java',
      'spring-rest-resource-kotlin': 'Kotlin',
      'spring-data-repository-java': 'Java',
      'spring-data-repository-kotlin': 'Kotlin',
      'spring-service-java': 'Java',
      'spring-service-kotlin': 'Kotlin',
      'spring-configuration-class-java': 'Java',
      'spring-configuration-class-kotlin': 'Kotlin',
    },
    signalScores: SPRING_BOOT_BACKEND_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'spring-java-build-file',
        regex: /^(pom\.xml|build\.gradle|build\.gradle\.kts)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'spring-boot-main-application-java',
        regex:
          /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]*application(?:app)?\.java$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-boot-main-application-kotlin',
        regex:
          /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]*application(?:app)?\.kt$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-boot-application-config',
        regex:
          /(^|\/)src\/main\/resources\/(?:config\/)?application\.(properties|ya?ml)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-boot-profile-config',
        regex:
          /(^|\/)src\/main\/resources\/(?:config\/)?application-[^/]+\.(properties|ya?ml)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-web-controller-java',
        regex:
          /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+controller\.java$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-web-controller-kotlin',
        regex: /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+controller\.kt$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-rest-resource-java',
        regex: /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+resource\.java$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-rest-resource-kotlin',
        regex: /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+resource\.kt$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-data-repository-java',
        regex:
          /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+repository\.java$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-data-repository-kotlin',
        regex: /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+repository\.kt$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-service-java',
        regex: /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+service\.java$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-service-kotlin',
        regex: /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+service\.kt$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-configuration-class-java',
        regex:
          /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+(?:configuration|config)\.java$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'spring-configuration-class-kotlin',
        regex:
          /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+(?:configuration|config)\.kt$/,
        indexMethod: 'findEntriesByPathMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            {
              hasOneOf: [
                'spring-boot-main-application-java',
                'spring-boot-main-application-kotlin',
              ],
              has: 'spring-boot-application-config',
            },
            {
              has: 'spring-boot-main-application-java',
              hasOneOf: [
                'spring-web-controller-java',
                'spring-web-controller-kotlin',
                'spring-rest-resource-java',
                'spring-rest-resource-kotlin',
              ],
              or: [
                { has: 'spring-boot-application-config' },
                { has: 'spring-boot-profile-config' },
                { has: 'spring-java-build-file' },
                { has: 'spring-data-repository-java' },
                { has: 'spring-data-repository-kotlin' },
                { has: 'spring-service-java' },
                { has: 'spring-service-kotlin' },
                { has: 'spring-configuration-class-java' },
                { has: 'spring-configuration-class-kotlin' },
              ],
            },
            {
              has: 'spring-boot-main-application-kotlin',
              hasOneOf: [
                'spring-web-controller-java',
                'spring-web-controller-kotlin',
                'spring-rest-resource-java',
                'spring-rest-resource-kotlin',
              ],
              or: [
                { has: 'spring-boot-application-config' },
                { has: 'spring-boot-profile-config' },
                { has: 'spring-java-build-file' },
                { has: 'spring-data-repository-java' },
                { has: 'spring-data-repository-kotlin' },
                { has: 'spring-service-java' },
                { has: 'spring-service-kotlin' },
                { has: 'spring-configuration-class-java' },
                { has: 'spring-configuration-class-kotlin' },
              ],
            },
            {
              has: 'spring-boot-application-config',
              hasOneOf: [
                'spring-web-controller-java',
                'spring-web-controller-kotlin',
                'spring-rest-resource-java',
                'spring-rest-resource-kotlin',
              ],
              or: [
                { has: 'spring-java-build-file' },
                { has: 'spring-data-repository-java' },
                { has: 'spring-data-repository-kotlin' },
                { has: 'spring-service-java' },
                { has: 'spring-service-kotlin' },
                { has: 'spring-configuration-class-java' },
                { has: 'spring-configuration-class-kotlin' },
              ],
            },
          ],
        },
      },
    },
  });
}
