/**
 * Regex alternation of directory names whose infrastructure-as-code files are
 * demos or test fixtures, never the repository's own infrastructure:
 * `examples`, `example`, `tests`, `test`, `testdata`, `fixtures`, `spec`. In the
 * 1,802-repo Terraform survey, 177 repos (9.8%) had Terraform only under these
 * names (provider plugins, editors and CLI tools such as
 * hashicorp/vscode-terraform), and in module repos the same files add nothing
 * beyond the root module's own evidence. The Helm survey found the same shape
 * in tool repos: every one of helm/helm's 234 chart directories sits under
 * `testdata`, and helmfile/helmfile's 27 sit under `examples` or `test`.
 * Shared by every infrastructure-as-code provider detector.
 */
const DEMO_AND_TEST_FOLDERS =
  '(?:examples?|tests?|testdata|fixtures|spec)';

/**
 * Builds a full-path regex that matches `pattern` only when no directory
 * segment of the path is a demo or test folder.
 *
 * Inputs: `pattern`, a regex source fragment describing the whole path
 * (without anchors), for example `.*\.tf(?:\.json)?`. It may start with its own
 * lookaheads (for example `(?!\.github/)`), which run after the demo/test one.
 * Output: a regex anchored at both ends, with a negative lookahead that
 * rejects any path containing a whole directory segment from
 * `DEMO_AND_TEST_FOLDERS`.
 * Side effects: none.
 * Invariants: a folder name only counts as a whole segment followed by `/`, so
 * `mytests/main.tf` and a root file named `test.tf` are not excluded. Callers
 * pass it to `findEntriesByPathMatching`, whose input paths are already
 * lowercased by `normalizePath`, so no case flag is needed.
 */
export function excludingDemoAndTestFolders(pattern: string): RegExp {
  return new RegExp(`^(?!(?:.*/)?${DEMO_AND_TEST_FOLDERS}/)${pattern}$`);
}
