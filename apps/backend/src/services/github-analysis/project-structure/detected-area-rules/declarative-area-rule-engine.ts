import { logger } from 'src/lib';
import {
  DetectedAreaTechnology,
  RepoTreeEntry,
} from '../project-structure-analyzer.types';
import { addAreaScore } from '../project-structure-detected-area-candidates';
import {
  DetectedAreaName,
  DetectedAreaRuleContext,
} from '../project-structure-detected-areas.types';
import {
  countAreaRuleSignal,
  createAreaRuleCandidateMap,
  hasCompetingAreaProof,
} from './project-structure-area-rule-candidates';

type IndexMethod =
  | 'findFilesByNameMatching'
  | 'findEntriesByPathMatching'
  | 'findDirectoriesByPathMatching';

export interface EntrySchema<Signal extends string> {
  signalType: Signal;
  regex: RegExp;
  indexMethod: IndexMethod;
}

interface ConditionShape<Signal extends string> {
  hasAllOf?: Signal[];
  hasOneOf?: Signal[];
  has?: Signal;
  or?: ConditionShape<Signal>[];
}

interface GateBlocker<Signal extends string> {
  where: {
    countedSignals: ConditionShape<Signal>;
  };
}

interface CompetingProofSchema {
  indexMethod: IndexMethod;
  regex: RegExp;
}

interface ApplyDeclarativeAreaDetectorParams<
  Signal extends string,
> extends DetectedAreaRuleContext {
  signalScores: Record<Signal, number>;
  entrySchemas: EntrySchema<Signal>[];
  detectedArea: DetectedAreaName;
  primaryTech: DetectedAreaTechnology;
  relatedTechs?: DetectedAreaTechnology[];
  gateBlocker?: GateBlocker<Signal>;
  competingProofSchemas?: CompetingProofSchema[];
}

function evaluateCondition<Signal extends string>({
  signals,
  conditions,
}: {
  signals: Set<Signal>;
  conditions: ConditionShape<Signal>;
}): boolean {
  const funcObj = {
    hasOneOf: (availableSignals: Signal[]): boolean => {
      const hasAtLeastOneSignal = availableSignals.some((signal) =>
        signals.has(signal),
      );
      // logger.info({ availableSignals, hasAtLeastOneSignal });
      if (!hasAtLeastOneSignal) {
        // logger.info("No matching signals found for 'hasOneOf' condition.");
        return false;
      }
      // logger.info("Matching signal found for 'hasOneOf' condition.");
      return true;
    },
    hasAllOf: (requiredSignals: Signal[]): boolean => {
      const hasAllrequiredSignals = requiredSignals.every((signal) =>
        signals.has(signal),
      );
      // logger.info({ requiredSignals, hasAllrequiredSignals });
      if (!hasAllrequiredSignals) {
        // logger.info("Not all required signals found for 'hasAllOf' condition.");
        return false;
      }
      // logger.info("All required signals found for 'hasAllOf' condition.");
      return true;
    },
    has: (signal: Signal): boolean => {
      return signals.has(signal);
    },
  };

  const { hasAllOf, hasOneOf, has, or } = conditions;
  return (
    (hasAllOf ? funcObj.hasAllOf(hasAllOf) : true) &&
    (hasOneOf ? funcObj.hasOneOf(hasOneOf) : true) &&
    (has ? funcObj.has(has) : true) &&
    (or
      ? or.some((nestedCondition) =>
          evaluateCondition({ signals, conditions: nestedCondition }),
        )
      : true)
  );
}

/**
 * Runs a schema-declared detected-area detector: matches each `entrySchema`
 * against the repository index, scores signals once per owner via
 * `countAreaRuleSignal`, and adds a `detectedArea` candidate to `candidates`
 * for every owner that passes the optional `gateBlocker` shape check and has
 * no competing-framework proof at its path.
 * `gateBlocker.where.countedSignals` is evaluated per owner via
 * `evaluateCondition`, supporting arbitrarily nested AND/OR shape checks
 * (such as Next.js's or Vue's app-shape requirements); omitting it allows any
 * owner with at least one matched signal through. `competingProofSchemas`,
 * when given, is matched against the repository index once up front and
 * vetoes an owner whose path also carries that evidence (see
 * `hasCompetingAreaProof`), independent of the owner's own gate result.
 */
export function applyDeclarativeAreaDetector<Signal extends string>({
  detectedArea,
  entrySchemas,
  primaryTech,
  signalScores,
  relatedTechs,
  candidates,
  index,
  gateBlocker,
  competingProofSchemas,
}: ApplyDeclarativeAreaDetectorParams<Signal>): void {
  const areaCandidateMap = createAreaRuleCandidateMap<Signal>();
  const competingProofEntries: RepoTreeEntry[] = [];

  for (const entrySchema of entrySchemas) {
    const { indexMethod, regex, signalType } = entrySchema;
    const score = signalScores[signalType];

    if (score === undefined) {
      throw new Error(
        `Signal type "${signalType}" does not have a corresponding score in signalScores.`,
      );
    }

    const entries = index[indexMethod]({ pattern: regex });

    for (const entry of entries) {
      countAreaRuleSignal({
        areasByOwner: areaCandidateMap,
        signal: signalType,
        score,
        entry,
      });
    }
  }

  if (competingProofSchemas) {
    for (const { indexMethod, regex } of competingProofSchemas) {
      const entries = index[indexMethod]({ pattern: regex });
      competingProofEntries.push(...entries);
    }
  }

  const hasFrameworkShape = (signals: Set<Signal>): boolean => {
    if (!gateBlocker) {
      return true;
    }

    const { countedSignals } = gateBlocker.where;
    if (!countedSignals) return true;

    const result = evaluateCondition({
      signals: signals,
      conditions: countedSignals,
    });

    return result;
  };

  const hasCompetingProof = (ownerPath: string): boolean => {
    if (competingProofEntries) {
      return hasCompetingAreaProof({
        evidenceEntries: competingProofEntries,
        ownerPath,
      });
    }
    return false;
  };

  for (const [ownerPath, ownerCandidate] of areaCandidateMap) {
    if (hasCompetingProof(ownerPath)) {
      continue;
    }

    if (!hasFrameworkShape(ownerCandidate.countedSignals)) {
      continue;
    }

    addAreaScore({
      candidates,
      name: detectedArea,
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: primaryTech,
      relatedTechnologies: relatedTechs ?? [],
    });
  }
}
