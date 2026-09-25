import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

/**
 * Path-only React Native (bare CLI, no meta-framework) signal contract for
 * owner-scoped scoring, grounded in the official `react-native-community/
 * template` scaffold plus six real production repositories (Mattermost,
 * Expensify, Zulip, Rainbow, Gutenberg Mobile, Ledger Live) and a ~13k-hit
 * GitHub code search:
 * - `react-native-cli-config` (`react-native.config.js`): the strongest
 *   available anchor -- present in every sampled real bare-RN app, absent
 *   from every cross-checked real Expo repo. Not RN-exclusive on its own,
 *   though: it also anchors RN *library* packages (react-native-webview,
 *   react-native-picker, and thousands more in the code-search sample) whose
 *   root is a package, not a deployable app, so it never clears the gate
 *   alone (see the gate below). It has also dropped out of the official
 *   template since the sampled apps were scaffolded, so a brand-new
 *   `react-native init` repo may not have one -- the same recall caveat
 *   Expo's own `expo-env.d.ts` carries for being commonly gitignored.
 * - `android-native-shell` (`android/{build.gradle,settings.gradle,gradlew}`)
 *   and `ios-native-shell` (`ios/Podfile`): a committed native platform
 *   project under a literally-named `android`/`ios` folder, confirmed at
 *   this exact shape in the official template. Shared risk: Flutter,
 *   Capacitor, Cordova, and Expo's *bare workflow* all produce the identical
 *   wrapper folder, so neither is ever trusted alone.
 * - `react-native-application-bootstrap`
 *   (`android/app/src/main/{java,kotlin}/**\/MainApplication.{java,kt}`):
 *   the Android class wiring up `ReactNativeHost`/`ReactApplication`,
 *   confirmed at `android/app/src/main/java/com/helloworld/MainApplication.kt`
 *   in the official template. Narrower than the shell signals -- Flutter's
 *   default template does not generate a `MainApplication` class -- but it
 *   does not differentiate from Expo bare workflow, which is the same React
 *   Native runtime.
 * - `metro-bundler-config` (`metro.config.js`): present on both sides of the
 *   RN/Expo split (it is already one of Expo's own supportive signals), so
 *   it confirms "this owner runs Metro" and nothing more specific.
 *
 * A root entry file (`index.js`/`index.tsx`) was considered and rejected:
 * every sample has one, but path-only matching cannot read its
 * `AppRegistry.registerComponent` call, and a root `index.js` is one of the
 * most generic filenames in the JS ecosystem. Two weak tiebreakers
 * (`.watchmanconfig`, `app.json`) were drafted and also rejected --
 * `AREA_CONFIDENCE_MAX_SCORE` is 6 and every gate branch below already scores
 * exactly 6 with only its required signals, so confidence is saturated
 * before either could move it, and `app.json` is ambiguous with Expo's own
 * static config besides.
 *
 * `expo-modules-coexistence` (`app.config.(ts|js)`, `eas.json`) is not a
 * gate participant at all -- it exists solely to feed `dynamicRelatedTechMap`
 * below. Deliberately excludes `app.json`: the official RN CLI template
 * ships one too, so it cannot indicate Expo-package adoption the way
 * `app.config.*`/`eas.json` can (neither appears in the official RN
 * template). Grounded in a direct case study: rainbow-me/rainbow is a real,
 * large, bare React Native wallet app -- not Expo-managed, no Expo Router --
 * whose root still carries `app.config.ts` because it individually installs
 * Expo SDK modules (`expo-image-picker`, `expo-web-browser`, etc.) via the
 * `install-expo-modules` pattern. That evidence is exactly why this signal
 * scores `0` and never appears in the gate: it is real, common, and not
 * proof of anything RN's own gate should refuse on -- but it is worth
 * surfacing as a related technology so the ambiguity isn't silently lost.
 */
const REACT_NATIVE_MOBILE_SIGNAL_SCORES = {
  'react-native-cli-config': 4,
  'android-native-shell': 3,
  'ios-native-shell': 3,
  'react-native-application-bootstrap': 3,
  'metro-bundler-config': 2,
  'expo-modules-coexistence': 0,
} as const;

type ReactNativeMobileSignal = keyof typeof REACT_NATIVE_MOBILE_SIGNAL_SCORES;

/**
 * Adds a `Mobile app` candidate for bare React Native (CLI, no meta-framework) evidence.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Mobile app` candidate with primary
 * technology `React Native` (related: `Node.js`, plus `Expo` when
 * `expo-modules-coexistence` evidence is also present) for every owner whose
 * counted signals clear the gate. An owner Expo also claims keeps its own
 * `React Native` candidate beside Expo's, since candidates are keyed per
 * primary technology; `reconcileCandidates` then drops the React Native one.
 *
 * Owner: `resolveUnitRootOwner`, anchored on `react-native-cli-config`, with
 * `extraRootDirectories: ['example']` so a library repo's demo app (e.g.
 * react-native-webview's `example/`, the same `create-expo-module`-style
 * convention Expo needed) resolves to `example` rather than the repository
 * root when no anchor nearby already claims it. When no
 * `react-native-cli-config` anchor is present at all (increasingly common
 * post-template-change repos), non-anchor signals fall back to the generic
 * `apps/*`/`packages/*` resolver, confirmed against LedgerHQ/ledger-live's
 * `apps/ledger-live-mobile` monorepo shape.
 *
 * Gate: no single signal here is a clean, exclusive anchor the way
 * `next.config.js` or `manage.py` are for their frameworks, so the gate
 * leans on combinations with two independent ways to clear it -- one for
 * repos with the config file, one for the (post-template-change) repos
 * without it:
 * - Branch A: `react-native-cli-config` plus at least one of
 *   `android-native-shell`, `ios-native-shell`,
 *   `react-native-application-bootstrap`, or `metro-bundler-config` (closes
 *   the library-package false positive -- a bare npm package root has the
 *   config file but no committed native shell).
 * - Branch B: `android-native-shell` and `ios-native-shell` together, no
 *   config file required.
 * - Branch C: `react-native-application-bootstrap` and `ios-native-shell`
 *   together, no config file required.
 *
 * No Expo veto: an owner carrying Expo Router (`app/_layout.*`) or typed-env
 * (`expo-env.d.ts`) evidence that also clears this gate keeps its own
 * `React Native` candidate beside Expo's (candidates are keyed per primary
 * technology); `reconcileCandidates` then drops the React Native one in
 * Expo's favor.
 *
 * Limitations:
 * - Path-only, so `package.json`'s `expo`/`react-native` dependencies cannot
 *   be read to disambiguate further.
 * - An Expo-shaped owner that only this detector clears (Expo's own gate
 *   fails there) surfaces as a plain `React Native` candidate with the Expo
 *   relationship lost.
 * - `android-native-shell`/`ios-native-shell` overlap with Flutter,
 *   Capacitor, and Cordova's identical `android/`/`ios/` wrapper folders;
 *   `react-native-application-bootstrap` narrows out Flutter specifically
 *   (no default `MainApplication` class) but Branch B alone does not
 *   require it. Not resolved by this detector.
 * - Research-stage scores and gate shape -- not yet cross-checked for
 *   overlap against the Flutter, Android, or iOS signal sets.
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
    entrySchemas: [
      {
        signalType: 'react-native-cli-config',
        regex: /^react-native\.config\.js$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'android-native-shell',
        regex: /(^|\/)android\/(build\.gradle|settings\.gradle|gradlew)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'ios-native-shell',
        regex: /(^|\/)ios\/Podfile$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'react-native-application-bootstrap',
        regex:
          /(^|\/)android\/app\/src\/main\/(java|kotlin)\/.*\/MainApplication\.(java|kt)$/,
        indexMethod: 'findEntriesByPathMatching',
      },
      {
        signalType: 'metro-bundler-config',
        regex: /^metro\.config\.js$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'expo-modules-coexistence',
        regex: /^app\.config\.(ts|js)$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'expo-modules-coexistence',
        regex: /^eas\.json$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            // Branch A: config file plus at least one native corroborator.
            {
              and: [
                { hasOneOf: ['react-native-cli-config'] },
                {
                  hasOneOf: [
                    'android-native-shell',
                    'ios-native-shell',
                    'react-native-application-bootstrap',
                    'metro-bundler-config',
                  ],
                },
              ],
            },
            // Branch B: both native platform shells, no config file needed.
            { hasAllOf: ['android-native-shell', 'ios-native-shell'] },
            // Branch C: Android bootstrap class plus the iOS shell.
            {
              hasAllOf: [
                'react-native-application-bootstrap',
                'ios-native-shell',
              ],
            },
          ],
        },
      },
    },
    dynamicRelatedTechMap: {
      'expo-modules-coexistence': 'Expo',
    },
    ownerAdapter: (args) =>
      resolveUnitRootOwner({ ...args, extraRootDirectories: ['example'] }),
  });
}
