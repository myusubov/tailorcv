import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only Flutter signal contract for owner-scoped scoring.
 *
 * Placeholder -- no signals defined yet.
 */
const FLUTTER_MOBILE_SIGNAL_SCORES = {} as const;

type FlutterMobileSignal = keyof typeof FLUTTER_MOBILE_SIGNAL_SCORES;

/**
 * Adds a `Mobile app` candidate for Flutter evidence.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: none yet -- scaffold only, no entry schemas or gate defined.
 *
 * Limitations: placeholder pending signal rules.
 */
export function addFlutterMobileAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<FlutterMobileSignal>({
    candidates,
    index,
    detectedArea: 'Mobile app',
    primaryTech: 'Flutter',
    relatedTechs: ['Dart'],
    signalScores: FLUTTER_MOBILE_SIGNAL_SCORES,
    entrySchemas: [],
  });
}
