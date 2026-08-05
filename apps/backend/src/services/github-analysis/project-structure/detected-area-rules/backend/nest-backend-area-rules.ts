import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addAreaScore } from '../../project-structure-detected-area-candidates';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  type AreaRuleSignalScores,
} from '../project-structure-area-rule-candidates';

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

function hasNestBackendShape({
  countedSignals,
}: {
  countedSignals: Set<NestBackendSignal>;
}): boolean {
  const hasCliConfig = countedSignals.has('nest-cli-config');
  const hasMainEntry = countedSignals.has('nest-main-entry');
  const hasRootModule = countedSignals.has('nest-root-module');
  const hasStandardController = countedSignals.has('nest-standard-controller');
  const hasController = countedSignals.has('nest-controller');
  const hasFeatureModule = countedSignals.has('nest-feature-module');
  const hasGateway = countedSignals.has('nest-gateway');
  const hasResolver = countedSignals.has('nest-resolver');

  const hasTransportHandler =
    hasStandardController || hasController || hasGateway || hasResolver;

  const hasCliBackedShape =
    hasCliConfig &&
    (hasMainEntry ||
      hasRootModule ||
      hasStandardController ||
      hasController ||
      hasFeatureModule ||
      hasGateway ||
      hasResolver);

  const hasCanonicalAppShape = hasMainEntry && hasRootModule;

  const hasCustomAppShape =
    hasMainEntry && hasFeatureModule && hasTransportHandler;

  const hasModuleOwnedShape = hasRootModule && hasTransportHandler;

  return (
    hasCliBackedShape ||
    hasCanonicalAppShape ||
    hasCustomAppShape ||
    hasModuleOwnedShape
  );
}

/**
 * Adds `Backend API` candidates from NestJS path evidence.
 */
export function addNestBackendAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  const nestAreasByOwner = createAreaRuleCandidateMap<NestBackendSignal>();

  const nestCliConfigFiles = index.findFilesByNameMatching({
    pattern: /^nest-cli\.json$/,
  });

  const nestMainEntryFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/main\.(ts|js)$/,
  });

  const nestRootModuleFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.module\.(ts|js)$/,
  });

  const nestStandardControllerFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.controller\.(ts|js)$/,
  });

  const nestStandardServiceFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/app\.service\.(ts|js)$/,
  });

  const nestControllerFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/(?!app\.controller\.(ts|js)$)(?:.*\/)?[^/]+\.controller\.(ts|js)$/,
  });

  const nestFeatureModuleFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/(?!app\.module\.(ts|js)$)(?:.*\/)?[^/]+\.module\.(ts|js)$/,
  });

  const nestServiceFiles = index.findEntriesByPathMatching({
    pattern:
      /(^|\/)src\/(?!app\.service\.(ts|js)$)(?:.*\/)?[^/]+\.service\.(ts|js)$/,
  });

  const nestGatewayFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/(?:.*\/)?[^/]+\.gateway\.(ts|js)$/,
  });

  const nestResolverFiles = index.findEntriesByPathMatching({
    pattern: /(^|\/)src\/(?:.*\/)?[^/]+\.resolver\.(ts|js)$/,
  });

  for (const nestCliConfigFile of nestCliConfigFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestCliConfigFile,
      signal: 'nest-cli-config',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-cli-config'],
    });
  }

  for (const nestMainEntryFile of nestMainEntryFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestMainEntryFile,
      signal: 'nest-main-entry',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-main-entry'],
    });
  }

  for (const nestRootModuleFile of nestRootModuleFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestRootModuleFile,
      signal: 'nest-root-module',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-root-module'],
    });
  }

  for (const nestStandardControllerFile of nestStandardControllerFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestStandardControllerFile,
      signal: 'nest-standard-controller',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-standard-controller'],
    });
  }

  for (const nestStandardServiceFile of nestStandardServiceFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestStandardServiceFile,
      signal: 'nest-standard-service',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-standard-service'],
    });
  }

  for (const nestControllerFile of nestControllerFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestControllerFile,
      signal: 'nest-controller',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-controller'],
    });
  }

  for (const nestFeatureModuleFile of nestFeatureModuleFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestFeatureModuleFile,
      signal: 'nest-feature-module',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-feature-module'],
    });
  }

  for (const nestServiceFile of nestServiceFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestServiceFile,
      signal: 'nest-service',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-service'],
    });
  }

  for (const nestGatewayFile of nestGatewayFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestGatewayFile,
      signal: 'nest-gateway',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-gateway'],
    });
  }

  for (const nestResolverFile of nestResolverFiles) {
    countAreaRuleSignal({
      areasByOwner: nestAreasByOwner,
      entry: nestResolverFile,
      signal: 'nest-resolver',
      score: NEST_BACKEND_SIGNAL_SCORES['nest-resolver'],
    });
  }

  for (const [ownerPath, ownerCandidate] of nestAreasByOwner) {
    if (
      !hasNestBackendShape({
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
      primaryTechnology: 'NestJS',
      relatedTechnologies: ['Node.js'],
    });
  }
}
