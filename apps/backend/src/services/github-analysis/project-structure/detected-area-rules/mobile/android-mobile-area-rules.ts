import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only native Android signal contract for owner-scoped scoring.
 *
 * Placeholder -- no signals defined yet.
 */
const ANDROID_MOBILE_SIGNAL_SCORES = {} as const;

type AndroidMobileSignal = keyof typeof ANDROID_MOBILE_SIGNAL_SCORES;

/**
 * Adds a `Mobile app` candidate for native Android evidence.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: none yet -- scaffold only, no entry schemas or gate defined.
 *
 * Limitations: placeholder pending signal rules.
 */
export function addAndroidMobileAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<AndroidMobileSignal>({
    candidates,
    index,
    detectedArea: 'Mobile app',
    primaryTech: 'Android',
    relatedTechs: ['Kotlin', 'Java'],
    signalScores: ANDROID_MOBILE_SIGNAL_SCORES,
    entrySchemas: [],
  });
}
