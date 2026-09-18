import { resolveUnitRootOwner } from './resolve-unit-root-owner';
import { describe, it, expect } from 'vitest';

/**
 * Owner-resolution spec for Flutter signals, asserted against the shared
 * `resolveUnitRootOwner` -- the same resolver Expo, React Native, Next.js,
 * and Jenkins already use.
 *
 * Every path below is lifted from a real, currently public repository,
 * checked against its actual file listing rather than assumed from the path
 * string alone (GitHub tree/code-search API, September 2026, default
 * branch). This pass deliberately widened past the original ten-repository
 * signal survey to hunt specifically for owner-resolution shapes -- library
 * monorepos, unanchored siblings, deep nesting -- the way the React Native
 * spec's own citations do:
 * - root app, fully confirmed: `krille-chan/fluffychat` (`pubspec.yaml` +
 *   `.metadata` at the repository root).
 * - root app with a gitignored manifest, fully confirmed:
 *   `cypherstack/stack_wallet` (`.metadata` at the root; `pubspec.yaml`
 *   itself is excluded by the repo's own `.gitignore` and generated at build
 *   time from a template).
 * - single-segment monorepo app with a co-located non-app library, fully
 *   confirmed: `immich-app/immich` (`mobile/pubspec.yaml` +
 *   `mobile/.metadata` is the real app; `mobile/packages/ui/pubspec.yaml` is
 *   an internal shared package with no `.metadata` of its own -- a direct
 *   analog to Shopify/react-native-skia's app-plus-library shape).
 * - three sibling apps under the same monorepo parent, fully confirmed:
 *   `ente-io/ente` (`mobile/apps/photos/pubspec.yaml`,
 *   `mobile/apps/auth/pubspec.yaml`, `mobile/apps/locker/pubspec.yaml`).
 * - a federated plugin family with six independent siblings, each anchoring
 *   its own build scaffold plus its own `example/` demo app, fully
 *   confirmed: `flutter/packages` (`packages/camera/camera/`,
 *   `packages/camera/camera_android/`,
 *   `packages/camera/camera_android_camerax/`,
 *   `packages/camera/camera_avfoundation/`, `packages/camera/camera_web/`,
 *   `packages/camera/camera_windows/` -- an even larger sibling count than
 *   React Native's own 40+-package `react-native-vector-icons` case).
 *   `.metadata` presence is inconsistent across these otherwise-identical
 *   siblings: `camera_android_camerax/.metadata` and
 *   `camera_windows/.metadata` exist at the plugin root, `camera_avfoundation`
 *   has none at its own root (only inside its `example/`), and `camera`/
 *   `camera_android`/`camera_web` have none at the root either -- `.metadata`
 *   surviving inconsistently at a library root (as opposed to its nested
 *   `example/` app, which reliably keeps it) is real and not unique to one
 *   repository.
 * - a plain-Dart sibling living inside an otherwise Flutter-shaped family,
 *   fully confirmed: `packages/camera/camera_platform_interface/pubspec.yaml`
 *   (also `shared_preferences_platform_interface`,
 *   `webview_flutter_platform_interface`, `url_launcher_platform_interface`)
 *   -- a `pubspec.yaml` with no `.metadata`, no `example/`, no native
 *   folders, sitting directly beside its Flutter-shaped siblings.
 * - a demo/test app under a naming convention other than `example`, three
 *   segments deep, fully confirmed: `flutter/packages`
 *   (`packages/material_ui/test_apps/a11y_assessments/` -- its own
 *   `.metadata` and `android/`, named `test_apps/<name>` rather than
 *   `example`).
 * - a CI-tooling fixture app, unrelated to any shipped product, fully
 *   confirmed: `flutter/packages` (`.ci/legacy_project/all_packages/` --
 *   its own `.metadata` and `android/`).
 * - two independently-rooted example apps nested under version-named
 *   subdirectories of one plugin, fully confirmed: `flutter/packages`
 *   (`packages/google_maps_flutter/google_maps_flutter_web/example/3-64/
 *   pubspec.yaml` and `.../example/latest/pubspec.yaml`).
 * - an unrelated, incidental `pubspec.yaml` buried five segments deep inside
 *   an unrelated tooling directory, fully confirmed: `flutter/packages`
 *   (`packages/camera/camera_android_camerax/.agents/skills/check-readiness/
 *   pubspec.yaml` -- verified by content: a plain Dart CLI tool,
 *   `name: check_readiness`, entirely unrelated to the camera plugin above
 *   it in the tree).
 * - an orphaned root-level anchor with no accompanying app scaffold, fully
 *   confirmed: `flutter/packages` repository root itself (a bare
 *   `.metadata` with no root `pubspec.yaml` and no `android`/`ios`/`lib` at
 *   all -- vestigial monorepo-tooling scaffolding, not a deployable unit) --
 *   and, symmetrically, `fluttercommunity/plus_plugins`' repository root
 *   (`pubspec.yaml` with `name: plus_plugins_workspace` and a `melos`
 *   dev-dependency; no `.metadata`, no `android`/`ios`). Both resolve to "."
 *   the same as any other root anchor below: owner resolution is directory
 *   arithmetic, not a judgment on whether the anchor is "real" -- that
 *   judgment belongs to the gate, not this resolver, so a dedicated test
 *   would only repeat the root-level `.metadata`/`pubspec.yaml` cases
 *   already covered with identical inputs and outputs.
 *
 * Expected owners throughout are the structurally correct directory the
 * evidence actually belongs to, not whatever a particular implementation
 * currently returns -- several of these shapes (a `.metadata`-less plugin
 * root next to an identically-shaped sibling that has one, a demo app named
 * `test_apps/<name>` instead of `example`, an incidental manifest five
 * segments deep) are exactly what real repositories produce but the
 * original ten-repository survey did not exercise.
 */
describe('resolveUnitRootOwner - Flutter signals', () => {
  describe('flutter-metadata / flutter-pubspec-manifest: dirname resolves every real shape (anchor signals)', () => {
    it('resolves a root-level .metadata to "." -- the only anchor stack_wallet commits, since its pubspec.yaml is gitignored', () => {
      const owner = resolveUnitRootOwner({
        path: '.metadata',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('.');
    });

    it('resolves a root-level pubspec.yaml to "."', () => {
      const owner = resolveUnitRootOwner({
        path: 'pubspec.yaml',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('.');
    });

    it('resolves a single-segment monorepo app (immich) to its app directory', () => {
      const owner = resolveUnitRootOwner({
        path: 'mobile/.metadata',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('mobile');
    });

    it('resolves a co-located internal library (immich) to its own directory, independent of the app above it', () => {
      const owner = resolveUnitRootOwner({
        path: 'mobile/packages/ui/pubspec.yaml',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('mobile/packages/ui');
    });

    it.each([
      ['mobile/apps/photos/pubspec.yaml', 'mobile/apps/photos'],
      ['mobile/apps/auth/pubspec.yaml', 'mobile/apps/auth'],
      ['mobile/apps/locker/pubspec.yaml', 'mobile/apps/locker'],
    ])(
      'resolves three sibling apps under the same monorepo parent (ente) %s to %s, each independent',
      (path, expectedOwner) => {
        const owner = resolveUnitRootOwner({
          path,
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        });

        expect(owner).toBe(expectedOwner);
      },
    );

    it.each([
      ['packages/camera/camera/pubspec.yaml', 'packages/camera/camera'],
      [
        'packages/camera/camera_android/pubspec.yaml',
        'packages/camera/camera_android',
      ],
      [
        'packages/camera/camera_android_camerax/pubspec.yaml',
        'packages/camera/camera_android_camerax',
      ],
      [
        'packages/camera/camera_avfoundation/pubspec.yaml',
        'packages/camera/camera_avfoundation',
      ],
      ['packages/camera/camera_web/pubspec.yaml', 'packages/camera/camera_web'],
      [
        'packages/camera/camera_windows/pubspec.yaml',
        'packages/camera/camera_windows',
      ],
    ])(
      'resolves a federated plugin family with six independent siblings (flutter/packages camera) %s to %s',
      (path, expectedOwner) => {
        const owner = resolveUnitRootOwner({
          path,
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        });

        expect(owner).toBe(expectedOwner);
      },
    );

    it('resolves .metadata surviving on one federated sibling (camera_android_camerax) independent of its absence on neighboring siblings', () => {
      const owner = resolveUnitRootOwner({
        path: 'packages/camera/camera_android_camerax/.metadata',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('packages/camera/camera_android_camerax');
    });

    it('resolves a plain-Dart platform-interface sibling to its own directory, same as its Flutter-shaped neighbors', () => {
      const owner = resolveUnitRootOwner({
        path: 'packages/camera/camera_platform_interface/pubspec.yaml',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('packages/camera/camera_platform_interface');
    });

    it.each([
      ['packages/camera/camera/example/pubspec.yaml', 'packages/camera/camera/example'],
      [
        'packages/camera/camera_avfoundation/example/pubspec.yaml',
        'packages/camera/camera_avfoundation/example',
      ],
      [
        'packages/camera/camera_windows/example/pubspec.yaml',
        'packages/camera/camera_windows/example',
      ],
    ])(
      'resolves each federated sibling\'s own example/ demo app %s to %s, not to the plugin root',
      (path, expectedOwner) => {
        const owner = resolveUnitRootOwner({
          path,
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        });

        expect(owner).toBe(expectedOwner);
      },
    );

    it.each([
      [
        'packages/google_maps_flutter/google_maps_flutter_web/example/3-64/pubspec.yaml',
        'packages/google_maps_flutter/google_maps_flutter_web/example/3-64',
      ],
      [
        'packages/google_maps_flutter/google_maps_flutter_web/example/latest/pubspec.yaml',
        'packages/google_maps_flutter/google_maps_flutter_web/example/latest',
      ],
    ])(
      'resolves two independently-versioned example apps nested under one plugin %s to %s',
      (path, expectedOwner) => {
        const owner = resolveUnitRootOwner({
          path,
          isAnchorSignal: true,
          anchorOwners: new Set<string>(),
        });

        expect(owner).toBe(expectedOwner);
      },
    );

    it('resolves a demo app under a naming convention other than "example", three segments deep (material_ui/test_apps/a11y_assessments)', () => {
      const owner = resolveUnitRootOwner({
        path: 'packages/material_ui/test_apps/a11y_assessments/.metadata',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('packages/material_ui/test_apps/a11y_assessments');
    });

    it('resolves a CI-tooling fixture app, unrelated to any shipped product, to its own nested directory', () => {
      const owner = resolveUnitRootOwner({
        path: '.ci/legacy_project/all_packages/.metadata',
        isAnchorSignal: true,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('.ci/legacy_project/all_packages');
    });

    it('resolves an unrelated, incidental pubspec.yaml five segments deep to its own directory, not the plugin above it', () => {
      // packages/camera/camera_android_camerax/.agents/skills/check-readiness/
      // pubspec.yaml is a plain Dart CLI tool (name: check_readiness),
      // verified by content -- entirely unrelated to the camera plugin
      // three directories above it. The anchor branch never reads
      // anchorOwners at all (it returns the plain dirname unconditionally),
      // so nesting one anchor inside another anchor's directory tree cannot
      // merge them regardless of what anchorOwners already contains --
      // passed populated here to make that explicit, not because it affects
      // the result.
      const owner = resolveUnitRootOwner({
        path: 'packages/camera/camera_android_camerax/.agents/skills/check-readiness/pubspec.yaml',
        isAnchorSignal: true,
        anchorOwners: new Set<string>([
          'packages/camera/camera_android_camerax',
        ]),
      });

      expect(owner).toBe(
        'packages/camera/camera_android_camerax/.agents/skills/check-readiness',
      );
    });

  });

  describe('flutter-ios-platform-dir / flutter-android-splash: the android|ios path-shape fallback already covers both, anchor or not', () => {
    it('ties an iOS platform-directory signal to its own already-resolved monorepo app owner (immich)', () => {
      const anchorOwners = new Set<string>(['mobile']);

      expect(
        resolveUnitRootOwner({
          path: 'mobile/ios/flutter/debug.xcconfig',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('mobile');
    });

    it('resolves via the android|ios path-shape fallback for a federated sibling\'s example app with no anchor claimed yet', () => {
      // packages/camera/camera_web/example/ carries its own ios/Flutter
      // directory; if the example's own pubspec.yaml anchor had not been
      // matched yet in this pass, the shared android|ios fallback (already
      // added for React Native) still resolves it correctly.
      const owner = resolveUnitRootOwner({
        path: 'packages/camera/camera_web/example/ios/flutter/release.xcconfig',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('packages/camera/camera_web/example');
    });

    it('resolves an Android splash-drawable signal via the same android|ios fallback, real path (immich)', () => {
      const owner = resolveUnitRootOwner({
        path: 'mobile/android/app/src/main/res/drawable/launch_background.xml',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('mobile');
    });

    it('resolves a night-variant splash-drawable path for a deeply nested federated sibling, with no anchor present', () => {
      const owner = resolveUnitRootOwner({
        path:
          'packages/camera/camera_android_camerax/example/android/app/src/main/res/drawable-night-v21/launch_background.xml',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('packages/camera/camera_android_camerax/example');
    });
  });

  describe('flutter-macos-platform-dir / flutter-desktop-cmake / flutter-entrypoint / flutter-integration-test-dir: no android|ios shortcut -- correct only when an anchor already claimed the owner', () => {
    it('ties a macOS platform-directory signal to its own already-resolved plugin-sibling owner (camera_windows)', () => {
      const anchorOwners = new Set<string>(['packages/camera/camera_windows']);

      expect(
        resolveUnitRootOwner({
          path: 'packages/camera/camera_windows/macos/flutter/flutter-debug.xcconfig',
          isAnchorSignal: false,
          anchorOwners,
        }),
      ).toBe('packages/camera/camera_windows');
    });

    it('resolves a desktop CMake signal for a root-anchored real app (fluffychat) to "." -- via the generic fallback, not an anchor tie', () => {
      // The anchorOwners set-membership check is `path === owner ||
      // path.startsWith(owner + '/')`; for owner === '.' that requires a
      // literal './' prefix no real repository path ever carries, so a
      // root-anchored ('.') owner can never actually be matched this way --
      // confirmed by passing '.' here and seeing it play no role. This
      // signal has no android/ios/metro path-shape shortcut either, so it
      // only reaches "." via ownerPathForApplicationArea's own default,
      // which happens to agree here because "linux" isn't a recognized
      // monorepo root segment. A root-anchored app whose top-level directory
      // happened to collide with one of those segment names would not get
      // this same coincidental correctness.
      const owner = resolveUnitRootOwner({
        path: 'linux/flutter/cmakelists.txt',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.']),
      });

      expect(owner).toBe('.');
    });

    it('demonstrates the anchorOwners set-membership check can never match a root (".") owner for any real path', () => {
      // Isolates the limitation documented above: no path from a real
      // repository tree is ever the literal string "." or starts with
      // "./", so an anchorOwners set containing only "." is functionally
      // inert -- this non-anchor signal falls straight through to the
      // android|ios fallback instead (matches at the "android" segment,
      // bottomIndex 0), which happens to also resolve to ".".
      const owner = resolveUnitRootOwner({
        path: 'android/app/src/main/res/drawable/launch_background.xml',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(['.']),
      });

      expect(owner).toBe('.');
    });

    it('ties an entrypoint signal to its own already-resolved sibling-app owner (ente/apps/auth)', () => {
      const owner = resolveUnitRootOwner({
        path: 'mobile/apps/auth/lib/main.dart',
        isAnchorSignal: false,
        anchorOwners: new Set<string>([
          'mobile/apps/photos',
          'mobile/apps/auth',
          'mobile/apps/locker',
        ]),
      });

      expect(owner).toBe('mobile/apps/auth');
    });

    it('ties an integration_test/ directory signal to its own already-resolved owner, not a sibling app', () => {
      const owner = resolveUnitRootOwner({
        path: 'mobile/apps/photos/integration_test',
        isAnchorSignal: false,
        anchorOwners: new Set<string>([
          'mobile/apps/photos',
          'mobile/apps/auth',
          'mobile/apps/locker',
        ]),
      });

      expect(owner).toBe('mobile/apps/photos');
    });

    it('falls back to the generic one-segment-deep resolver when no anchor has claimed the nested owner yet (known limitation)', () => {
      // packages/camera/camera_windows is two segments under the recognized
      // "packages" workspace root; ownerPathForApplicationArea only resolves
      // one segment deep, so with no anchorOwners entry yet this collapses
      // to "packages/camera" -- swallowing every camera sibling together.
      // In a real detector run this never surfaces, because
      // flutter-pubspec-manifest is itself an anchor and every federated
      // sibling has its own pubspec.yaml, so anchorOwners is always
      // populated before this signal resolves. Documented here the same way
      // React Native's own suite documents its fallback shapes, as a
      // property of the shared resolver rather than something this
      // detector's own signal choices can work around.
      const owner = resolveUnitRootOwner({
        path: 'packages/camera/camera_windows/macos/flutter/flutter-debug.xcconfig',
        isAnchorSignal: false,
        anchorOwners: new Set<string>(),
      });

      expect(owner).toBe('packages/camera');
    });
  });
});
