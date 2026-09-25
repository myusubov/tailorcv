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
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}` map,
 * mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: fans out to the provider detectors. All five providers insert
 * or update `Mobile app` candidates keyed per primary technology, so
 * detectors that claim the same owner leave separate candidates instead of
 * merging; dispatch order does not decide which survives, `reconcileCandidates`
 * does (Expo over React Native; Flutter, React Native, or Expo over native
 * Android/iOS). There is no cross-detector competing-proof veto and no path
 * exclusion: Android and iOS resolve a bundled native shell's owner to its
 * host's root through `resolveNearestMarkerOwner` -- see their module
 * docstrings for the marker limits.
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
