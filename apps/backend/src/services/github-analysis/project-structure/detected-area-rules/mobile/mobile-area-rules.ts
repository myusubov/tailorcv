import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addAndroidMobileAreas } from './android-mobile-area-rules';
import { addExpoMobileAreas } from './expo-mobile-area-rules';
import { addFlutterMobileAreas } from './flutter-mobile-area-rules';
import { addIosMobileAreas } from './ios-mobile-area-rules';
import { addReactNativeMobileAreas } from './react-native-mobile-area-rules';

/**
 * Applies mobile-specific detected-area rules to the shared candidate map.
 *
 * Provider-specific rules live in sibling modules and emit `Mobile app`
 * candidates. Dispatch order below is provider precedence: the meta-framework
 * (Expo, built on React Native) runs before its parent framework (React
 * Native), followed by the remaining independent platforms. When two
 * providers both claim the same owner, the first dispatched keeps the
 * `primary` technology label and later ones are carried in `related`.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: fans out to the provider detectors. Expo, React Native, and
 * Flutter currently insert or update `Mobile app` candidates; Android and iOS
 * remain scaffolds with no entry schemas defined yet -- once they have their
 * own signal research, the agreed direction is for each to carry a
 * `competingProofSchemas` veto against Flutter's and React Native's anchor
 * signals, the same shape React Native already uses against Expo, so a
 * Flutter or React Native repo's bundled native host directories don't also
 * double-fire as a native Android/iOS app. React Native's own
 * `competingProofSchemas` vetoes an owner carrying Expo Router or typed-env
 * evidence regardless of dispatch order, so Expo running first is a
 * performance/precedence convenience here, not what prevents a
 * double-primary claim. Flutter shares no file-level signals with Expo or
 * React Native, so it carries no veto in either direction.
 */
export function addMobileAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addExpoMobileAreas({ candidates, index });
  addReactNativeMobileAreas({ candidates, index });
  addFlutterMobileAreas({ candidates, index });
  addAndroidMobileAreas({ candidates, index });
  addIosMobileAreas({ candidates, index });
}
