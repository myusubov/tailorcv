import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveNearestMarkerOwner } from '../owner-adapters';

/**
 * Cross-platform host markers checked while walking up from a native iOS
 * anchor -- Flutter's `.metadata`/`pubspec.yaml`, React Native's
 * `react-native.config.js`, Expo's `app.config.(ts|js)`, Metro's
 * `metro.config.(js|cjs|mjs|ts)` (shared by RN and Expo, present even when
 * `react-native.config.js` is absent), Capacitor/Ionic's
 * `capacitor.config.(ts|js|json)`/`ionic.config.json`. Cordova's `config.xml`
 * is deliberately omitted: too generic a filename to trust as a host marker.
 * A direct hit at an ancestor redirects the owner there instead of the
 * bundled `ios/` shell, at any nesting depth -- see
 * `resolveNearestMarkerOwner`.
 */
const IOS_HOST_MARKERS = [
  /^pubspec\.yaml$/,
  /^\.metadata$/,
  /^react-native\.config\.js$/,
  /^app\.config\.(ts|js)$/,
  /^metro\.config\.(js|cjs|mjs|ts)$/,
  /^capacitor\.config\.(ts|js|json)$/,
  /^ionic\.config\.json$/,
];

/**
 * Path-only native iOS signal contract for owner-scoped scoring, grounded in
 * a GitHub-tree survey of nine real repositories (signalapp/Signal-iOS,
 * duckduckgo/iOS, kean/Nuke, wordpress-mobile/WordPress-iOS,
 * prof18/shared-hn-android-ios-backend, stripe/stripe-ios,
 * mozilla-mobile/firefox-ios, plus mhartington/capacitor-test and
 * bitrise-io/sample-apps-flutter-ios-android as bundled-host negative
 * controls):
 * - `ios-xcodeproj` (`*.xcodeproj/`, matched as the bundle directory itself,
 *   not a file inside it): the only reliable proof a real, buildable Xcode
 *   target exists at this location. Matching a file one level inside the
 *   bundle (e.g. `project.pbxproj`) and taking a plain one-segment dirname
 *   would resolve the owner to the bundle path itself, not the directory
 *   that contains it. Excludes any `.xcodeproj` under a
 *   `pods/` segment -- CocoaPods generates its own dependency-umbrella
 *   project (confirmed: `hn-ios-client/HN Client/Pods/Pods.xcodeproj`), and
 *   without the exclusion every CocoaPods-using repo produces a second,
 *   spurious owner. There is no `ios/`-wrap exclusion: an `.xcodeproj` inside
 *   a cross-platform project's bundled `ios/` host -- confirmed on
 *   `gitpoint/git-point` (`ios/GitPoint.xcodeproj`),
 *   bitrise-io/sample-apps-flutter-ios-android (`ios/Runner.xcodeproj`), and
 *   mhartington/capacitor-test (`ios/App/App.xcodeproj`) -- still anchors, but
 *   `resolveNearestMarkerOwner` walks up from it to the nearest ancestor that
 *   directly holds a host marker (`IOS_HOST_MARKERS`), so the owner is the
 *   host's root (`.` for a root-level app) instead of a directory nested
 *   inside `ios/`. The native candidate then shares its owner with the host's
 *   own candidate; dropping it for a host that has a detector (Flutter, React
 *   Native, Expo) is `reconcileCandidates`'s job. A genuinely native
 *   repository that keeps its projects under `ios/` with no host marker in any
 *   ancestor (FirebaseExtended/analytics-webview: `ios/objc/` and `ios/swift/`
 *   `.xcodeproj`s) resolves to each bundle's own parent directory and stays a
 *   native candidate.
 * - `ios-xcworkspace` (`*.xcworkspace/`, same bundle-directory matching):
 *   confirms a CocoaPods or manually-composed multi-project setup.
 *   Reinforcing, not required for the gate -- `duckduckgo/iOS` is SPM-only
 *   with zero top-level workspace and is still unambiguously a real app.
 *   Excludes the workspace Xcode auto-nests inside every `.xcodeproj`
 *   (`SomeApp.xcodeproj/project.xcworkspace`, confirmed present in every
 *   sampled repo with or without CocoaPods) -- that one is Xcode's own
 *   internal state, not a sibling project descriptor. Same `pods/` exclusion
 *   and the same marker-walk owner resolution as `ios-xcodeproj`.
 * - `ios-appdelegate` (`*AppDelegate.swift`, `*AppDelegate.m` + `.h`): matched
 *   as a filename suffix, not an exact name -- confirmed on WordPress-iOS,
 *   whose real app-lifecycle file is `WordPressAppDelegate.swift`, not
 *   `AppDelegate.swift`. Confirms an actual lifecycle entry point exists, not
 *   just a project file; by itself it also matches an RN `ios/` host
 *   (confirmed: `gitpoint/git-point`'s `ios/GitPoint/AppDelegate.h`+`.m`), so
 *   it must combine with `ios-xcodeproj` in the gate.
 * - `ios-scenedelegate` (`*SceneDelegate.swift`): reinforces AppDelegate for
 *   modern (iOS 13+) apps -- not universal, older apps and extensions lack
 *   it.
 * - `ios-podfile` (`Podfile`, excluding a `tests/`, `fixtures/`, or
 *   `installation_tests/` segment): CocoaPods is also used by RN, Flutter,
 *   and Capacitor, so this is circumstantial only. The exclusion matters --
 *   confirmed on stripe/stripe-ios, whose `Tests/installation_tests/
 *   cocoapods/with_frameworks_objc/Podfile` is a test fixture, not evidence
 *   of the SDK itself being an app.
 * - `ios-assets-catalog` (`*.xcassets/`): very common but also present in
 *   every competing framework's bundled `ios/` host.
 * - `ios-shared-scheme` (`xcshareddata/xcschemes/*.xcscheme`): shows a
 *   maintained, CI-shared project -- only meaningful alongside an anchored
 *   `.xcodeproj`.
 * - `ios-entitlements` (`*.entitlements`): common in both main apps and
 *   extensions -- same depth-ambiguity problem as Info.plist below.
 * - `ios-info-plist` (`Info.plist`): cannot distinguish an app from an
 *   extension or framework by path alone -- confirmed on `duckduckgo/iOS`,
 *   which has 5+ `Info.plist` files (`Widgets/`, `ShareExtension/`,
 *   `PacketTunnelProvider/`, `AutofillCredentialProvider/`) alongside its one
 *   real app. `countAreaRuleSignal` already counts a signal once per owner
 *   regardless of match count, so the many extension Info.plists cost
 *   nothing extra; kept at the lowest non-zero weight rather than excluded
 *   outright since it is still real, if weak, evidence.
 *
 * `Package.swift` (Swift Package Manager) was researched and deliberately
 * left out entirely, not merely scored `0`: SPM cannot produce a signable,
 * App-Store-shippable `.app` bundle (no code-signing product type for an iOS
 * app), confirmed on two real SPM-root repositories whose actual demo apps
 * are built by a separate `.xcodeproj` sharing the same root
 * (`kean/Nuke` -> `Nuke.xcodeproj` + `Demo/App/NukeDemoApp.swift`;
 * `firebase/firebase-ios-sdk` -> `Example/CombineSample/
 * CombineSample.xcworkspace`). Unlike React Native's
 * `expo-modules-coexistence`, there is no related technology worth surfacing
 * from its presence, so it carries no signal at all here rather than a
 * zero-scored placeholder.
 */
const IOS_MOBILE_SIGNAL_SCORES = {
  'ios-xcodeproj': 3,
  'ios-xcworkspace': 2,
  'ios-appdelegate': 2,
  'ios-scenedelegate': 1,
  'ios-podfile': 1,
  'ios-assets-catalog': 1,
  'ios-shared-scheme': 1,
  'ios-entitlements': 1,
  'ios-info-plist': 1,
} as const;

type IosMobileSignal = keyof typeof IOS_MOBILE_SIGNAL_SCORES;

/**
 * Adds a `Mobile app` candidate for native iOS evidence.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Mobile app` candidate with primary
 * technology `iOS` (related: `Swift`) for every owner whose counted signals
 * clear the gate.
 *
 * Owner: `resolveNearestMarkerOwner` with `IOS_HOST_MARKERS`, anchored on both
 * `ios-xcodeproj` and `ios-xcworkspace`. It walks up from each bundle to the
 * nearest ancestor that directly holds a host marker, so a bundled `ios/`
 * shell resolves to its host's root; with no marker it resolves to the
 * bundle's own parent directory. No `extraRootDirectories` -- every confirmed
 * example-app shape here (`Example/PaymentSheet Example/`, ...) already
 * carries its own `.xcodeproj`. Where a shallower workspace and a deeper
 * xcodeproj both exist for the same product (confirmed on
 * `wordpress-mobile/WordPress-iOS`: `WordPress.xcworkspace` at repo root,
 * `WordPress/WordPress.xcodeproj` one level inside), the shallower one is
 * not given precedence in code -- it does not need to be. Non-anchor signals
 * take the longest enclosing anchor owner, so the more specific `WordPress`
 * anchor wins for every path inside it and `.` (which encloses every path)
 * only takes the rest. Single-target native iOS apps (Signal, DuckDuckGo,
 * Nuke) resolve to `.`.
 *
 * Gate: `ios-xcodeproj` AND (`ios-appdelegate` OR `ios-scenedelegate`).
 * `ios-xcworkspace` is deliberately not a gate requirement -- SPM-only apps
 * like `duckduckgo/iOS` have none. A bare `ios-xcodeproj` gate was rejected:
 * confirmed on `duckduckgo/iOS`'s own tree, a framework or extension target
 * (`Widgets/`, `PacketTunnelProvider/`) can have a nearby `Info.plist` with
 * no lifecycle code of its own, hosted by a parent app's AppDelegate rather
 * than carrying its own. `Package.swift` and `Info.plist` never enter the
 * gate at all, for the reasons documented above.
 *
 * Competing frameworks: there is no competing-proof veto and no path
 * exclusion. A Flutter, React Native, Expo, Capacitor, or Cordova/Ionic
 * project's bundled native iOS host still yields a native iOS candidate, on
 * the same owner as the host's own candidate when a host marker sits directly
 * in an ancestor of the bundle. Cordova has no marker (its `config.xml` was
 * deliberately left out), so its `platforms/ios` host surfaces as a
 * standalone native candidate. Removing the candidate for a host that has a
 * detector (Flutter, React Native, Expo) is `reconcileCandidates`'s job. This
 * is the same approach native Android's detector takes (Kotlin Multiplatform
 * is deliberately not excluded there; see the Android detector's note).
 * NativeScript's `App_Resources/iOS/` and Unity's pre-export markers
 * were deliberately left out: documented conventions only, not matched
 * against a live public repository in this research pass.
 *
 * Limitations:
 * - Path-only, so a macOS-only or tvOS-only Xcode project (identical
 *   `.xcodeproj` + `AppDelegate.swift` shape) cannot be distinguished from
 *   iOS -- real OS targeting lives inside `project.pbxproj` content, out of
 *   reach for a path-only analyzer. This detector claims `Mobile app`
 *   generically rather than asserting iOS specifically is confirmed, the
 *   same scoping the other mobile detectors already use.
 * - Host detection relies on a marker file sitting directly in an ancestor
 *   directory of the bundle (see `IOS_HOST_MARKERS`); a host with none of
 *   those files (Cordova, NativeScript, ...) is not recognized. The marker
 *   patterns match against the full path, so they only find a marker at the
 *   repository root (see `resolveNearestMarkerOwner`).
 * - Research sample (9 real repos + 2 bundled-host controls) is smaller than
 *   Expo's or React Native's own passes -- a first research pass, not a
 *   finished grounding.
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
    entrySchemas: [
      {
        signalType: 'ios-xcodeproj',
        regex: /^(?!.*(?:^|\/)pods\/[^/]+\.xcodeproj$).*\.xcodeproj$/,
        indexMethod: 'findDirectoriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'ios-xcworkspace',
        regex:
          /^(?!.*\.xcodeproj\/)(?!.*(?:^|\/)pods\/[^/]+\.xcworkspace$).*\.xcworkspace$/,
        indexMethod: 'findDirectoriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'ios-appdelegate',
        regex: /appdelegate\.swift$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'ios-appdelegate',
        regex: /appdelegate\.m$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'ios-appdelegate',
        regex: /appdelegate\.h$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'ios-scenedelegate',
        regex: /scenedelegate\.swift$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'ios-podfile',
        regex:
          /^(?!.*\/(?:tests|fixtures|installation_tests)\/).*(^|\/)podfile$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ios-assets-catalog',
        regex: /(^|\/)[^/]+\.xcassets$/,
        indexMethod: 'findDirectoriesByPathMatching',
      },
      {
        signalType: 'ios-shared-scheme',
        regex: /(^|\/)xcshareddata\/xcschemes\/[^/]+\.xcscheme$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ios-entitlements',
        regex: /\.entitlements$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'ios-info-plist',
        regex: /^info\.plist$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          and: [
            { has: 'ios-xcodeproj' },
            { hasOneOf: ['ios-appdelegate', 'ios-scenedelegate'] },
          ],
        },
      },
    },
    ownerAdapter: (args) =>
      resolveNearestMarkerOwner({ ...args, markers: IOS_HOST_MARKERS }),
  });
}
