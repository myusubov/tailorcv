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
 * Used by the documentation-framework detectors (currently Sphinx).
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
