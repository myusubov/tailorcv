import {
  DetectedAreaTechnology,
  RepoTreeEntry,
} from '../project-structure-analyzer.types';
import {
  addAreaScore,
  hasAreaCandidate,
} from '../project-structure-detected-area-candidates';
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
  isAnchorSignal?: boolean;
}

interface ConditionShape<Signal extends string> {
  hasAllOf?: Signal[];
  hasOneOf?: Signal[];
  has?: Signal;
  or?: ConditionShape<Signal>[];
  and?: ConditionShape<Signal>[];
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

interface OwnerAdapterArgs {
  path: string;
  isAnchorSignal: boolean;
  anchorOwners: ReadonlySet<string>;
}

interface ApplyDeclarativeAreaDetectorParams<
  Signal extends string,
> extends DetectedAreaRuleContext {
  signalScores: Record<Signal, number>;
  entrySchemas: EntrySchema<Signal>[];
  detectedArea: DetectedAreaName;
  primaryTech: DetectedAreaTechnology;
  relatedTechs?: DetectedAreaTechnology[];
  dynamicRelatedTechMap?: Partial<Record<Signal, DetectedAreaTechnology>>;
  gateBlocker?: GateBlocker<Signal>;
  competingProofSchemas?: CompetingProofSchema[];
  checkForExistingCandidate?: boolean;
  ownerAdapter?: (args: OwnerAdapterArgs) => string;
}

/**
 * Evaluates one `ConditionShape` against a counted-signal set.
 *
 * Every key present on the node is ANDed together: `hasAllOf` requires all
 * listed signals, `hasOneOf` requires at least one, `has` requires that single
 * signal, `and` requires every nested condition to hold, and `or` requires at
 * least one nested condition to hold. Absent keys contribute `true`, so an
 * empty node matches. `and` and `or` recurse, allowing arbitrarily nested
 * AND/OR shape checks (such as ANDing two independent `hasOneOf` groups).
 */
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

  const { hasAllOf, hasOneOf, has, or, and } = conditions;
  return (
    (hasAllOf ? funcObj.hasAllOf(hasAllOf) : true) &&
    (hasOneOf ? funcObj.hasOneOf(hasOneOf) : true) &&
    (has ? funcObj.has(has) : true) &&
    (and
      ? and.every((nestedCondition) =>
          evaluateCondition({ signals, conditions: nestedCondition }),
        )
      : true) &&
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
 * for every owner that passes the optional `gateBlocker` shape check, has no
 * competing-framework proof at its path, and (when `checkForExistingCandidate`
 * is set) has no prior `detectedArea` claim for that owner.
 * `gateBlocker.where.countedSignals` is evaluated per owner via
 * `evaluateCondition`, supporting arbitrarily nested AND/OR shape checks
 * (such as Next.js's or Vue's app-shape requirements); omitting it allows any
 * owner with at least one matched signal through. `competingProofSchemas`,
 * when given, is matched against the repository index once up front and
 * vetoes an owner whose path also carries that evidence (see
 * `hasCompetingAreaProof`), independent of the owner's own gate result.
 * `dynamicRelatedTechMap`, when given, unions in a related technology for
 * every signal counted for that owner (e.g. attributing `Java`/`Kotlin`
 * per owner from language-specific signal variants) in addition to any
 * static `relatedTechs`.
 * `checkForExistingCandidate`, when `true`, vetoes an owner that already has
 * a `(detectedArea, ownerPath)` claim in the shared `candidates` map before
 * any file-evidence gate runs. This is the shared-map fallback guard used by
 * the last-resort detectors (Static frontend, Express) so weak generic path
 * shapes never accumulate score, evidence, or related technologies onto a
 * stronger detector's existing claim for the same owner. It is checked
 * independently of `competingProofSchemas`, which vetoes from raw repository
 * file evidence rather than emitted-candidate state.
 * When an `ownerAdapter` is given, signals are matched anchor-schemas-first:
 * each anchor signal's resolved owner is collected into `anchorOwners`, so that
 * set is complete before any non-anchor signal resolves against it (see
 * `resolveUnitRootOwner`).
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
  dynamicRelatedTechMap,
  checkForExistingCandidate,
  ownerAdapter,
}: ApplyDeclarativeAreaDetectorParams<Signal>): void {
  const areaCandidateMap = createAreaRuleCandidateMap<Signal>();
  const anchorOwners = new Set<string>();

  const competingProofEntries: RepoTreeEntry[] = [];

  // Anchor schemas first so `anchorOwners` is fully populated before any
  // non-anchor signal is resolved against it (see `resolveUnitRootOwner`).
  const orderedSchemas = [
    ...entrySchemas.filter((entrySchema) => entrySchema.isAnchorSignal),
    ...entrySchemas.filter((entrySchema) => !entrySchema.isAnchorSignal),
  ];

  for (const entrySchema of orderedSchemas) {
    const { indexMethod, regex, signalType, isAnchorSignal } = entrySchema;
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
        resolveOwnerPath: ownerAdapter
          ? (path) => {
              const owner = ownerAdapter({
                path,
                isAnchorSignal: isAnchorSignal ?? false,
                anchorOwners,
              });
              if (isAnchorSignal) {
                anchorOwners.add(owner);
              }
              return owner;
            }
          : undefined,
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
    if (
      checkForExistingCandidate &&
      hasAreaCandidate({ candidates, name: detectedArea, path: ownerPath })
    ) {
      continue;
    }

    if (hasCompetingProof(ownerPath)) {
      continue;
    }

    if (!hasFrameworkShape(ownerCandidate.countedSignals)) {
      continue;
    }

    const dynamicRelatedTechs: DetectedAreaTechnology[] = [];

    if (dynamicRelatedTechMap) {
      for (const signal of Object.keys(dynamicRelatedTechMap) as Signal[]) {
        const tech = dynamicRelatedTechMap[signal];
        if (tech && ownerCandidate.countedSignals.has(signal)) {
          dynamicRelatedTechs.push(tech);
        }
      }
    }

    addAreaScore({
      candidates,
      name: detectedArea,
      path: ownerPath,
      score: ownerCandidate.score,
      evidence: ownerCandidate.evidence,
      primaryTechnology: primaryTech,
      relatedTechnologies: [...(relatedTechs ?? []), ...dynamicRelatedTechs],
    });
  }
}
