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
 * Used by the documentation-framework detectors (currently Sphinx and MkDocs).
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
  return excludingNonDocumentationFolders(
    String.raw`(?!(?:.*/)?(?:${MKDOCS_EXTRA_NON_DOCUMENTATION_FOLDERS})/)(?!.*\{\{)${pattern}`,
  );
}
