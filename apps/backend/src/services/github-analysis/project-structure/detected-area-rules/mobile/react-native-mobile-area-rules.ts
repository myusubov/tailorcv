import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';

/**
 * Path-only React Native signal contract for owner-scoped scoring.
 *
 * Placeholder -- no signals defined yet.
 */
const REACT_NATIVE_MOBILE_SIGNAL_SCORES = {} as const;

type ReactNativeMobileSignal = keyof typeof REACT_NATIVE_MOBILE_SIGNAL_SCORES;

/**
 * Adds a `Mobile app` candidate for React Native evidence.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: none yet -- scaffold only, no entry schemas or gate defined.
 *
 * Limitations: placeholder pending signal rules.
 */
export function addReactNativeMobileAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<ReactNativeMobileSignal>({
    candidates,
    index,
    detectedArea: 'Mobile app',
    primaryTech: 'React Native',
    relatedTechs: ['Node.js'],
    signalScores: REACT_NATIVE_MOBILE_SIGNAL_SCORES,
    entrySchemas: [],
  });
}
