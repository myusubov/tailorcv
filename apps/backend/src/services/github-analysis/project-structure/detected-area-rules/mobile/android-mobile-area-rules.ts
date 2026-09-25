import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveNearestMarkerOwner } from '../owner-adapters';

/**
 * Cross-platform host markers checked while walking up from a native
 * Android anchor -- Flutter's `.metadata`/`pubspec.yaml`, React Native's
 * `react-native.config.js`, Expo's `app.config.(ts|js)`, Metro's
 * `metro.config.(js|cjs|mjs|ts)` (shared by RN and Expo, present even when
 * `react-native.config.js` is absent), Capacitor/Ionic's
 * `capacitor.config.(ts|js|json)`/`ionic.config.json`. Cordova's `config.xml`
 * is deliberately omitted: too generic a filename to trust as a host marker.
 * A direct hit at an ancestor redirects the owner there instead of the
 * bundled `android/` shell, at any nesting depth -- see
 * `resolveNearestMarkerOwner`.
 */
const ANDROID_HOST_MARKERS = [
  /^pubspec\.yaml$/,
  /^\.metadata$/,
  /^react-native\.config\.js$/,
  /^app\.config\.(ts|js)$/,
  /^metro\.config\.(js|cjs|mjs|ts)$/,
  /^capacitor\.config\.(ts|js|json)$/,
  /^ionic\.config\.json$/,
];

/**
 * Path-only native Android signal contract for owner-scoped scoring,
 * grounded in a GitHub-tree survey of eight real repositories (google/grafika,
 * googlearchive/android-topeka, android/nowinandroid,
 * mozilla-mobile/firefox-android, firebase/quickstart-android,
 * stripe/stripe-android, plus Expensify/App and flutter/flutter as bundled-host
 * negative controls):
 * - `android-manifest` (`**\/src/main/AndroidManifest.xml`): the strongest
 *   single clue, but it sits two segments below its own module root, so it
 *   cannot anchor cleanly on its own -- see the gate below. Cannot
 *   distinguish an application module from a library module by path alone
 *   (both require a manifest for manifest merging); confirmed on
 *   nowinandroid's `core/analytics`, a library, not an app -- see Limitations.
 * - `android-gradle-module-root` (`**\/build.gradle(.kts)`): the anchor.
 *   Deliberately NOT `settings.gradle` -- stripe-android and
 *   firebase/quickstart-android both declare several independently-meaningful
 *   app modules under one shared root `settings.gradle`
 *   (`example/`, `paymentsheet-example/`, `auth/`, `database/`, ...), so a
 *   settings-file-only anchor would collapse every one of them into a single
 *   repo-root owner. Anchoring on each module's own `build.gradle` instead
 *   lets every real Gradle module resolve to its own directory, at the cost
 *   of the simplest single-app repos (grafika, android-topeka) resolving to
 *   the `app` module directory rather than repo root once both anchors
 *   coexist -- a different convention, not a defect.
 *   No path exclusion: a cross-platform project's bundled
 *   `android/build.gradle`/`android/app/build.gradle` -- confirmed on
 *   Expensify/App and flutter/flutter's
 *   `examples/hello_world/android/app/build.gradle.kts` -- still anchors, but
 *   `resolveNearestMarkerOwner` walks up from it to the nearest ancestor that
 *   directly holds a host marker (`ANDROID_HOST_MARKERS`), so the owner is the
 *   host's root (`.` for a root-level app) instead of a directory named
 *   `android`/`android/app`. The native candidate then shares its owner with
 *   the host's own candidate; dropping it for a host that has a detector
 *   (Flutter, React Native, Expo) is `reconcileCandidates`'s job. A genuinely
 *   native repository that keeps its project under `android/` with no host
 *   marker in any ancestor (FirebaseExtended/analytics-webview:
 *   `android/build.gradle`, `android/app/build.gradle`) resolves to each
 *   `build.gradle`'s own directory and stays a native candidate. Roughly
 *   thirty more repositories with root-level `android/` and `ios/` folders and
 *   no cross-platform marker at the root turned up in a 300-repository scan
 *   and were not individually checked.
 * - `android-gradle-settings` (`**\/settings.gradle(.kts)`): confirms a real
 *   Gradle project root exists nearby. Weak alone -- every Gradle project has
 *   one, Android or not -- and, per the anchor design above, often sits
 *   outside the very module it's meant to corroborate (stripe-android's
 *   per-example modules have no `settings.gradle` of their own), so it is
 *   deliberately NOT a gate participant, only a supportive score.
 * - `android-gradle-wrapper` (`gradlew`, `gradlew.bat`,
 *   `gradle-wrapper.properties`): generic Gradle plumbing, present in any
 *   Gradle project, Android or plain JVM.
 * - `android-resource-density` (`res/mipmap-*dpi/`): genuinely
 *   Android-specific resource-compilation convention, but also present
 *   inside a Flutter/RN bundled host, so it resolves through the same
 *   owner-redirect reasoning above rather than being exempted from it.
 * - `android-proguard` (`proguard-rules.pro`, `consumer-proguard-rules.pro`):
 *   common but not universal -- small apps frequently ship with zero custom
 *   rules.
 * - `android-firebase-config` (`google-services.json`,
 *   `mock-google-services.json`): real commit behavior is mixed -- confirmed
 *   committed on nowinandroid (a public demo project with restricted keys),
 *   but most private/production repos gitignore this entirely.
 * - `android-gradle-properties` (`gradle.properties`): the weakest, most
 *   generic signal in the set.
 *
 * `settings.gradle`-only anchoring, a bare `AndroidManifest.xml` gate, and a
 * bare `build.gradle` gate were all considered and rejected -- see the
 * `android-gradle-module-root` and gate notes above and below; each produces
 * confirmed false positives or false negatives against the sampled repos.
 */
const ANDROID_MOBILE_SIGNAL_SCORES = {
  'android-manifest': 3,
  'android-gradle-module-root': 2,
  'android-gradle-settings': 1,
  'android-gradle-wrapper': 1,
  'android-resource-density': 1,
  'android-proguard': 1,
  'android-firebase-config': 1,
  'android-gradle-properties': 1,
} as const;

type AndroidMobileSignal = keyof typeof ANDROID_MOBILE_SIGNAL_SCORES;

/**
 * Adds a `Mobile app` candidate for native Android evidence.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Mobile app` candidate with primary
 * technology `Android` (related: `Kotlin`, `Java`) for every owner whose
 * counted signals clear the gate.
 *
 * Owner: `resolveNearestMarkerOwner` with `ANDROID_HOST_MARKERS`, anchored on
 * `android-gradle-module-root`. It walks up from each `build.gradle` to the
 * nearest ancestor that directly holds a host marker, so a bundled `android/`
 * shell resolves to its host's root; with no marker it resolves to the
 * `build.gradle`'s own directory. No `extraRootDirectories` -- unlike Flutter
 * and React Native, every confirmed example-app shape here
 * (`example/`, `paymentsheet-example/`, `auth/`, ...) already carries its own
 * `build.gradle` anchor. `android-manifest` and the other non-anchor signals
 * take the longest enclosing anchor owner (`.` encloses every path).
 *
 * Gate: `android-manifest` AND `android-gradle-module-root`, both required,
 * no OR branches. Every sampled real repository carries this pairing
 * together in the same module directory; no case of one surviving without
 * the other was found, unlike Flutter's gitignored-manifest branch. A bare
 * manifest or a bare `build.gradle` was rejected as the sole gate
 * requirement -- both appear identically inside React Native, Flutter,
 * Cordova, and Unity's Android exports (see Limitations), so neither is
 * evidence on its own.
 *
 * Competing frameworks: there is no competing-proof veto and no path
 * exclusion. A Flutter, React Native, Expo, Capacitor, or Cordova/Ionic
 * project's bundled native host still yields a native Android candidate, on
 * the same owner as the host's own candidate when a host marker sits directly
 * in an ancestor of the anchor. Cordova has no marker (its `config.xml` was
 * deliberately left out), so its `platforms/android` host surfaces as a
 * standalone native candidate. Removing the candidate for a host that has a
 * detector (Flutter, React Native, Expo) is `reconcileCandidates`'s job.
 * Kotlin Multiplatform is deliberately not excluded: its `app/` module
 * (confirmed on touchlab/KaMPKit) is a real native Android app rather than a
 * generated host shell, and no KMM detector exists to yield to.
 * NativeScript's `App_Resources/Android/`, .NET MAUI's modern
 * `Platforms/Android/`, and Unity's export shape were deliberately left out:
 * documented conventions only, not matched against a live public repository
 * in this research pass.
 *
 * Limitations:
 * - Path-only, so an `AndroidManifest.xml`'s `<application>` block cannot be
 *   read to confirm a real app module vs. a library module needing the
 *   manifest only for merging (confirmed on nowinandroid's `core/analytics`).
 *   This detector resolves an owner directory for a library module exactly
 *   as it would for an app; whether it should ever clear the gate is a
 *   scoring question this contract does not close.
 * - Host detection relies on a marker file sitting directly in an ancestor
 *   directory of the anchor (see `ANDROID_HOST_MARKERS`); a host with none of
 *   those files (Cordova, NativeScript, ...) is not recognized. The marker
 *   patterns match against the full path, so they only find a marker at the
 *   repository root (see `resolveNearestMarkerOwner`).
 * - Research sample (8 real repos + 2 bundled-host controls) is smaller than
 *   Expo's or React Native's own passes -- a first research pass, not a
 *   finished grounding.
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
    entrySchemas: [
      {
        signalType: 'android-gradle-module-root',
        regex: /(^|\/)build\.gradle(\.kts)?$/,
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'android-manifest',
        regex: /^androidmanifest\.xml$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'android-gradle-settings',
        regex: /^settings\.gradle(\.kts)?$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'android-gradle-wrapper',
        regex: /^gradlew(\.bat)?$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'android-gradle-wrapper',
        regex: /^gradle-wrapper\.properties$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'android-resource-density',
        regex: /(^|\/)res\/mipmap-[a-z0-9]+dpi$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'android-proguard',
        regex: /^proguard-rules\.pro$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'android-proguard',
        regex: /^consumer-proguard-rules\.pro$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'android-firebase-config',
        regex: /^(mock-)?google-services\.json$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'android-gradle-properties',
        regex: /^gradle\.properties$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          hasAllOf: ['android-manifest', 'android-gradle-module-root'],
        },
      },
    },
    ownerAdapter: (args) =>
      resolveNearestMarkerOwner({ ...args, markers: ANDROID_HOST_MARKERS }),
  });
}
