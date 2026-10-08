/**
 * Regex for a directory name that contains `test` or `tests` as a delimited
 * word: `tests`, `rtd_tests`, `test-resources`, `test-root`. The word must be
 * the whole name or be separated from the rest by `_` or `-`, so `latest`,
 * `contest` and `mytests` do not match. The exact `tests?` used by the
 * infrastructure-as-code helper misses `rtd_tests/` and `test-resources/`; in
 * the 1,420-`conf.py` Sphinx survey this word form covered 474 files (175 of
 * Sphinx's own 176 sit under `tests/roots/test-*`).
 */
const TEST_WORD_FOLDER = String.raw`(?:[^/]*[_-])?tests?(?:[_-][^/]*)?`;

/**
 * Regex alternation of directory names whose documentation-framework files are
 * test roots, demos, vendored copies or fixtures, never the repository's own
 * documentation project:
 * - test folders, as a delimited word (see `TEST_WORD_FOLDER`);
 * - `demo`, `demos` (40 `conf.py` files: theme demos and vendored library docs
 *   such as `demo/.../lvgl/docs`; not covered by the infrastructure-as-code
 *   helper);
 * - `example`, `examples`, `testdata`, `fixtures`, `spec` (46 files; the same
 *   names as the infrastructure-as-code helper);
 * - vendored trees: `vendor`, `third_party`, `3rdparty`, `external`, `extern`,
 *   `node_modules`, `site-packages` (1 file observed, u-boot
 *   `lib/mbedtls/external/mbedtls/docs`; the rest follows the
 *   infrastructure-as-code precedent).
 * Used by the documentation-framework detectors (Sphinx, MkDocs, Docusaurus,
 * mdBook, Starlight, DocFX, Antora, Fumadocs, VitePress, VuePress, Dumi and
 * Rspress).
 */
const NON_DOCUMENTATION_FOLDERS = `(?:${TEST_WORD_FOLDER}|demos?|examples?|testdata|fixtures|spec|vendor|third_party|3rdparty|external|extern|node_modules|site-packages)`;

/**
 * Builds a full-path regex that matches `pattern` only when no directory
 * segment of the path is a test, demo, example, fixture or vendored folder.
 *
 * Inputs: `pattern`, a regex source fragment describing the whole path
 * (without anchors), for example `.*conf\.py`. It may start with its own
 * lookaheads, which run after the folder one.
 * Output: a regex anchored at both ends, with a negative lookahead that
 * rejects any path containing a whole directory segment from
 * `NON_DOCUMENTATION_FOLDERS`.
 * Side effects: none.
 * Invariants: a name only counts as a whole directory segment followed by `/`,
 * so `latest/conf.py`, `vendored/conf.py` and a root file named `test.py` are
 * not excluded, while `docs/rtd_tests/conf.py` and `vendor/x/conf.py` are.
 * Callers pass it to `findEntriesByPathMatching`, whose input paths are already
 * lowercased by `normalizePath`, so no case flag is needed. This list is
 * deliberately separate from the infrastructure-as-code one so widening it
 * never changes the finished infrastructure detectors.
 */
export function excludingNonDocumentationFolders(pattern: string): RegExp {
  return new RegExp(`^(?!(?:.*/)?${NON_DOCUMENTATION_FOLDERS}/)${pattern}$`);
}

/**
 * Regex alternation of extra directory names that only the MkDocs detector
 * rejects, on top of `NON_DOCUMENTATION_FOLDERS`. From the survey of 1,227
 * repositories with a `mkdocs.yml` (583 of 5,162 anchor files, 168 repos with
 * no anchor left, 13.7%):
 * - `.github` (86 files): a workflow named `mkdocs.yml`, at any depth;
 * - generated-project templates: `templates?`, `cookiecutter`, `skeleton`,
 *   `boilerplate`, `scaffold`, `archetypes?`;
 * - vendored or bundled copies: `vendors`, `third[_-]party`, `includes`
 *   (Dolibarr's `htdocs/includes/...`), `wiki`;
 * - demo-like names: `__fixtures__`, `samples?`, `playground`, `sandbox`, a name
 *   that starts with `demo`, `sample` or `example` followed by `-` or `_`
 *   (`demo-mkdocs`, `sample-docs`), and a name that ends with `-demo`,
 *   `-sample` or `-example`, plural or not.
 * Test folders such as `__tests__` and `test-project` are already covered by
 * the shared test word. Kept out of `NON_DOCUMENTATION_FOLDERS` so widening
 * the MkDocs list never changes the Sphinx detector; none of these names was
 * checked against the Sphinx survey.
 */
const MKDOCS_EXTRA_NON_DOCUMENTATION_FOLDERS = [
  String.raw`\.github`,
  String.raw`templates?`,
  'cookiecutter',
  'skeleton',
  'boilerplate',
  'scaffold',
  String.raw`archetypes?`,
  'vendors',
  String.raw`third[_-]party`,
  'includes',
  'wiki',
  '__fixtures__',
  String.raw`samples?`,
  'playground',
  'sandbox',
  String.raw`(?:demo|sample|example)s?[-_][^/]*`,
  String.raw`[^/]+[-_](?:demo|sample|example)s?`,
].join('|');

/**
 * Builds a full-path regex that rejects the shared folders plus one detector's
 * own extra folder names, then matches `pattern`. Shared by the MkDocs,
 * Docusaurus, mdBook, VitePress and VuePress builders so all stack their
 * lookaheads in the same order.
 *
 * Inputs: `extraFolders`, a regex alternation of directory names to reject on
 * top of `NON_DOCUMENTATION_FOLDERS`, and `pattern`, a regex source fragment
 * describing the whole path (without anchors). `pattern` may start with its own
 * lookaheads, which run last.
 * Output: a regex anchored at both ends. A name only counts as a whole
 * directory segment followed by `/`.
 * Side effects: none.
 */
function excludingWithExtraFolders({
  extraFolders,
  pattern,
}: {
  extraFolders: string;
  pattern: string;
}): RegExp {
  return excludingNonDocumentationFolders(
    String.raw`(?!(?:.*/)?(?:${extraFolders})/)${pattern}`,
  );
}

/**
 * Builds a full-path regex for the MkDocs detector: everything
 * `excludingNonDocumentationFolders` rejects, plus the MkDocs-only folder
 * names above and any path that contains a `{{` template placeholder.
 *
 * Inputs: `pattern`, a regex source fragment describing the whole path
 * (without anchors), for example `.*mkdocs\.ya?ml`.
 * Output: a regex anchored at both ends. The shared folder lookahead runs
 * first, then the MkDocs folder lookahead, then the `{{` lookahead, then
 * `pattern`.
 * Side effects: none.
 * Invariants: a name only counts as a whole directory segment followed by `/`,
 * so `docs/mkdocs.yml`, `mkdocs.yml` and `my-templates-docs`-style names that
 * merely contain a listed word are kept, while `templates/mkdocs.yml`,
 * `demo-mkdocs/mkdocs.yml` and `{{cookiecutter.slug}}/mkdocs.yml` are
 * rejected. `{{` is rejected anywhere in the path, because a file name with a
 * placeholder is a template whatever its folder is called. Input paths are
 * lowercased by `normalizePath`, so no case flag is needed.
 */
export function excludingMkDocsNonDocumentationFolders(
  pattern: string,
): RegExp {
  return excludingWithExtraFolders({
    extraFolders: MKDOCS_EXTRA_NON_DOCUMENTATION_FOLDERS,
    pattern: String.raw`(?!.*\{\{)${pattern}`,
  });
}

/**
 * Regex alternation of extra directory names that only the Docusaurus detector
 * rejects, on top of `NON_DOCUMENTATION_FOLDERS`. From the survey of 2,413
 * repositories (2,689 bare-anchor repo and folder pairs, 468 of them not real
 * sites):
 * - `__fixtures__`, `__mocks__`: test sites such as the 19 fixture sites inside
 *   facebook/docusaurus (`__tests__` is already covered by the shared test
 *   word, but the shared `fixtures` only matches the bare name);
 * - `templates?`, `create-docusaurus`: the init templates
 *   (`packages/create-docusaurus/templates/classic`);
 * - `samples?`, `playground`, `sandbox`, `starters?`, `e2e`: demo-like sites
 *   inside plugin and theme repositories (`demos?` is already shared);
 * - `.docusaurus` and any folder that starts with it: the generated cache,
 *   which holds a copy of the config (`.docusaurus/docusaurus.config.mjs`) and
 *   would otherwise emit a bogus `.docusaurus` owner (159 repositories).
 * `wiki` is deliberately not listed: the one hit (`apps/wiki`) is a real site.
 * Kept out of `NON_DOCUMENTATION_FOLDERS` so widening the Docusaurus list never
 * changes the Sphinx detector, and out of the MkDocs list so the two surveys
 * stay independent; none of these names was checked against those surveys.
 */
const DOCUSAURUS_EXTRA_NON_DOCUMENTATION_FOLDERS = [
  '__fixtures__',
  '__mocks__',
  String.raw`templates?`,
  'create-docusaurus',
  String.raw`samples?`,
  'playground',
  'sandbox',
  String.raw`starters?`,
  'e2e',
  String.raw`\.docusaurus[^/]*`,
].join('|');

/**
 * Builds a full-path regex for the Docusaurus detector: everything
 * `excludingNonDocumentationFolders` rejects, plus the Docusaurus-only folder
 * names above.
 *
 * Inputs: `pattern`, a regex source fragment describing the whole path
 * (without anchors), for example `.*docusaurus\.config\.[cm]?[jt]s`.
 * Output: a regex anchored at both ends. The shared folder lookahead runs
 * first, then the Docusaurus folder lookahead, then `pattern`.
 * Side effects: none.
 * Invariants: a name only counts as a whole directory segment followed by `/`,
 * so `website/docusaurus.config.ts` and `my-templates-site/docusaurus.config.ts`
 * are kept, while `templates/classic/docusaurus.config.js`,
 * `src/__fixtures__/site/docusaurus.config.js` and
 * `.docusaurus/docusaurus.config.mjs` are rejected. The `.docusaurus` prefix
 * rule also rejects `.docusaurus-cache/`. Input paths are lowercased by
 * `normalizePath`, so no case flag is needed.
 */
export function excludingDocusaurusNonDocumentationFolders(
  pattern: string,
): RegExp {
  return excludingWithExtraFolders({
    extraFolders: DOCUSAURUS_EXTRA_NON_DOCUMENTATION_FOLDERS,
    pattern,
  });
}

/**
 * Regex alternation of extra directory names that only the mdBook detector
 * rejects, on top of `NON_DOCUMENTATION_FOLDERS`. From a survey of 4,949
 * repositories (5,598 `book.toml` files; the shared list alone already drops
 * about 520 of them, such as the 75 fixture books under `rust-lang/mdBook`'s
 * `tests/` and `examples/`):
 * - `templates?`: generated-project templates
 *   (`battery-packs/ci-battery-pack/templates/mdbook`), 6 folders;
 * - `managed_components`: ESP-IDF's vendored component folder, which ships
 *   `espressif__led_strip/docs/book.toml` into many firmware repositories,
 *   24 folders;
 * - a name that starts with `demo`, `sample` or `example` followed by `-` or
 *   `_` (`example-book`, `sample-book`, `demo-book`, `example_books`,
 *   `sample_project`), 22 folders and every one a demo or generated copy.
 * Deliberately absent: the MkDocs rule for names that END in `-demo`,
 * `-sample` or `-example`. In this survey it would have rejected 18 folders,
 * 10 of them `rust-by-example` (a flagship mdBook) and another a real book
 * called `python-testing-demo`. `wiki` is also absent because the five hits
 * are real books. Kept out of the shared list so widening it never changes the
 * Sphinx, MkDocs or Docusaurus detectors.
 */
const MDBOOK_EXTRA_NON_DOCUMENTATION_FOLDERS = [
  String.raw`templates?`,
  'managed_components',
  String.raw`(?:demo|sample|example)s?[-_][^/]*`,
].join('|');

/**
 * Builds a full-path regex for the mdBook detector: everything
 * `excludingNonDocumentationFolders` rejects, plus the mdBook-only folder
 * names above and any path that contains a `{{` template placeholder.
 *
 * Inputs: `pattern`, a regex source fragment describing the whole path
 * (without anchors), for example `.*book\.toml`.
 * Output: a regex anchored at both ends. The shared folder lookahead runs
 * first, then the mdBook folder lookahead, then the `{{` lookahead, then
 * `pattern`.
 * Side effects: none.
 * Invariants: a name only counts as a whole directory segment followed by `/`,
 * so `docs/book.toml`, `src/doc/rust-by-example/book.toml`,
 * `books/python-testing-demo/book.toml` and `my-templates-docs/book.toml` are
 * kept, while `templates/mdbook/book.toml`, `example-book/book.toml`,
 * `x/managed_components/y/book.toml` and `{{ name }}/book.toml` are rejected.
 * Input paths are lowercased by `normalizePath`, so no case flag is needed.
 */
export function excludingMdBookNonDocumentationFolders(
  pattern: string,
): RegExp {
  return excludingWithExtraFolders({
    extraFolders: MDBOOK_EXTRA_NON_DOCUMENTATION_FOLDERS,
    pattern: String.raw`(?!.*\{\{)${pattern}`,
  });
}

/**
 * Regex alternative for a generated-project template folder (`template`,
 * `templates`). Shared by the VitePress and VuePress extra lists below, whose
 * surveys both found it to be scaffolding rather than a site; the earlier
 * MkDocs, Docusaurus and mdBook lists still spell it inline.
 */
const TEMPLATE_FOLDERS = String.raw`templates?`;

/**
 * Regex alternation of extra directory names that only the VitePress detector
 * rejects, on top of `NON_DOCUMENTATION_FOLDERS`. From the survey of 568
 * repositories (378 `.vitepress` folders, 17 of them already dropped by the
 * shared list: 5 committed `node_modules/vitepress/template` copies, 8 under
 * `example(s)`, 2 `demo` and 2 test folders):
 * - `templates?`, `template-*`: the init scaffolds (`vuejs/vitepress`
 *   `template/`, `create/template`, `template-ts/docs`,
 *   `template-vue-ts/docs`), 4 folders and every one a generated-project copy;
 * - `playground`, `.playground`: plugin and theme demo sites, 3 folders. The
 *   evidence is thin, and together with the templates 3 repositories lose
 *   their only site.
 * Deliberately absent: `e2e` (one fixture in a repository that keeps its real
 * `docs`), and the MkDocs, Docusaurus and mdBook names `.github`, `wiki`,
 * `includes`, `vendors`, `samples?`, `sandbox`, `{{` and the demo-style
 * prefixes and suffixes, which had zero hits among the surveyed folders. Kept
 * out of the shared list so widening it never changes the other
 * documentation-framework detectors.
 */
const VITEPRESS_EXTRA_NON_DOCUMENTATION_FOLDERS = [
  TEMPLATE_FOLDERS,
  String.raw`template-[^/]*`,
  String.raw`\.?playground`,
].join('|');

/**
 * Builds a full-path regex for the VitePress detector: everything
 * `excludingNonDocumentationFolders` rejects, plus the VitePress-only folder
 * names above.
 *
 * Inputs: `pattern`, a regex source fragment describing the whole path
 * (without anchors), for example `(?:.*\/)?\.vitepress`.
 * Output: a regex anchored at both ends. The shared folder lookahead runs
 * first, then the VitePress folder lookahead, then `pattern`.
 * Side effects: none.
 * Invariants: a name only counts as a whole directory segment followed by `/`,
 * so `docs/.vitepress` and `my-templates-site/.vitepress` are kept, while
 * `template/.vitepress`, `template-ts/docs/.vitepress` and
 * `.playground/.vitepress` are rejected. The `.vitepress` directory entry
 * itself is the last segment and has no trailing `/`, so it is never rejected
 * as its own parent. Input paths are lowercased by `normalizePath`, so no case
 * flag is needed.
 */
export function excludingVitePressNonDocumentationFolders(
  pattern: string,
): RegExp {
  return excludingWithExtraFolders({
    extraFolders: VITEPRESS_EXTRA_NON_DOCUMENTATION_FOLDERS,
    pattern,
  });
}

/**
 * Regex alternation of extra directory names that only the VuePress detector
 * rejects, on top of `NON_DOCUMENTATION_FOLDERS`. From the survey of 585
 * repositories (505 `.vuepress` folders, 93 of them already dropped by the
 * shared list, nearly all real theme and plugin test and demo sites):
 * - `templates?`: generated-project scaffolds (`create-vuepress` templates,
 *   plume `cli/templates`, theme-hope `packages/create/template`), 6 folders,
 *   none a real site, each of which scores 5 to 8 and would emit.
 * Deliberately absent: `.history` (one editor-history copy whose dated configs
 * score 2, under the emission floor), the MkDocs names (`.github`,
 * `cookiecutter`, `skeleton`, `samples?`, `playground`, `sandbox`, demo-style
 * prefixes and suffixes, `{{`), which had zero hits, `wiki`, `vendors` and
 * `includes`, whose one hit is a real site, and the Docusaurus and mdBook
 * names (`e2e` hit two folders inside VuePress's own repositories and is too
 * specific to keep). Kept out of the shared list so widening it never changes
 * the other documentation-framework detectors.
 */
const VUEPRESS_EXTRA_NON_DOCUMENTATION_FOLDERS = TEMPLATE_FOLDERS;

/**
 * Builds a full-path regex for the VuePress detector: everything
 * `excludingNonDocumentationFolders` rejects, plus the VuePress-only folder
 * names above.
 *
 * Inputs: `pattern`, a regex source fragment describing the whole path
 * (without anchors), for example `(?:.*\/)?\.vuepress`.
 * Output: a regex anchored at both ends. The shared folder lookahead runs
 * first, then the VuePress folder lookahead, then `pattern`.
 * Side effects: none.
 * Invariants: a name only counts as a whole directory segment followed by `/`,
 * so `docs/.vuepress` and `my-templates-site/.vuepress` are kept, while
 * `cli/templates/.vuepress/config.ts` and `packages/create/template/docs` paths
 * are rejected. The `.vuepress` directory entry itself is the last segment and
 * has no trailing `/`, so it is never rejected as its own parent; a
 * `.vuepress/templates/` folder inside a site is rejected, which only drops the
 * v1 HTML-template files. Input paths are lowercased by `normalizePath`, so no
 * case flag is needed.
 */
export function excludingVuePressNonDocumentationFolders(
  pattern: string,
): RegExp {
  return excludingWithExtraFolders({
    extraFolders: VUEPRESS_EXTRA_NON_DOCUMENTATION_FOLDERS,
    pattern,
  });
}
