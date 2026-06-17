import type {
  DetectedAreaTechnology,
  RepoTreeEntry,
} from '../../project-structure-analyzer.types';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { ownerPathForApplicationArea } from '../../project-structure-path-utils';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleCandidate,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

type SpringBootBackendSignal =
  | 'spring-java-build-file'
  | 'spring-boot-main-application'
  | 'spring-boot-application-config'
  | 'spring-boot-profile-config'
  | 'spring-web-controller'
  | 'spring-rest-resource'
  | 'spring-data-repository'
  | 'spring-service'
  | 'spring-configuration-class';

const SPRING_BOOT_BACKEND_SIGNAL_SCORES = {
  'spring-java-build-file': 1,
  'spring-boot-main-application': 3,
  'spring-boot-application-config': 3,
  'spring-boot-profile-config': 2,
  'spring-web-controller': 2,
  'spring-rest-resource': 2,
  'spring-data-repository': 1,
  'spring-service': 1,
  'spring-configuration-class': 1,
} satisfies AreaRuleSignalScores<SpringBootBackendSignal>;

const IGNORED_SPRING_BOOT_EVIDENCE_PREFIXES = [
  'docs/',
  'test/',
  'tests/',
  'fixtures/',
] as const;

function hasSpringBootBackendShape({
  countedSignals,
}: {
  countedSignals: Set<SpringBootBackendSignal>;
}): boolean {
  const hasBuildFile = countedSignals.has('spring-java-build-file');
  const hasMainApplication = countedSignals.has('spring-boot-main-application');
  const hasApplicationConfig = countedSignals.has(
    'spring-boot-application-config',
  );
  const hasProfileConfig = countedSignals.has('spring-boot-profile-config');
  const hasController = countedSignals.has('spring-web-controller');
  const hasRestResource = countedSignals.has('spring-rest-resource');
  const hasRepository = countedSignals.has('spring-data-repository');
  const hasService = countedSignals.has('spring-service');
  const hasConfigurationClass = countedSignals.has(
    'spring-configuration-class',
  );

  const hasConfig = hasApplicationConfig || hasProfileConfig;
  const hasTransportHandler = hasController || hasRestResource;
  const hasJavaSupport =
    hasBuildFile || hasRepository || hasService || hasConfigurationClass;

  const hasCanonicalBootShape = hasMainApplication && hasApplicationConfig;

  const hasBootWebShape =
    hasMainApplication && hasTransportHandler && (hasConfig || hasJavaSupport);

  const hasConfigBackedWebShape =
    hasApplicationConfig && hasTransportHandler && hasJavaSupport;

  return hasCanonicalBootShape || hasBootWebShape || hasConfigBackedWebShape;
}

function isIgnoredSpringBootEvidencePath({
  entry,
}: {
  entry: Pick<RepoTreeEntry, 'path'>;
}): boolean {
  const path = entry.path.toLowerCase();

  return IGNORED_SPRING_BOOT_EVIDENCE_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  );
}

function countSpringBootBackendSignal({
  areasByOwner,
  entry,
  signal,
}: {
  areasByOwner: Map<string, AreaRuleCandidate<SpringBootBackendSignal>>;
  entry: RepoTreeEntry;
  signal: SpringBootBackendSignal;
}): void {
  if (isIgnoredSpringBootEvidencePath({ entry })) return;

  countAreaRuleSignal({
    areasByOwner,
    entry,
    signal,
    score: SPRING_BOOT_BACKEND_SIGNAL_SCORES[signal],
  });
}

function addLanguageEvidence({
  languagesByOwner,
  entry,
}: {
  languagesByOwner: Map<string, Set<DetectedAreaTechnology>>;
  entry: RepoTreeEntry;
}): void {
  if (isIgnoredSpringBootEvidencePath({ entry })) return;
  if (entry.extension !== 'java' && entry.extension !== 'kt') return;

  const ownerPath = ownerPathForApplicationArea({ path: entry.path });
  const ownerLanguages =
    languagesByOwner.get(ownerPath) ?? new Set<DetectedAreaTechnology>();

  ownerLanguages.add(entry.extension === 'kt' ? 'Kotlin' : 'Java');
  languagesByOwner.set(ownerPath, ownerLanguages);
}

/**
 * Adds `Backend API` candidates from Spring Boot path evidence.
 */
export function addSpringBootBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const springBootAreasByOwner =
    createAreaRuleCandidateMap<SpringBootBackendSignal>();
  const springBootLanguagesByOwner = new Map<
    string,
    Set<DetectedAreaTechnology>
  >();

  const springJavaBuildFiles = index.findFilesByNameMatching({
    pattern: /^(pom\.xml|build\.gradle|build\.gradle\.kts)$/,
  });

  const springBootMainApplicationFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]*application(?:app)?\.(java|kt)$/,
  });

  const springBootApplicationConfigFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/main\/resources\/(?:config\/)?application\.(properties|ya?ml)$/,
  });

  const springBootProfileConfigFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/main\/resources\/(?:config\/)?application-[^/]+\.(properties|ya?ml)$/,
  });

  const springWebControllerFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+controller\.(java|kt)$/,
  });

  const springRestResourceFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+resource\.(java|kt)$/,
  });

  const springDataRepositoryFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+repository\.(java|kt)$/,
  });

  const springServiceFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+service\.(java|kt)$/,
  });

  const springConfigurationClassFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/main\/(java|kotlin)\/(?:.*\/)?[^/]+(?:configuration|config)\.(java|kt)$/,
  });

  for (const springJavaBuildFile of springJavaBuildFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springJavaBuildFile,
      signal: 'spring-java-build-file',
    });
  }

  for (const springBootMainApplicationFile of springBootMainApplicationFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springBootMainApplicationFile,
      signal: 'spring-boot-main-application',
    });
    addLanguageEvidence({
      languagesByOwner: springBootLanguagesByOwner,
      entry: springBootMainApplicationFile,
    });
  }

  for (const springBootApplicationConfigFile of springBootApplicationConfigFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springBootApplicationConfigFile,
      signal: 'spring-boot-application-config',
    });
  }

  for (const springBootProfileConfigFile of springBootProfileConfigFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springBootProfileConfigFile,
      signal: 'spring-boot-profile-config',
    });
  }

  for (const springWebControllerFile of springWebControllerFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springWebControllerFile,
      signal: 'spring-web-controller',
    });
    addLanguageEvidence({
      languagesByOwner: springBootLanguagesByOwner,
      entry: springWebControllerFile,
    });
  }

  for (const springRestResourceFile of springRestResourceFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springRestResourceFile,
      signal: 'spring-rest-resource',
    });
    addLanguageEvidence({
      languagesByOwner: springBootLanguagesByOwner,
      entry: springRestResourceFile,
    });
  }

  for (const springDataRepositoryFile of springDataRepositoryFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springDataRepositoryFile,
      signal: 'spring-data-repository',
    });
    addLanguageEvidence({
      languagesByOwner: springBootLanguagesByOwner,
      entry: springDataRepositoryFile,
    });
  }

  for (const springServiceFile of springServiceFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springServiceFile,
      signal: 'spring-service',
    });
    addLanguageEvidence({
      languagesByOwner: springBootLanguagesByOwner,
      entry: springServiceFile,
    });
  }

  for (const springConfigurationClassFile of springConfigurationClassFiles) {
    countSpringBootBackendSignal({
      areasByOwner: springBootAreasByOwner,
      entry: springConfigurationClassFile,
      signal: 'spring-configuration-class',
    });
    addLanguageEvidence({
      languagesByOwner: springBootLanguagesByOwner,
      entry: springConfigurationClassFile,
    });
  }

  for (const [ownerPath, ownerCandidate] of springBootAreasByOwner) {
    if (
      !hasSpringBootBackendShape({
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
      primaryTechnology: 'Spring Boot',
      relatedTechnologies: [
        ...(springBootLanguagesByOwner.get(ownerPath) ?? []),
      ],
    });
  }
}
