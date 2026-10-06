import { describe, expect, it } from 'vitest';
import { resolveSphinxProjectOwner } from './resolve-sphinx-project-owner';

/**
 * Owner-resolution spec for Sphinx evidence paths.
 *
 * Every layout below is a real repository from the tree survey, named in the
 * comments. `projectDirectories` is what the Sphinx detector derives once per
 * repo (`deriveSphinxProjectDirectories`): the folder of every non-blocked
 * `conf.py` that also has a direct-child index file (`.` for a root project).
 * The lists are written by hand for each layout, and large repos are abridged
 * to the folders a case needs. This spec covers only what the adapter does with
 * a list; the derivation is not tested here. A row is `[evidence path, expected owner]` when the whole group
 * shares one `projectDirectories` constant.
 *
 * The expected owner is the folder a person would call the Sphinx project for
 * that evidence path (the folder you run `make html` in), decided from the
 * repository's layout and not from what the resolver returns, so a failing case
 * is a real gap in the resolver and not a test to adjust. Decisions baked into
 * the expectations, change them here if you decide otherwise:
 * - A project folder owns its config, index, `_static/`, Makefile and every
 *   page below it, whatever the folder is called.
 * - A project folder named `source` (the `source/` + `build/` split) is owned by
 *   its parent, because the parent is where `make html` runs. At the repo root
 *   that parent is `.`. Other folder names (`src`, `sphinx`) are not special.
 * - A project nested inside another folds into the enclosing project's owner.
 * - Sibling projects stay separate, whatever parent they share.
 * - A root project (`.`) owns every path in the repo.
 * - A file outside any project folder owns its own directory, so it never
 *   passes the detector's gate on its own.
 * - Path case is kept: the owner of `Doc/conf.py` is `Doc`.
 *
 * Test, demo, example, fixture and vendored paths are not this function's job:
 * the detector's entry schemas drop them before the resolver runs.
 */
describe('resolveSphinxProjectOwner (Sphinx projects)', () => {
  describe('a docs folder owns itself and everything below it', () => {
    describe('a plain docs folder', () => {
      // django/django, abridged: `docs/` holds the config, index, static files
      // and Makefile.
      const projectDirectories = ['docs'];
      it.each([
        ['docs/conf.py', 'docs'],
        ['docs/index.txt', 'docs'],
        ['docs/_static/djangodocs.css', 'docs'],
        ['docs/Makefile', 'docs'],
        ['docs/ref/index.txt', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });

    describe('the folder name does not matter', () => {
      // python/cpython: `Doc/` has `contents.rst` and no `index.rst`, and its
      // original case must survive.
      const projectDirectories = ['Doc'];
      it.each([
        ['Doc/conf.py', 'Doc'],
        ['Doc/contents.rst', 'Doc'],
        ['Doc/Makefile', 'Doc'],
        ['Doc/library/index.rst', 'Doc'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });
  });

  describe('a source folder is owned by its parent', () => {
    describe('one source/build split', () => {
      // A `docs/source/conf.py` project, in the layout of openstack/nova's
      // `doc/source`. The Makefile sits in the parent, where `make html` runs.
      const projectDirectories = ['docs/source'];
      it.each([
        ['docs/source/conf.py', 'docs'],
        ['docs/source/index.rst', 'docs'],
        ['docs/source/_static/theme.css', 'docs'],
        ['docs/source/user/index.rst', 'docs'],
        ['docs/Makefile', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });

    describe('a source folder at the repo root', () => {
      // The parent of a root `source/` is the repo root.
      const projectDirectories = ['source'];
      it.each([
        ['source/conf.py', '.'],
        ['source/index.rst', '.'],
        ['Makefile', '.'],
        ['source/guide/intro.rst', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });

    describe('only the name source is special', () => {
      // sympy/sympy: `doc/src` is the Sphinx project; `src` is not `source`.
      const projectDirectories = ['doc/src'];
      it.each([
        ['doc/src/conf.py', 'doc/src'],
        ['doc/src/index.rst', 'doc/src'],
        ['doc/src/_static/custom.css', 'doc/src'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });
  });

  describe('a root project owns the whole repo', () => {
    // A repo whose `conf.py` and `index.rst` sit at the root.
    const projectDirectories = ['.'];
    it.each([
      ['conf.py', '.'],
      ['index.rst', '.'],
      ['_static/custom.css', '.'],
      ['Makefile', '.'],
      ['.readthedocs.yaml', '.'],
      ['guide/index.rst', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
        owner,
      );
    });
  });

  describe('sibling projects stay separate', () => {
    describe('one project per source folder', () => {
      // openstack/nova: four unrelated Sphinx projects, each a `source/`
      // folder under its own parent (the fifth `conf.py`, under
      // `nova/tests/fixtures`, is dropped before the resolver).
      const projectDirectories = [
        'api-guide/source',
        'api-ref/source',
        'doc/source',
        'releasenotes/source',
      ];
      it.each([
        ['api-guide/source/conf.py', 'api-guide'],
        ['api-ref/source/conf.py', 'api-ref'],
        ['api-ref/source/index.rst', 'api-ref'],
        ['doc/source/conf.py', 'doc'],
        ['doc/source/_static/nova.css', 'doc'],
        ['releasenotes/source/conf.py', 'releasenotes'],
        ['releasenotes/source/_templates/layout.html', 'releasenotes'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });

    describe('two projects in one parent', () => {
      // sympy/sympy: `doc/api` and `doc/src` share the parent `doc` and are
      // not merged into it.
      const projectDirectories = ['doc/api', 'doc/src'];
      it.each([
        ['doc/api/conf.py', 'doc/api'],
        ['doc/api/index.rst', 'doc/api'],
        ['doc/src/conf.py', 'doc/src'],
        ['doc/src/_templates/layout.html', 'doc/src'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });
  });

  describe('a nested project folds into the enclosing one', () => {
    describe('a source folder inside another project', () => {
      // pytorch/pytorch: `docs/cpp/source` (owner `docs/cpp`) sits inside the
      // `docs/source` project (owner `docs`), while `functorch/docs/source`
      // is outside it and stays its own project.
      const projectDirectories = [
        'docs/cpp/source',
        'docs/source',
        'functorch/docs/source',
      ];
      it.each([
        ['docs/source/conf.py', 'docs'],
        ['docs/source/_templates/layout.html', 'docs'],
        ['docs/cpp/source/conf.py', 'docs'],
        ['docs/cpp/source/index.md', 'docs'],
        ['functorch/docs/source/conf.py', 'functorch/docs'],
        ['functorch/docs/source/_static/css/theme.css', 'functorch/docs'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });

    describe('a plain folder inside another project', () => {
      // A `docs/` project with a second `conf.py` project at `docs/api`.
      const projectDirectories = ['docs', 'docs/api'];
      it.each([
        ['docs/conf.py', 'docs'],
        ['docs/api/conf.py', 'docs'],
        ['docs/api/index.rst', 'docs'],
      ])('%s -> %s', (path, owner) => {
        expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
          owner,
        );
      });
    });
  });

  describe('a file outside every project resolves to its own folder', () => {
    // django/django: `django/urls/conf.py` is a URL configuration, not a
    // Sphinx config. It has no index or `_static/`, so `docs` is the only
    // project and the stray file owns its own folder, which never passes the
    // detector's gate.
    const projectDirectories = ['docs'];
    it.each([
      ['django/urls/conf.py', 'django/urls'],
      ['django/urls/index.txt', 'django/urls'],
      // A one-segment path has no folder, so it falls back to the repo root.
      ['conf.py', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveSphinxProjectOwner({ path, projectDirectories })).toBe(
        owner,
      );
    });
  });

  describe('judgment calls not yet decided', () => {
    it.todo(
      'a project below a workspace container (packages/auth/docs/conf.py): the infrastructure-as-code adapters return the unit packages/auth, the simple Sphinx rules return packages/auth/docs; the expected owner is not decided',
    );
    it.todo(
      'a root .readthedocs.yaml in a repo whose project is docs/: attach it to the docs project, or leave it with owner "."',
    );
    it.todo(
      'a Makefile beside a non-source project folder (sympy doc/Makefile with project doc/src): it sits outside the project, so it owns "doc"; whether it should attach to doc/src is not decided',
    );
  });
});
