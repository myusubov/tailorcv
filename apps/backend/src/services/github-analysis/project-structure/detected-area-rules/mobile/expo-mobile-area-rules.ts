import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { applyDeclarativeAreaDetector } from '../declarative-area-rule-engine';
import { resolveUnitRootOwner } from '../owner-adapters';

/**
 * Path-only Expo signal contract for owner-scoped scoring.
 *
 * Three anchors, none trusted to emit alone (see the gate below) -- a
 * GitHub code-search sample of ~90 real repositories found a real collision
 * for one of them:
 * - `expo-router-typed-env` (`expo-env.d.ts`): Expo CLI-generated, only for
 *   typed-routes projects. No collision found in the sample, but the file is
 *   commonly gitignored by `create-expo-app`, so recall in a real tree may be
 *   low even on a genuine Expo project.
 * - `expo-dynamic-config` (`app.config.ts`/`.js`): the highest-risk anchor --
 *   Nuxt 3 ships an identically named, identically placed "App Config" file.
 *   This accounted for roughly half the false positives sampled (13 of 28).
 * - `expo-router-root-layout` (`app/_layout.*`): zero false positives across
 *   30 sampled hits. A manually reconfigured TanStack Router project (whose
 *   routes root defaults to `src/routes/`, not `app/`) could theoretically
 *   still collide -- a documented, unobserved residual risk.
 *
 * Two supportive signals corroborate an anchor without being trusted alone:
 * - `metro-bundler-config` (`metro.config.js`): zero false positives across
 *   30 sampled hits -- React Native's bundler, not used outside that world.
 * - `eas-build-config` (`eas.json`): zero false positives sampled; proves EAS
 *   usage but not which owner path in a monorepo is the Expo app.
 *
 * `expo-static-config` (`app.json`) stays a weak tiebreaker only: React
 * Native CLI ships an `app.json` with the identical basename, and this
 * engine cannot read file contents to tell the two apart.
 */
const EXPO_MOBILE_SIGNAL_SCORES = {
  'expo-router-typed-env': 5,
  'expo-dynamic-config': 4,
  'expo-router-root-layout': 5,
  'metro-bundler-config': 3,
  'eas-build-config': 3,
  'expo-static-config': 1,
} as const;

type ExpoMobileSignal = keyof typeof EXPO_MOBILE_SIGNAL_SCORES;

/**
 * Adds a `Mobile app` candidate for Expo evidence.
 *
 * Inputs: `context.candidates` (shared `(area name, owner path)` map, mutated in
 * place) and `context.index` (repository path/name/extension lookup).
 * Output: none.
 * Side effects: adds or accumulates a `Mobile app` candidate with primary
 * technology `Expo` (related: `React Native`) for every owner whose counted
 * signals clear the gate, or contributes score/evidence and rides along in
 * `related` for an owner an earlier-dispatched provider already claimed.
 *
 * Owner: `resolveUnitRootOwner`, with `extraRootDirectories: ['example']` so
 * a library repo's demo app (e.g. `example/eas.json` in an npm package whose
 * root is not itself an Expo app) resolves to `example` rather than the
 * repository root when no anchor nearby already claims it. Reconciling
 * multiple Expo signals across different owner paths in a monorepo (e.g.
 * `app.config.ts` under `apps/mobile/` versus a root `eas.json`) is deferred
 * to a separate owner-resolution research pass.
 *
 * Gate: at least one anchor signal must be counted, and it can never clear
 * alone -- it must be paired with either a second anchor or a supportive
 * signal. This directly closes the highest false-positive risk found in
 * research: a lone `app.config.ts` with nothing else (the Nuxt shape) now
 * fails the gate outright, while every sampled real Expo repo still clears
 * it.
 *
 * Limitations:
 * - Path-only, so the `"expo"` key inside `app.json`/`app.config.*` and the
 *   `expo`/`expo-router` `package.json` dependencies cannot be read to
 *   disambiguate further -- every signal here had to survive without them.
 * - `expo-env.d.ts` is commonly gitignored, so it may be absent from a real
 *   repository's tracked tree even on a genuine Expo app.
 * - `metro-bundler-config` only matches the `.js` extension; the `.cjs`/`.mjs`
 *   variants observed once in the sample are not matched.
 * - Research-stage scores and gate shape -- not yet cross-checked for overlap
 *   against the React Native, Flutter, Android, or iOS signal sets.
 */
export function addExpoMobileAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  applyDeclarativeAreaDetector<ExpoMobileSignal>({
    candidates,
    index,
    detectedArea: 'Mobile app',
    primaryTech: 'Expo',
    relatedTechs: ['React Native'],
    signalScores: EXPO_MOBILE_SIGNAL_SCORES,
    entrySchemas: [
      {
        signalType: 'expo-router-typed-env',
        regex: /^expo-env\.d\.ts$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'expo-dynamic-config',
        regex: /^app\.config\.(ts|js)$/,
        indexMethod: 'findFilesByNameMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'expo-router-root-layout',
        regex: /(^|\/)app\/_layout\.(tsx|jsx|ts|js)$/,
        indexMethod: 'findEntriesByPathMatching',
        isAnchorSignal: true,
      },
      {
        signalType: 'metro-bundler-config',
        regex: /^metro\.config\.js$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'eas-build-config',
        regex: /^eas\.json$/,
        indexMethod: 'findFilesByNameMatching',
      },
      {
        signalType: 'expo-static-config',
        regex: /^app\.json$/,
        indexMethod: 'findFilesByNameMatching',
      },
    ],
    gateBlocker: {
      where: {
        countedSignals: {
          or: [
            // one anchor + one independent corroborator
            {
              and: [
                {
                  hasOneOf: [
                    'expo-router-typed-env',
                    'expo-dynamic-config',
                    'expo-router-root-layout',
                  ],
                },
                {
                  hasOneOf: [
                    'metro-bundler-config',
                    'eas-build-config',
                    'expo-static-config',
                  ],
                },
              ],
            },
            // two anchors together, no corroborator needed
            { hasAllOf: ['expo-router-typed-env', 'expo-dynamic-config'] },
            {
              hasAllOf: ['expo-router-typed-env', 'expo-router-root-layout'],
            },
            {
              hasAllOf: ['expo-dynamic-config', 'expo-router-root-layout'],
            },
          ],
        },
      },
    },
    ownerAdapter: (args) =>
      resolveUnitRootOwner({ ...args, extraRootDirectories: ['example'] }),
  });
}
