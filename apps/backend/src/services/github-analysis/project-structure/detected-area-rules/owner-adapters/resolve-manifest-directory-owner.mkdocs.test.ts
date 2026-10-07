import { describe, expect, it } from 'vitest';
import { resolveManifestDirectoryOwner } from './resolve-manifest-directory-owner';

/**
 * Owner-resolution spec for MkDocs evidence paths. The adapter is shared with
 * the Helm, Pulumi, AWS CDK and Ansible detectors, whose layouts are in
 * `resolve-manifest-directory-owner.helm.test.ts`,
 * `resolve-manifest-directory-owner.pulumi.test.ts`,
 * `resolve-manifest-directory-owner.aws-cdk.test.ts` and
 * `resolve-manifest-directory-owner.ansible.test.ts`.
 *
 * Every layout below is a real repository from the MkDocs tree survey, named in
 * the comments. Several outcomes depend on the other configs in the same repo,
 * so every case passes `manifestDirectories`, the directory of every counted
 * `mkdocs.yml` or `mkdocs.yaml` (`.` for a root config). Large repos are
 * abridged to the directories a case needs. A row is `[evidence path, expected
 * owner]` when the whole group shares one `manifestDirectories` constant.
 *
 * The expected owner is the directory a person would call the MkDocs project
 * for that evidence path, decided from the repository's layout and not from
 * what the resolver returns, so a failing case is a real gap in the resolver
 * and not a test to adjust. Decisions baked into the expectations, change them
 * here if you decide otherwise:
 * - The folder that holds `mkdocs.yml` owns the config and every support file
 *   (`overrides/`, `docs/stylesheets/`, `docs/index.md`, `.pages`) below it,
 *   whatever the folder is called, and whatever `docs_dir` says.
 * - A config nested inside another folds into the enclosing one.
 * - Two or more configs that share a parent directory collapse into that
 *   parent. A lone config keeps its own folder. The parent's name never
 *   matters.
 * - A root config owns every path in the repo.
 * - A workspace unit (`apps/<name>`, `packages/<name>`, ...) owns every config
 *   below it, ahead of the root-config rule.
 * - A support file outside any config folder owns its own directory, so it
 *   never passes the detector's gate on its own.
 *
 * Template, test, demo, sample, vendored and `.github` paths are not this
 * function's job: the detector's entry schemas drop them before the resolver
 * runs.
 */
describe('resolveManifestDirectoryOwner (MkDocs projects)', () => {
  describe('a root config owns the whole repo', () => {
    describe('config and docs/ at the repo root', () => {
      // squidfunk/mkdocs-material: the most common layout, 66.8% of repos.
      const manifestDirectories = ['.'];
      it.each([
        ['mkdocs.yml', '.'],
        ['mkdocs.yaml', '.'],
        ['docs/index.md', '.'],
        ['docs/stylesheets/extra.css', '.'],
        ['docs/javascripts/extra.js', '.'],
        ['material/overrides/home.html', '.'],
        ['.pages', '.'],
        ['docs/guide/.pages', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('a root config beats the configs below it', () => {
      // backstage/mkdocs-monorepo-plugin: a root `mkdocs.yml` plus nested
      // component configs.
      const manifestDirectories = ['.', 'sample/components/a'];
      it.each([
        ['mkdocs.yml', '.'],
        ['docs/index.md', '.'],
        ['sample/components/a/mkdocs.yml', '.'],
        ['sample/components/a/docs/index.md', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('a config in a named folder owns its support files', () => {
    describe('a docs folder', () => {
      // traefik/traefik: `docs/mkdocs.yml` with `docs_dir: content`.
      const manifestDirectories = ['docs'];
      it.each([
        ['docs/mkdocs.yml', 'docs'],
        ['docs/overrides/main.html', 'docs'],
        ['docs/docs/index.md', 'docs'],
        ['docs/docs/stylesheets/extra.css', 'docs'],
        ['docs/.pages', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('the config far from its pages', () => {
      // fmtlib/fmt: `support/mkdocs.yml`, pages in `doc/`. The config folder
      // owns the area; `doc/` is outside it.
      const manifestDirectories = ['support'];
      it.each([
        ['support/mkdocs.yml', 'support'],
        ['support/overrides/main.html', 'support'],
        ['docs/index.md', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('the folder name does not matter', () => {
      const manifestDirectories = ['website'];
      it.each([
        ['website/mkdocs.yml', 'website'],
        ['website/docs/index.md', 'website'],
        ['website/overrides/partials/footer.html', 'website'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('the original case of the folder is kept', () => {
      const manifestDirectories = ['Docs'];
      it.each([
        ['Docs/mkdocs.yml', 'Docs'],
        ['Docs/docs/index.md', 'Docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('sibling configs collapse into their shared parent', () => {
    describe('one config per language folder', () => {
      // fastapi/fastapi, abridged: `docs/<lang>/mkdocs.yml` for many
      // languages.
      const manifestDirectories = ['docs/en', 'docs/hi', 'docs/de'];
      it.each([
        ['docs/en/mkdocs.yml', 'docs'],
        ['docs/en/docs/index.md', 'docs'],
        ['docs/en/overrides/main.html', 'docs'],
        ['docs/hi/mkdocs.yml', 'docs'],
        ['docs/hi/docs/index.md', 'docs'],
        ['docs/de/mkdocs.yml', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('many generated configs', () => {
      // Byron/google-apis-rs, abridged: 328 `gen/<api>-cli/mkdocs.yml`.
      const manifestDirectories = [
        'gen/abusiveexperiencereport1-cli',
        'gen/accessapproval1-cli',
        'gen/accessapproval1_beta1-cli',
      ];
      it.each([
        ['gen/abusiveexperiencereport1-cli/mkdocs.yml', 'gen'],
        ['gen/accessapproval1-cli/mkdocs.yml', 'gen'],
        ['gen/accessapproval1_beta1-cli/mkdocs.yml', 'gen'],
        ['gen/accessapproval1-cli/docs/index.md', 'gen'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('sibling configs at the repo root', () => {
      // The shared parent is the repo root, which is written `.`.
      const manifestDirectories = ['en', 'hi'];
      it.each([
        ['en/mkdocs.yml', '.'],
        ['hi/mkdocs.yml', '.'],
        ['en/docs/index.md', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('configs under different parents stay separate', () => {
    // Two unrelated documentation sites, each in a `docs` folder under its
    // own project folder.
    const manifestDirectories = ['projects/a/docs', 'projects/b/docs'];
    it.each([
      ['projects/a/docs/mkdocs.yml', 'projects/a/docs'],
      ['projects/a/docs/docs/index.md', 'projects/a/docs'],
      ['projects/b/docs/mkdocs.yml', 'projects/b/docs'],
      ['projects/b/docs/overrides/main.html', 'projects/b/docs'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('a nested config folds into the enclosing one', () => {
    // A `site/` config with a second config at `site/sub`.
    const manifestDirectories = ['site', 'site/sub'];
    it.each([
      ['site/mkdocs.yml', 'site'],
      ['site/sub/mkdocs.yml', 'site'],
      ['site/sub/docs/index.md', 'site'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('a workspace unit owns the configs below it', () => {
    describe('a unit with its config at the unit root', () => {
      const manifestDirectories = ['packages/guide', 'packages/api'];
      it.each([
        ['packages/guide/mkdocs.yml', 'packages/guide'],
        ['packages/guide/docs/index.md', 'packages/guide'],
        ['packages/api/mkdocs.yml', 'packages/api'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('a unit with its config in a docs folder', () => {
      // The unit owns the config, not the `docs` folder inside it. The folder
      // a person would call the docs project is `packages/guide/docs`, so this
      // is the known coarser answer.
      const manifestDirectories = ['packages/guide/docs'];
      it.each([
        ['packages/guide/docs/mkdocs.yml', 'packages/guide'],
        ['packages/guide/docs/docs/index.md', 'packages/guide'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('a workspace unit beats a root config', () => {
      const manifestDirectories = ['.', 'apps/web'];
      it.each([
        ['mkdocs.yml', '.'],
        ['docs/index.md', '.'],
        ['apps/web/mkdocs.yml', 'apps/web'],
        ['apps/web/docs/index.md', 'apps/web'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('a support file outside every config folder resolves to its own folder', () => {
    // The only config is `site/mkdocs.yml`; the support files elsewhere belong
    // to no config, so they own their own folder and never pass the gate.
    const manifestDirectories = ['site'];
    it.each([
      ['docs/index.md', 'docs'],
      ['docs/stylesheets/extra.css', 'docs/stylesheets'],
      ['overrides/main.html', 'overrides'],
      ['guide/.pages', 'guide'],
      // A one-segment path has no folder, so it falls back to the repo root.
      ['.pages', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });
});
