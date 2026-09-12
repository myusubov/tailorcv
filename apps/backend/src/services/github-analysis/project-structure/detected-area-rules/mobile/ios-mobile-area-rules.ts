import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only native iOS signal contract for owner-scoped scoring.
 *
 * Placeholder -- no signals defined yet.
 */
const IOS_MOBILE_SIGNAL_SCORES = {} as const;

type IosMobileSignal = keyof typeof IOS_MOBILE_SIGNAL_SCORES;

/**
 * Adds a `Mobile app` candidate for native iOS evidence.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: none yet -- scaffold only, no entry schemas or gate defined.
 *
 * Limitations: placeholder pending signal rules.
 */
export function addIosMobileAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<IosMobileSignal>({
    candidates,
    index,
    detectedArea: 'Mobile app',
    primaryTech: 'iOS',
    relatedTechs: ['Swift'],
    signalScores: IOS_MOBILE_SIGNAL_SCORES,
    entrySchemas: [],
  });
}
